"""Dedicated negotiation flow: buyer offers price, system auto-replies based on farmer's min_negotiable_price."""
import random
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from core.security import get_current_user, get_db, require_role
from db.models import (
    CartItem,
    Negotiation,
    NegotiationMessage,
    PersonalProductOffer,
    Product,
    User,
    UserRole,
)
from schemas.negotiation import (
    NegotiationOfferIn,
    NegotiationOfferResponse,
    NegotiationRead,
    NegotiationMessageRead,
)

router = APIRouter()

# Varied, natural-sounding farmer replies (rejection – first low offer)
REJECT_MESSAGES = [
    "That’s a bit low for me — my costs don’t allow going that low.",
    "I can’t do that rate; I’d be selling at a loss.",
    "Sorry, that price won’t work for me. I have to cover my inputs and labour.",
    "I appreciate the offer, but I can’t go that low and still make it worthwhile.",
    "That’s below what I can reasonably offer. Let me know if you can come a little higher.",
    "I’m afraid I can’t match that — my minimum is a bit higher.",
    "That would hurt my margin. I need to stay closer to my listed price.",
    "I can’t go that low, but we can try to find a middle ground.",
]

# Shorter replies for repeated low offers (feels like real back-and-forth)
REJECT_SHORT_MESSAGES = [
    "Still too low for me.",
    "I can’t do that.",
    "Need a bit more than that.",
    "That won’t work, sorry.",
    "My minimum is higher than that.",
    "Can’t go that low.",
    "Let’s try a higher number.",
    "I’d need more than that.",
]

ACCEPT_MESSAGES = [
    "That works for me. Confirm the offer and I’ll add it for you.",
    "Done. Go ahead and confirm to add it to your cart.",
    "I can do that. Confirm when you’re ready.",
    "Agreed. Confirm the offer to add it to your cart.",
    "That price is fine. Confirm and we’re good.",
]


def _negotiation_to_read(n: Negotiation) -> NegotiationRead:
    messages = [
        NegotiationMessageRead(
            id=m.id,
            sender_type=m.sender_type,
            message_text=m.message_text,
            offer_amount=float(m.offer_amount) if m.offer_amount is not None else None,
            created_at=m.created_at,
        )
        for m in sorted(n.messages, key=lambda x: x.created_at)
    ]
    return NegotiationRead(
        id=n.id,
        buyer_id=n.buyer_id,
        product_id=n.product_id,
        farmer_id=n.farmer_id,
        status=n.status,
        created_at=n.created_at,
        updated_at=n.updated_at,
        messages=messages,
    )


@router.post("/start", response_model=NegotiationRead)
def start_negotiation(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start or get existing negotiation for this buyer + product. Buyer only."""
    if current_user.role != UserRole.BUYER:
        raise HTTPException(status_code=403, detail="Only buyers can start negotiations")
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.quantity < 1:
        raise HTTPException(status_code=400, detail="Product is out of stock")
    existing = (
        db.query(Negotiation)
        .filter(
            Negotiation.buyer_id == current_user.id,
            Negotiation.product_id == product_id,
        )
        .options(joinedload(Negotiation.messages))
        .first()
    )
    if existing:
        if existing.status == "confirmed":
            # Let buyer negotiate again: reset to ongoing and clear messages
            for m in existing.messages:
                db.delete(m)
            existing.status = "ongoing"
            db.commit()
            db.refresh(existing)
            existing = (
                db.query(Negotiation)
                .filter(Negotiation.id == existing.id)
                .options(joinedload(Negotiation.messages))
                .first()
            )
        return _negotiation_to_read(existing)
    neg = Negotiation(
        buyer_id=current_user.id,
        product_id=product_id,
        farmer_id=product.farmer_id,
        status="ongoing",
    )
    db.add(neg)
    db.commit()
    db.refresh(neg)
    neg = (
        db.query(Negotiation)
        .filter(Negotiation.id == neg.id)
        .options(joinedload(Negotiation.messages))
        .first()
    )
    return _negotiation_to_read(neg)


@router.get("/{negotiation_id}", response_model=NegotiationRead)
def get_negotiation(
    negotiation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get negotiation with messages. Buyer or farmer of the product only."""
    neg = (
        db.query(Negotiation)
        .filter(Negotiation.id == negotiation_id)
        .options(joinedload(Negotiation.messages))
        .first()
    )
    if not neg:
        raise HTTPException(status_code=404, detail="Negotiation not found")
    if current_user.id != neg.buyer_id and current_user.id != neg.farmer_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    return _negotiation_to_read(neg)


@router.post("/{negotiation_id}/offer", response_model=NegotiationOfferResponse)
def send_offer(
    negotiation_id: int,
    body: NegotiationOfferIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Buyer sends an offer (₹/kg). System auto-replies based on product.min_negotiable_price."""
    neg = (
        db.query(Negotiation)
        .filter(Negotiation.id == negotiation_id)
        .options(joinedload(Negotiation.messages), joinedload(Negotiation.product))
        .first()
    )
    if not neg:
        raise HTTPException(status_code=404, detail="Negotiation not found")
    if current_user.id != neg.buyer_id:
        raise HTTPException(status_code=403, detail="Only the buyer can send offers")
    if neg.status != "ongoing":
        raise HTTPException(status_code=400, detail="Negotiation already concluded")
    product = neg.product
    if not product or product.quantity < 1:
        raise HTTPException(status_code=400, detail="Product unavailable")
    price_offered = body.price_per_unit
    if price_offered <= 0:
        raise HTTPException(status_code=400, detail="Offer must be positive")

    # Buyer message
    buyer_msg = NegotiationMessage(
        negotiation_id=neg.id,
        sender_type="buyer",
        message_text=f"Can you give me for ₹{price_offered:.2f} per kg?",
        offer_amount=price_offered,
    )
    db.add(buyer_msg)
    db.flush()

    min_price = product.min_negotiable_price
    if min_price is None:
        min_price = float(product.price)  # No discount allowed
    else:
        min_price = float(min_price)

    if price_offered < min_price:
        # Reject: varied natural reply for first low offer, shorter for repeated
        prev_offers = [m.offer_amount for m in neg.messages if m.sender_type == "buyer" and m.offer_amount is not None]
        system_text = random.choice(REJECT_MESSAGES) if len(prev_offers) <= 1 else random.choice(REJECT_SHORT_MESSAGES)
    else:
        # Accept: varied natural reply
        system_text = random.choice(ACCEPT_MESSAGES)
        neg.status = "accepted"

    system_msg = NegotiationMessage(
        negotiation_id=neg.id,
        sender_type="system",
        message_text=system_text,
        offer_amount=None,
    )
    db.add(system_msg)
    db.commit()
    db.refresh(neg)
    neg = (
        db.query(Negotiation)
        .filter(Negotiation.id == neg.id)
        .options(joinedload(Negotiation.messages))
        .first()
    )
    accepted = neg.status == "accepted"
    return NegotiationOfferResponse(
        accepted=accepted,
        message=system_text,
        negotiation=_negotiation_to_read(neg),
    )


@router.post("/{negotiation_id}/clear", response_model=NegotiationRead)
def clear_negotiation_chat(
    negotiation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Clear all messages in this negotiation and reset to ongoing. Buyer only."""
    neg = (
        db.query(Negotiation)
        .filter(Negotiation.id == negotiation_id)
        .options(joinedload(Negotiation.messages))
        .first()
    )
    if not neg:
        raise HTTPException(status_code=404, detail="Negotiation not found")
    if current_user.id != neg.buyer_id:
        raise HTTPException(status_code=403, detail="Only the buyer can clear this chat")
    if neg.status == "confirmed":
        raise HTTPException(status_code=400, detail="Cannot clear a confirmed negotiation")

    for m in neg.messages:
        db.delete(m)
    neg.status = "ongoing"
    db.commit()
    db.refresh(neg)
    neg = (
        db.query(Negotiation)
        .filter(Negotiation.id == neg.id)
        .options(joinedload(Negotiation.messages))
        .first()
    )
    return _negotiation_to_read(neg)


@router.post("/{negotiation_id}/confirm")
def confirm_offer(
    negotiation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """When status=accepted, confirm: create PersonalProductOffer, add to cart, set status=confirmed."""
    neg = (
        db.query(Negotiation)
        .filter(Negotiation.id == negotiation_id)
        .options(
            joinedload(Negotiation.product),
            joinedload(Negotiation.messages),
        )
        .first()
    )
    if not neg:
        raise HTTPException(status_code=404, detail="Negotiation not found")
    if current_user.id != neg.buyer_id:
        raise HTTPException(status_code=403, detail="Only the buyer can confirm")
    if neg.status != "accepted":
        raise HTTPException(status_code=400, detail="Offer not in accepted state")
    product = neg.product
    if not product or product.quantity < 1:
        raise HTTPException(status_code=400, detail="Product unavailable")

    # Last accepted offer amount (last buyer message with offer_amount)
    last_offer = None
    for m in sorted(neg.messages, key=lambda x: x.created_at, reverse=True):
        if m.sender_type == "buyer" and m.offer_amount is not None:
            last_offer = float(m.offer_amount)
            break
    if last_offer is None:
        last_offer = float(product.min_negotiable_price or product.price)

    # PersonalProductOffer
    existing_offer = (
        db.query(PersonalProductOffer)
        .filter(
            PersonalProductOffer.buyer_id == current_user.id,
            PersonalProductOffer.product_id == neg.product_id,
        )
        .first()
    )
    if existing_offer:
        existing_offer.price_per_unit = last_offer
    else:
        db.add(
            PersonalProductOffer(
                buyer_id=current_user.id,
                product_id=neg.product_id,
                price_per_unit=last_offer,
            )
        )

    # Add to cart (or update quantity)
    qty = 1
    existing_cart = (
        db.query(CartItem)
        .filter(
            CartItem.user_id == current_user.id,
            CartItem.product_id == neg.product_id,
        )
        .first()
    )
    if existing_cart:
        new_qty = min(existing_cart.quantity + qty, product.quantity)
        existing_cart.quantity = new_qty
    else:
        db.add(
            CartItem(
                user_id=current_user.id,
                product_id=neg.product_id,
                quantity=qty,
            )
        )

    neg.status = "confirmed"
    db.commit()
    return {"detail": "Offer confirmed. Added to your cart.", "cart_added": True}
