import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from core.security import get_current_user, get_db, require_role
from db.models import (
    CartItem,
    Conversation,
    Message,
    User,
    UserRole,
    AdminMessage,
    GroupChat,
    GroupChatMember,
    GroupChatMessage,
    CounterOffer,
    PersonalProductOffer,
    Product,
)
from schemas.messaging import (
    ConversationRead,
    MessageCreate,
    MessageRead,
    CounterOfferCreate,
    CounterOfferRead,
    GroupChatRead,
    GroupChatMemberRead,
    GroupChatMessageRead,
    GroupChatMessageCreate,
)

router = APIRouter()


def _message_to_read(db: Session, msg: Message) -> MessageRead:
    """Build MessageRead including counter_offer with product_name if present."""
    counter_offer_read = None
    if msg.counter_offer:
        co = msg.counter_offer
        product = db.get(Product, co.product_id)
        product_name = product.name if product else None
        counter_offer_read = CounterOfferRead(
            id=co.id,
            message_id=co.message_id,
            conversation_id=co.conversation_id,
            product_id=co.product_id,
            buyer_id=co.buyer_id,
            farmer_id=co.farmer_id,
            quantity=co.quantity,
            price_per_unit=float(co.price_per_unit),
            original_price_per_unit=float(co.original_price_per_unit),
            status=co.status,
            responded_at=co.responded_at,
            product_name=product_name,
        )
    return MessageRead(
        id=msg.id,
        conversation_id=msg.conversation_id,
        sender_id=msg.sender_id,
        message_text=msg.message_text,
        message_type=getattr(msg, "message_type", "text") or "text",
        meta=getattr(msg, "meta", None),
        file_url=msg.file_url,
        file_type=msg.file_type,
        file_name=msg.file_name,
        is_read=msg.is_read,
        created_at=msg.created_at,
        counter_offer=counter_offer_read,
    )


@router.post("/conversations", response_model=ConversationRead, status_code=status.HTTP_200_OK)
def get_or_create_conversation(
    counterpart_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    counterpart = db.get(User, counterpart_id)
    if not counterpart:
        raise HTTPException(status_code=404, detail="User not found")

    # Enforce buyer-farmer only
    if {current_user.role, counterpart.role} != {UserRole.BUYER, UserRole.FARMER}:
        raise HTTPException(
            status_code=400,
            detail="Conversations allowed only between buyer and farmer",
        )

    if current_user.role == UserRole.BUYER:
        buyer_id, farmer_id = current_user.id, counterpart.id
    else:
        buyer_id, farmer_id = counterpart.id, current_user.id

    conv = (
        db.query(Conversation)
        .filter(Conversation.buyer_id == buyer_id, Conversation.farmer_id == farmer_id)
        .first()
    )
    if not conv:
        conv = Conversation(buyer_id=buyer_id, farmer_id=farmer_id)
        db.add(conv)
        db.commit()
        db.refresh(conv)
    return conv


@router.post("/messages", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
def send_message(
    msg_in: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = db.get(Conversation, msg_in.conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if current_user.id not in (conv.buyer_id, conv.farmer_id):
        raise HTTPException(status_code=403, detail="Not part of this conversation")

    # Ensure at least message_text or file_url is provided
    if not msg_in.message_text and not msg_in.file_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either message text or file must be provided",
        )

    message = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        message_text=msg_in.message_text or "",
        message_type=msg_in.message_type or "text",
        meta=msg_in.meta,
        file_url=msg_in.file_url,
        file_type=msg_in.file_type,
        file_name=msg_in.file_name,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return _message_to_read(db, message)


@router.get("/conversations", response_model=list[ConversationRead])
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all conversations for the current user."""
    conversations = (
        db.query(Conversation)
        .filter(
            (Conversation.buyer_id == current_user.id) |
            (Conversation.farmer_id == current_user.id)
        )
        .order_by(Conversation.created_at.desc())
        .all()
    )
    return conversations


@router.get("/conversations/{conv_id}/messages", response_model=list[MessageRead])
def list_messages(
    conv_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conv = db.get(Conversation, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if current_user.id not in (conv.buyer_id, conv.farmer_id):
        raise HTTPException(status_code=403, detail="Not part of this conversation")

    messages = (
        db.query(Message)
        .options(joinedload(Message.counter_offer))
        .filter(Message.conversation_id == conv_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return [_message_to_read(db, m) for m in messages]


@router.post("/conversations/{conv_id}/counter-offer", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
def send_counter_offer(
    conv_id: int,
    body: CounterOfferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Buyer sends a price counter-offer (e.g. 15 kg at ₹20 per kg)."""
    conv = db.get(Conversation, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if current_user.id != conv.buyer_id:
        raise HTTPException(status_code=403, detail="Only the buyer can send a counter-offer")

    product = db.get(Product, body.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.farmer_id != conv.farmer_id:
        raise HTTPException(status_code=400, detail="Product does not belong to this farmer")

    if body.quantity <= 0 or body.price_per_unit <= 0:
        raise HTTPException(status_code=400, detail="Quantity and price must be positive")

    original_price = float(product.price)
    message_text = f"Can you sell {body.quantity} kg at ₹{body.price_per_unit} per kg? (Original: ₹{original_price}/kg)"
    message = Message(
        conversation_id=conv_id,
        sender_id=current_user.id,
        message_text=message_text,
        message_type="counter_offer",
        meta=None,
    )
    db.add(message)
    db.flush()
    counter = CounterOffer(
        message_id=message.id,
        conversation_id=conv_id,
        product_id=body.product_id,
        buyer_id=conv.buyer_id,
        farmer_id=conv.farmer_id,
        quantity=body.quantity,
        price_per_unit=body.price_per_unit,
        original_price_per_unit=original_price,
        status="pending",
    )
    db.add(counter)
    db.commit()
    db.refresh(message)
    db.refresh(counter)
    message.counter_offer = counter
    return _message_to_read(db, message)


@router.post("/messages/{message_id}/counter-offer/accept", response_model=MessageRead)
def accept_counter_offer(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Farmer accepts the counter-offer; customer gets special price for that product."""
    message = db.get(Message, message_id)
    if not message or message.message_type != "counter_offer":
        raise HTTPException(status_code=404, detail="Counter-offer message not found")
    counter = db.query(CounterOffer).filter(CounterOffer.message_id == message_id).first()
    if not counter or counter.status != "pending":
        raise HTTPException(status_code=400, detail="Offer already responded to")
    if current_user.id != counter.farmer_id:
        raise HTTPException(status_code=403, detail="Only the farmer can accept this offer")

    counter.status = "accepted"
    counter.responded_at = datetime.now(timezone.utc)
    # Give buyer a personal offer (special price) for this product
    existing = (
        db.query(PersonalProductOffer)
        .filter(
            PersonalProductOffer.buyer_id == counter.buyer_id,
            PersonalProductOffer.product_id == counter.product_id,
        )
        .first()
    )
    if existing:
        existing.price_per_unit = counter.price_per_unit
    else:
        db.add(
            PersonalProductOffer(
                buyer_id=counter.buyer_id,
                product_id=counter.product_id,
                price_per_unit=counter.price_per_unit,
            )
        )

    product = db.get(Product, counter.product_id)
    product_name = product.name if product else "this product"

    # Automatically add accepted offer to buyer's cart (or update quantity)
    if product and product.quantity > 0:
        qty_to_add = min(counter.quantity, product.quantity)
        if qty_to_add > 0:
            existing_cart = (
                db.query(CartItem)
                .filter(
                    CartItem.user_id == counter.buyer_id,
                    CartItem.product_id == counter.product_id,
                )
                .first()
            )
            if existing_cart:
                new_qty = min(existing_cart.quantity + qty_to_add, product.quantity)
                existing_cart.quantity = new_qty
            else:
                db.add(
                    CartItem(
                        user_id=counter.buyer_id,
                        product_id=counter.product_id,
                        quantity=qty_to_add,
                    )
                )

    system_text = f"Offer accepted! Special price for you: ₹{counter.price_per_unit} per kg for {product_name}. Added to your cart — you can proceed to checkout."
    system_msg = Message(
        conversation_id=message.conversation_id,
        sender_id=current_user.id,
        message_text=system_text,
        message_type="system",
    )
    db.add(system_msg)
    db.commit()
    db.refresh(message)
    message.counter_offer = counter
    return _message_to_read(db, message)


@router.post("/messages/{message_id}/counter-offer/reject", response_model=MessageRead)
def reject_counter_offer(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Farmer rejects the counter-offer."""
    message = db.get(Message, message_id)
    if not message or message.message_type != "counter_offer":
        raise HTTPException(status_code=404, detail="Counter-offer message not found")
    counter = db.query(CounterOffer).filter(CounterOffer.message_id == message_id).first()
    if not counter or counter.status != "pending":
        raise HTTPException(status_code=400, detail="Offer already responded to")
    if current_user.id != counter.farmer_id:
        raise HTTPException(status_code=403, detail="Only the farmer can reject this offer")

    counter.status = "rejected"
    counter.responded_at = datetime.now(timezone.utc)
    system_text = f"Offer rejected. Original price ₹{counter.original_price_per_unit} per kg. You can send another counter or buy at the listed price."
    system_msg = Message(
        conversation_id=message.conversation_id,
        sender_id=current_user.id,
        message_text=system_text,
        message_type="system",
    )
    db.add(system_msg)
    db.commit()
    db.refresh(message)
    message.counter_offer = counter
    return _message_to_read(db, message)


@router.get("/unread-count", response_model=dict)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get count of unread messages for the current user."""
    # Get all conversations for the current user
    conversations = (
        db.query(Conversation)
        .filter(
            (Conversation.buyer_id == current_user.id) |
            (Conversation.farmer_id == current_user.id)
        )
        .all()
    )
    
    # Count unread messages (messages not sent by current user and not read)
    unread_count = (
        db.query(Message)
        .join(Conversation)
        .filter(
            ((Conversation.buyer_id == current_user.id) |
             (Conversation.farmer_id == current_user.id)),
            Message.sender_id != current_user.id,
            Message.is_read == False
        )
        .count()
    )
    
    return {"unread_count": unread_count}


@router.post("/conversations/{conv_id}/mark-read", status_code=status.HTTP_200_OK)
def mark_conversation_read(
    conv_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all unread messages in a conversation as read."""
    conv = db.get(Conversation, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if current_user.id not in (conv.buyer_id, conv.farmer_id):
        raise HTTPException(status_code=403, detail="Not part of this conversation")

    # Mark all unread messages (not sent by current user) as read
    unread_messages = (
        db.query(Message)
        .filter(
            Message.conversation_id == conv_id,
            Message.sender_id != current_user.id,
            Message.is_read == False
        )
        .all()
    )
    
    for message in unread_messages:
        message.is_read = True
    
    db.commit()
    return {"message": "Messages marked as read", "count": len(unread_messages)}


# =========================
# FARMER ADMIN MESSAGES
# =========================

@router.get("/admin-messages", response_model=list[dict])
def get_farmer_admin_messages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all admin messages for the current farmer."""
    if current_user.role != UserRole.FARMER:
        raise HTTPException(
            status_code=403,
            detail="Only farmers can access admin messages",
        )
    
    messages = (
        db.query(AdminMessage)
        .filter(AdminMessage.farmer_id == current_user.id)
        .order_by(AdminMessage.created_at.desc())
        .all()
    )
    
    # Mark messages as read when farmer views them
    unread_messages = [msg for msg in messages if not msg.is_read]
    for msg in unread_messages:
        msg.is_read = True
    db.commit()
    
    return [
        {
            "id": msg.id,
            "message_text": msg.message_text,
            "message_type": msg.message_type,
            "link_url": msg.link_url,
            "file_url": msg.file_url,
            "file_type": msg.file_type,
            "file_name": msg.file_name,
            "is_read": True,  # All are now read
            "created_at": msg.created_at.isoformat(),
        }
        for msg in messages
    ]


@router.get("/admin-messages/unread-count", response_model=dict)
def get_admin_messages_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get count of unread admin messages for the current farmer."""
    if current_user.role != UserRole.FARMER:
        return {"unread_count": 0}
    
    unread_count = (
        db.query(AdminMessage)
        .filter(
            AdminMessage.farmer_id == current_user.id,
            AdminMessage.is_read == False
        )
        .count()
    )
    
    return {"unread_count": unread_count}


# =========================
# GROUP CHAT: "FREE TO ASK"
# =========================


logger = logging.getLogger(__name__)


def _role_value(role) -> str:
    """Safely get string value from UserRole enum or string."""
    if role is None:
        return ""
    if hasattr(role, "value"):
        return getattr(role, "value", "") or str(role)
    return str(role)


def _ensure_default_farmer_group(db: Session) -> GroupChat:
    """Get or create the default farmer group chat."""
    group = (
        db.query(GroupChat)
        .filter(GroupChat.is_default_for_farmers.is_(True))
        .first()
    )
    if not group:
        try:
            group = GroupChat(
                name="Free to Ask",
                is_default_for_farmers=True,
                created_by=None,
            )
            db.add(group)
            db.commit()
            db.refresh(group)
        except IntegrityError:
            db.rollback()
            # Group with same name may exist; fetch and mark as default
            group = db.query(GroupChat).filter(GroupChat.name == "Free to Ask").first()
            if not group:
                raise
            group.is_default_for_farmers = True
            db.commit()
            db.refresh(group)
    return group


@router.get("/groups/default-farmer/activity-count", response_model=dict)
def get_default_farmer_group_activity_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get unread message count for the default farmer group (messages after last_seen_at, not by self)."""
    if current_user.role not in (UserRole.FARMER, UserRole.ADMIN):
        return {"count": 0}

    try:
        group = _ensure_default_farmer_group(db)
    except Exception:
        return {"count": 0}

    membership = (
        db.query(GroupChatMember)
        .filter(
            GroupChatMember.group_id == group.id,
            GroupChatMember.user_id == current_user.id,
        )
        .first()
    )

    # Count messages not sent by current user that are "after" last_seen_at
    q = (
        db.query(GroupChatMessage)
        .filter(
            GroupChatMessage.group_id == group.id,
            GroupChatMessage.sender_id != current_user.id,
        )
    )
    if membership and getattr(membership, "last_seen_at", None):
        q = q.filter(GroupChatMessage.created_at > membership.last_seen_at)
    else:
        # Never seen: count messages in last 24h only
        since = datetime.now(timezone.utc) - timedelta(hours=24)
        q = q.filter(GroupChatMessage.created_at >= since)

    count = q.count()
    return {"count": count}


@router.post("/groups/{group_id}/seen", status_code=status.HTTP_200_OK)
def mark_group_as_seen(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark the group chat as seen (updates last_seen_at). Call when user opens/views the group."""
    group = db.get(GroupChat, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    membership = (
        db.query(GroupChatMember)
        .filter(
            GroupChatMember.group_id == group_id,
            GroupChatMember.user_id == current_user.id,
        )
        .first()
    )
    if not membership and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not a member of this group")

    now = datetime.now(timezone.utc)
    try:
        if membership:
            setattr(membership, "last_seen_at", now)
            db.commit()
        else:
            # Admin viewing without membership: add as member with last_seen_at
            try:
                new_member = GroupChatMember(
                    group_id=group_id,
                    user_id=current_user.id,
                    role="admin",
                    last_seen_at=now,
                )
                db.add(new_member)
                db.commit()
            except IntegrityError:
                db.rollback()
                # Already a member (e.g. added by get_default_farmer_group), just update last_seen_at
                m = (
                    db.query(GroupChatMember)
                    .filter(
                        GroupChatMember.group_id == group_id,
                        GroupChatMember.user_id == current_user.id,
                    )
                    .first()
                )
                if m:
                    setattr(m, "last_seen_at", now)
                    db.commit()
    except Exception as e:
        db.rollback()
        logger.warning("mark_group_as_seen failed (last_seen_at may be missing): %s", e)
        # Return 200 so frontend does not get 500/CORS; counter may not update until migration runs

    return {"message": "Marked as seen", "last_seen_at": now.isoformat()}


@router.get("/groups/default-farmer", response_model=dict)
def get_default_farmer_group(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get the default farmer group chat ("Free to Ask") and its recent messages.
    Auto-adds the current farmer as a member if not already present.
    """
    if current_user.role not in (UserRole.FARMER, UserRole.ADMIN):
        raise HTTPException(
            status_code=403,
            detail="Only farmers and admin can access the group chat",
        )

    try:
        group = _ensure_default_farmer_group(db)
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Failed to get or create default farmer group")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load group chat: {str(e)}",
        ) from e

    # Ensure current user is a member
    membership = (
        db.query(GroupChatMember)
        .filter(
            GroupChatMember.group_id == group.id,
            GroupChatMember.user_id == current_user.id,
        )
        .first()
    )
    if not membership:
        try:
            db.add(
                GroupChatMember(
                    group_id=group.id,
                    user_id=current_user.id,
                    role="admin" if current_user.role == UserRole.ADMIN else "farmer",
                )
            )
            db.commit()
        except IntegrityError:
            db.rollback()
            # Already a member (race condition), ignore

    # Load recent messages
    messages = (
        db.query(GroupChatMessage)
        .filter(GroupChatMessage.group_id == group.id)
        .order_by(GroupChatMessage.created_at.asc())
        .all()
    )

    # Load members with user eagerly loaded to avoid lazy-load issues
    members = (
        db.query(GroupChatMember)
        .options(joinedload(GroupChatMember.user))
        .filter(GroupChatMember.group_id == group.id)
        .all()
    )

    try:
        # Serialize based on role (use _role_value in case role is enum or string)
        group_data = GroupChatRead.model_validate(group).model_dump()

        if current_user.role == UserRole.ADMIN:
            # Admin sees full member details
            members_data = [
                {
                    "id": m.id,
                    "group_id": m.group_id,
                    "user_id": m.user_id,
                    "role": m.role,
                    "joined_at": m.joined_at,
                    "user": {
                        "id": m.user.id,
                        "name": m.user.name,
                        "email": m.user.email,
                        "phone": getattr(m.user, "phone", None),
                        "role": _role_value(getattr(m.user, "role", None)),
                    }
                    if m.user
                    else None,
                }
                for m in members
            ]
        else:
            # Farmers only see basic member info (no contact details)
            members_data = [
                {
                    "id": m.id,
                    "group_id": m.group_id,
                    "user_id": m.user_id,
                    "role": m.role,
                    "joined_at": m.joined_at,
                    "user": {
                        "id": m.user.id,
                        "name": m.user.name,
                        "role": _role_value(getattr(m.user, "role", None)),
                    }
                    if m.user
                    else None,
                }
                for m in members
            ]

        messages_data = [
            GroupChatMessageRead.model_validate(msg).model_dump() for msg in messages
        ]

        return {
            "group": group_data,
            "members": members_data,
            "messages": messages_data,
        }
    except Exception as e:
        logger.exception("Failed to serialize default farmer group response")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load group chat: {str(e)}",
        ) from e


@router.get("/groups/{group_id}/messages", response_model=list[GroupChatMessageRead])
def list_group_messages(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List messages in a group chat (members only, or admin can view any group)."""
    group = db.get(GroupChat, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Admin can view any group's messages without membership
    if current_user.role != UserRole.ADMIN:
        membership = (
            db.query(GroupChatMember)
            .filter(
                GroupChatMember.group_id == group_id,
                GroupChatMember.user_id == current_user.id,
            )
            .first()
        )
        if not membership:
            raise HTTPException(status_code=403, detail="Not a member of this group")

    messages = (
        db.query(GroupChatMessage)
        .filter(GroupChatMessage.group_id == group_id)
        .order_by(GroupChatMessage.created_at.asc())
        .all()
    )
    return [GroupChatMessageRead.model_validate(m) for m in messages]


@router.post(
    "/groups/{group_id}/messages",
    response_model=GroupChatMessageRead,
    status_code=status.HTTP_201_CREATED,
)
def send_group_message(
    group_id: int,
    msg_in: GroupChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Send a message to a group chat (members only, or admin can send to any group)."""
    group = db.get(GroupChat, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Admin can send to any group; others must be members
    if current_user.role != UserRole.ADMIN:
        membership = (
            db.query(GroupChatMember)
            .filter(
                GroupChatMember.group_id == group_id,
                GroupChatMember.user_id == current_user.id,
            )
            .first()
        )
        if not membership:
            raise HTTPException(status_code=403, detail="Not a member of this group")

    if not msg_in.message_text and not msg_in.file_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either message text or file must be provided",
        )

    msg = GroupChatMessage(
        group_id=group_id,
        sender_id=current_user.id,
        message_text=msg_in.message_text or "",
        file_url=msg_in.file_url,
        file_type=msg_in.file_type,
        file_name=msg_in.file_name,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return GroupChatMessageRead.model_validate(msg)


@router.delete(
    "/groups/{group_id}/members/{user_id}",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)
def remove_group_member(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a member from the group chat. Admin only. Cannot remove self or other admins."""
    group = db.get(GroupChat, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    membership = (
        db.query(GroupChatMember)
        .filter(
            GroupChatMember.group_id == group_id,
            GroupChatMember.user_id == user_id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found in this group")

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself from the group")

    if membership.role == "admin":
        raise HTTPException(status_code=403, detail="Cannot remove an admin from the group")

    db.delete(membership)
    db.commit()
    return {"message": "Member removed from group"}

