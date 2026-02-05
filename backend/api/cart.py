from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.security import get_current_user, get_db, require_role
from db.models import CartItem, Product, User, UserRole, PersonalProductOffer
from schemas.cart import CartItemCreate, CartItemDetail, CartItemUpdate, CartRead
from schemas.product import ProductRead

router = APIRouter()


def _product_with_effective_price(db: Session, product: Product, buyer_id: int) -> ProductRead:
    """Build ProductRead with effective_price (negotiated) when buyer has a personal offer."""
    offer = (
        db.query(PersonalProductOffer)
        .filter(
            PersonalProductOffer.buyer_id == buyer_id,
            PersonalProductOffer.product_id == product.id,
        )
        .first()
    )
    out = ProductRead.model_validate(product)
    if offer:
        out.effective_price = float(offer.price_per_unit)
    return out


@router.get("/", response_model=CartRead, dependencies=[Depends(require_role(UserRole.BUYER))])
def get_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current user's cart with all items. Uses negotiated price when buyer has a special offer."""
    cart_items = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id)
        .all()
    )
    
    items_detail = []
    total_amount = 0.0
    
    for item in cart_items:
        product = db.get(Product, item.product_id)
        if not product:
            continue
        product_read = _product_with_effective_price(db, product, current_user.id)
        price = product_read.effective_price if product_read.effective_price is not None else float(product.price)
        item_detail = CartItemDetail(
            id=item.id,
            product_id=item.product_id,
            quantity=item.quantity,
            created_at=item.created_at,
            updated_at=item.updated_at,
            product=product_read,
        )
        items_detail.append(item_detail)
        total_amount += price * item.quantity
    
    return CartRead(
        items=items_detail,
        total_items=sum(item.quantity for item in cart_items),
        total_amount=round(total_amount, 2),
    )


@router.post(
    "/add",
    response_model=CartItemDetail,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(UserRole.BUYER))],
)
def add_to_cart(
    item_in: CartItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add item to cart or update quantity if already exists."""
    product = db.get(Product, item_in.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.quantity < item_in.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Available: {product.quantity}",
        )
    
    # Check if item already in cart
    existing_item = (
        db.query(CartItem)
        .filter(
            CartItem.user_id == current_user.id,
            CartItem.product_id == item_in.product_id,
        )
        .first()
    )
    
    if existing_item:
        # Update quantity
        new_quantity = existing_item.quantity + item_in.quantity
        if product.quantity < new_quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock. Available: {product.quantity}, Requested: {new_quantity}",
            )
        existing_item.quantity = new_quantity
        db.commit()
        db.refresh(existing_item)
        
        product_read = _product_with_effective_price(db, product, current_user.id)
        return CartItemDetail(
            id=existing_item.id,
            product_id=existing_item.product_id,
            quantity=existing_item.quantity,
            created_at=existing_item.created_at,
            updated_at=existing_item.updated_at,
            product=product_read,
        )
    else:
        cart_item = CartItem(
            user_id=current_user.id,
            product_id=item_in.product_id,
            quantity=item_in.quantity,
        )
        db.add(cart_item)
        db.commit()
        db.refresh(cart_item)
        product_read = _product_with_effective_price(db, product, current_user.id)
        return CartItemDetail(
            id=cart_item.id,
            product_id=cart_item.product_id,
            quantity=cart_item.quantity,
            created_at=cart_item.created_at,
            updated_at=cart_item.updated_at,
            product=product_read,
        )


@router.put(
    "/update/{item_id}",
    response_model=CartItemDetail,
    dependencies=[Depends(require_role(UserRole.BUYER))],
)
def update_cart_item(
    item_id: int,
    item_update: CartItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update quantity of a cart item."""
    cart_item = (
        db.query(CartItem)
        .filter(CartItem.id == item_id, CartItem.user_id == current_user.id)
        .first()
    )
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    product = db.get(Product, cart_item.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.quantity < item_update.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Available: {product.quantity}",
        )
    
    cart_item.quantity = item_update.quantity
    db.commit()
    db.refresh(cart_item)
    product_read = _product_with_effective_price(db, product, current_user.id)
    return CartItemDetail(
        id=cart_item.id,
        product_id=cart_item.product_id,
        quantity=cart_item.quantity,
        created_at=cart_item.created_at,
        updated_at=cart_item.updated_at,
        product=product_read,
    )


@router.delete(
    "/remove/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_role(UserRole.BUYER))],
)
def remove_from_cart(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove item from cart."""
    cart_item = (
        db.query(CartItem)
        .filter(CartItem.id == item_id, CartItem.user_id == current_user.id)
        .first()
    )
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    db.delete(cart_item)
    db.commit()


@router.post(
    "/checkout",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(UserRole.BUYER))],
)
def checkout_cart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Convert cart items to an order and clear the cart."""
    from db.models import Order, OrderItem
    from schemas.order import OrderRead
    
    cart_items = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id)
        .all()
    )
    
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Validate all products and calculate total (use negotiated price when buyer has special offer)
    products = {}
    total_amount = 0.0
    
    for item in cart_items:
        product = db.get(Product, item.product_id)
        if not product:
            raise HTTPException(
                status_code=400,
                detail=f"Product {item.product_id} not found",
            )
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for product {product.name}. Available: {product.quantity}, Requested: {item.quantity}",
            )
        offer = (
            db.query(PersonalProductOffer)
            .filter(
                PersonalProductOffer.buyer_id == current_user.id,
                PersonalProductOffer.product_id == product.id,
            )
            .first()
        )
        price = float(offer.price_per_unit) if offer else float(product.price)
        products[item.id] = (product, price)
        total_amount += price * item.quantity
    
    order = Order(buyer_id=current_user.id, total_amount=total_amount)
    db.add(order)
    db.flush()
    
    for item in cart_items:
        product, price = products[item.id]
        product.quantity -= item.quantity
        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=item.quantity,
            price=price,
        )
        db.add(order_item)
    
    # Clear cart
    for item in cart_items:
        db.delete(item)
    
    db.commit()
    db.refresh(order)
    
    return {
        "message": "Order created successfully",
        "order_id": order.id,
        "total_amount": float(order.total_amount),
    }

