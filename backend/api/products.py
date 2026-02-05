from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.security import get_current_user, get_current_user_optional, get_db, require_role
from db.models import (
    CartItem,
    Negotiation,
    NegotiationMessage,
    OrderItem,
    PersonalProductOffer,
    Product,
    User,
    UserRole,
)
from schemas.product import ProductCreate, ProductRead, ProductUpdate

router = APIRouter()


@router.post(
    "/", response_model=ProductRead, status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(UserRole.FARMER))]
)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = Product(
        farmer_id=current_user.id,
        **product_in.model_dump(),
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/", response_model=list[ProductRead])
def list_products(
    db: Session = Depends(get_db),
    category: str | None = Query(default=None),
    q: str | None = Query(default=None, description="Search query for product name or description"),
    farmer_id: int | None = Query(default=None, description="Filter by farmer (e.g. for chat counter-offer)"),
):
    """List products with optional category filter and search. Only shows products from active farmers."""
    from sqlalchemy.orm import joinedload
    query = (
        db.query(Product)
        .options(joinedload(Product.farmer))
        .join(User, Product.farmer_id == User.id)
        .filter(User.is_active == True)
    )
    if farmer_id is not None:
        query = query.filter(Product.farmer_id == farmer_id)
    if category:
        query = query.filter(Product.category == category)
    if q:
        search_term = f"%{q.lower()}%"
        query = query.filter(
            (Product.name.ilike(search_term)) |
            (Product.description.ilike(search_term))
        )
    return query.all()


@router.get("/{product_id}", response_model=ProductRead)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    from sqlalchemy.orm import joinedload
    product = (
        db.query(Product)
        .options(joinedload(Product.farmer))
        .join(User, Product.farmer_id == User.id)
        .filter(Product.id == product_id)
        .filter(User.is_active == True)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    out = ProductRead.model_validate(product)
    if current_user and current_user.role == UserRole.BUYER:
        offer = (
            db.query(PersonalProductOffer)
            .filter(
                PersonalProductOffer.buyer_id == current_user.id,
                PersonalProductOffer.product_id == product.id,
            )
            .first()
        )
        if offer:
            out.effective_price = float(offer.price_per_unit)
    return out


@router.put(
    "/{product_id}",
    response_model=ProductRead,
    dependencies=[Depends(require_role(UserRole.FARMER))],
)
def update_product(
    product_id: int,
    product_in: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.get(Product, product_id)
    if not product or product.farmer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in product_in.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(UserRole.FARMER))],
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.get(Product, product_id)
    if not product or product.farmer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Product not found")
    # Remove all references to this product so delete succeeds regardless of DB FK rules
    neg_ids = [r[0] for r in db.query(Negotiation.id).filter(Negotiation.product_id == product_id).all()]
    if neg_ids:
        db.query(NegotiationMessage).filter(NegotiationMessage.negotiation_id.in_(neg_ids)).delete(
            synchronize_session=False
        )
    db.query(Negotiation).filter(Negotiation.product_id == product_id).delete()
    db.query(PersonalProductOffer).filter(PersonalProductOffer.product_id == product_id).delete()
    db.query(CartItem).filter(CartItem.product_id == product_id).delete()
    db.query(OrderItem).filter(OrderItem.product_id == product_id).update({OrderItem.product_id: None})
    db.flush()
    db.delete(product)
    db.commit()


