import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.security import get_current_user, get_db, require_role
from db.models import Order, OrderItem, Product, User, UserRole, OrderNotification, CartItem
from schemas.order import OrderCreate, OrderRead, OrderCancelRequest

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post(
    "/", response_model=OrderRead, status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_role(UserRole.BUYER))]
)
def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not order_in.items:
        raise HTTPException(status_code=400, detail="Order must contain items")

    product_ids = [i.product_id for i in order_in.items]
    products = {
        p.id: p
        for p in db.query(Product).filter(Product.id.in_(product_ids))
    }
    if len(products) != len(product_ids):
        raise HTTPException(status_code=400, detail="Invalid product in order")

    delivery_type = (order_in.delivery_type or "delivery").strip().lower()
    # Normalize legacy "delivery" to "schedule_delivery"
    if delivery_type == "delivery":
        delivery_type = "schedule_delivery"

    preferred_date = None
    if delivery_type == "express_delivery":
        preferred_date = datetime.utcnow().date()
    elif order_in.preferred_date:
        try:
            preferred_date = datetime.strptime(order_in.preferred_date, "%Y-%m-%d").date()
        except ValueError:
            pass

    order = Order(
        buyer_id=current_user.id,
        total_amount=0,
        shipping_address=order_in.shipping_address,
        payment_method=order_in.payment_method or "cash",
        buyer_email=current_user.email,
        delivery_type=delivery_type,
        preferred_date=preferred_date,
        preferred_time=order_in.preferred_time or None,
    )
    db.add(order)
    db.flush()

    total_amount = 0.0
    for item_in in order_in.items:
        product = products[item_in.product_id]
        if product.quantity < item_in.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for product {product.id}",
            )
        line_price = float(product.price) * item_in.quantity
        total_amount += line_price
        product.quantity -= item_in.quantity
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=item_in.quantity,
                price=product.price,
            )
        )

    order.total_amount = total_amount
    
    # Clear cart items for products in this order
    product_ids = [i.product_id for i in order_in.items]
    cart_items = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id)
        .filter(CartItem.product_id.in_(product_ids))
        .all()
    )
    for cart_item in cart_items:
        db.delete(cart_item)

    # Notify farmer(s) for both delivery and pickup orders
    try:
        farmer_ids = {products[item_in.product_id].farmer_id for item_in in order_in.items}
        farmer_ids.discard(None)
        product_names = [products[item_in.product_id].name for item_in in order_in.items]
        if len(product_names) == 1:
            product_list = product_names[0]
        elif len(product_names) <= 3:
            product_list = ", ".join(product_names)
        else:
            product_list = ", ".join(product_names[:2]) + f" and {len(product_names) - 2} more"
        type_label = "Schedule Delivery" if delivery_type == "schedule_delivery" else (
            "Express Delivery" if delivery_type == "express_delivery" else "Pickup"
        )
        date_str = ""
        if preferred_date:
            date_str = f" on {preferred_date.strftime('%d %b %Y')}"
        time_str = ""
        if order_in.preferred_time:
            time_str = f" (Preferred time: {order_in.preferred_time})"
        msg = f"New order #{order.id} ({type_label}{date_str}{time_str}): {product_list}. Total: ₹{total_amount:.2f}"
        if delivery_type == "express_delivery":
            msg = f"🚨 EXPRESS / URGENT — {msg}"
        for fid in farmer_ids:
            db.add(OrderNotification(user_id=fid, order_id=order.id, message=msg))
    except Exception as e:
        logger.error(f"Failed to create farmer order notification: {e}", exc_info=True)
    
    db.commit()
    # Reload order with relationships for response
    from sqlalchemy.orm import joinedload
    order = (
        db.query(Order)
        .options(
            joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.farmer),
            joinedload(Order.buyer)
        )
        .filter(Order.id == order.id)
        .first()
    )
    return order


@router.get(
    "/", response_model=list[OrderRead],
    dependencies=[Depends(require_role(UserRole.BUYER))]
)
def list_my_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all orders for the current buyer with product information."""
    from sqlalchemy.orm import joinedload
    return (
        db.query(Order)
        .filter(Order.buyer_id == current_user.id)
        .options(
            joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.farmer),
            joinedload(Order.buyer)
        )
        .order_by(Order.created_at.desc())
        .all()
    )


@router.get("/notifications", response_model=list[dict])
def get_order_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get order notifications for the current user."""
    notifications = (
        db.query(OrderNotification)
        .filter(OrderNotification.user_id == current_user.id)
        .order_by(OrderNotification.created_at.desc())
        .limit(50)
        .all()
    )
    
    return [
        {
            "id": n.id,
            "order_id": n.order_id,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifications
    ]


@router.get("/{order_id}", response_model=OrderRead)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get order details by ID."""
    from sqlalchemy.orm import joinedload
    order = (
        db.query(Order)
        .options(
            joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.farmer),
            joinedload(Order.buyer)
        )
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Buyers can only see their own orders
    # Farmers can see orders for their products
    if current_user.role == UserRole.BUYER:
        if order.buyer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this order")
    elif current_user.role == UserRole.FARMER:
        # Check if order contains farmer's products
        product_ids = [item.product_id for item in order.items]
        farmer_products = (
            db.query(Product)
            .filter(Product.id.in_(product_ids), Product.farmer_id == current_user.id)
            .first()
        )
        if not farmer_products:
            raise HTTPException(status_code=403, detail="Not authorized to view this order")
    
    return order


@router.put(
    "/{order_id}/status",
    response_model=OrderRead,
    dependencies=[Depends(require_role(UserRole.FARMER, UserRole.ADMIN))],
)
def update_order_status(
    order_id: int,
    new_status: str = Query(..., description="New order status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update order status (Farmer or Admin only)."""
    from db.models import OrderStatus
    
    # Normalize the status to lowercase
    new_status_lower = new_status.lower()
    
    try:
        status_enum = OrderStatus(new_status_lower)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {[s.value for s in OrderStatus]}",
        )
    
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Farmers can only update orders for their products
    if current_user.role == UserRole.FARMER:
        product_ids = [item.product_id for item in order.items]
        farmer_products = (
            db.query(Product)
            .filter(Product.id.in_(product_ids), Product.farmer_id == current_user.id)
            .first()
        )
        if not farmer_products:
            raise HTTPException(
                status_code=403,
                detail="Not authorized to update this order",
            )
    
    old_status = order.status
    # ✅ CRITICAL FIX: Use raw SQL to bypass SQLAlchemy enum conversion issues
    # PostgreSQL enum expects lowercase values like "accepted", not "ACCEPTED"
    # Using raw SQL ensures we send the exact lowercase string value
    status_lowercase = status_enum.value  # This is "accepted" (lowercase string)
    logger.info(f"Updating order {order_id} status from {old_status} to '{status_lowercase}'")
    
    # ✅ Use raw SQL update to bypass SQLAlchemy's enum handling
    # This guarantees PostgreSQL receives "accepted" (lowercase) not "ACCEPTED" (uppercase)
    from sqlalchemy import text
    db.execute(
        text("UPDATE orders SET status = :status WHERE id = :order_id"),
        {"status": status_lowercase, "order_id": order_id}
    )
    db.flush()  # Flush changes
    # Reload the order to get updated status (as enum object) with product information
    from sqlalchemy.orm import joinedload
    order = (
        db.query(Order)
        .options(
            joinedload(Order.items).joinedload(OrderItem.product).joinedload(Product.farmer)
        )
        .filter(Order.id == order_id)
        .first()
    )
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Create notification for buyer with product names
    # Get product names from order items
    product_names = []
    for item in order.items:
        if item.product:
            product_names.append(item.product.name)
        elif item.product_id:
            product = db.get(Product, item.product_id)
            if product:
                product_names.append(product.name)
        else:
            product_names.append("(deleted product)")
    
    # Create product list string
    if product_names:
        if len(product_names) == 1:
            product_list = product_names[0]
        elif len(product_names) == 2:
            product_list = f"{product_names[0]} and {product_names[1]}"
        elif len(product_names) <= 3:
            product_list = ", ".join(product_names[:-1]) + f", and {product_names[-1]}"
        else:
            product_list = ", ".join(product_names[:2]) + f", and {len(product_names) - 2} more items"
    else:
        product_list = "items"
    
    # Use status_enum.value (the lowercase string) to match the actual enum value
    status_messages = {
        "accepted": f"Your ordered item{'s' if len(product_names) > 1 else ''} {product_list} {'are' if len(product_names) > 1 else 'is'} accepted by farmer.",
        "rejected": f"Your ordered item{'s' if len(product_names) > 1 else ''} {product_list} {'are' if len(product_names) > 1 else 'is'} rejected by farmer.",
        "packed": f"Your ordered item{'s' if len(product_names) > 1 else ''} {product_list} {'are' if len(product_names) > 1 else 'is'} packed and ready for shipping.",
        "shipped": f"Your ordered item{'s' if len(product_names) > 1 else ''} {product_list} {'are' if len(product_names) > 1 else 'is'} shipped and on the way.",
        "delivered": f"Your ordered item{'s' if len(product_names) > 1 else ''} {product_list} {'are' if len(product_names) > 1 else 'is'} delivered successfully! Please rate your experience.",
    }
    
    # Use status_enum.value to ensure we match the actual enum value (lowercase string)
    status_value = status_enum.value
    if status_value in status_messages:
        try:
            notification = OrderNotification(
                user_id=order.buyer_id,
                order_id=order.id,
                message=status_messages[status_value]
            )
            db.add(notification)
        except Exception as e:
            # Log error but don't fail the status update
            logger.error(f"Failed to create order notification: {e}", exc_info=True)
            # Continue without notification - status update will still succeed
    
    # Single commit for both status update and notification (FIXED: was double commit)
    db.commit()
    db.refresh(order)
    return order


@router.post("/notifications/{notification_id}/read", status_code=status.HTTP_200_OK)
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark an order notification as read."""
    notification = db.get(OrderNotification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    notification.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}


@router.delete("/notifications/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a single order notification."""
    notification = db.get(OrderNotification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(notification)
    db.commit()
    
    return {"message": "Notification deleted successfully"}


@router.delete("/notifications")
def clear_all_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete all order notifications for the current user."""
    notifications = (
        db.query(OrderNotification)
        .filter(OrderNotification.user_id == current_user.id)
        .all()
    )
    
    for notification in notifications:
        db.delete(notification)
    
    db.commit()
    
    return {"message": f"Deleted {len(notifications)} notifications successfully"}


@router.post(
    "/{order_id}/cancel",
    response_model=OrderRead,
    dependencies=[Depends(require_role(UserRole.BUYER))],
)
def cancel_order(
    order_id: int,
    cancel_request: OrderCancelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel an order (Buyer only, only if order is pending)."""
    from db.models import OrderStatus
    
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Only buyer can cancel their own order
    if order.buyer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to cancel this order",
        )
    
    # Only pending orders can be cancelled
    if order.status != OrderStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot cancel order with status '{order.status.value}'. Only pending orders can be cancelled.",
        )
    
    # Restore product quantities (skip if product was deleted)
    for item in order.items:
        if not item.product_id:
            continue
        product = db.get(Product, item.product_id)
        if product:
            product.quantity += item.quantity
    
    # Update order status to cancelled and store reason
    order.status = OrderStatus.CANCELLED.value
    order.cancellation_reason = cancel_request.reason
    
    # Get product names for notifications
    product_names = []
    for item in order.items:
        if item.product:
            product_names.append(item.product.name)
        elif item.product_id:
            product = db.get(Product, item.product_id)
            if product:
                product_names.append(product.name)
        else:
            product_names.append("(deleted product)")
    
    # Create product list string
    if product_names:
        if len(product_names) == 1:
            product_list = product_names[0]
        elif len(product_names) == 2:
            product_list = f"{product_names[0]} and {product_names[1]}"
        elif len(product_names) <= 3:
            product_list = ", ".join(product_names[:-1]) + f", and {product_names[-1]}"
        else:
            product_list = ", ".join(product_names[:2]) + f", and {len(product_names) - 2} more items"
    else:
        product_list = "items"
    
    # Create notification for buyer
    try:
        buyer_notification = OrderNotification(
            user_id=order.buyer_id,
            order_id=order.id,
            message=f"Your order #{order.id} for {product_list} has been cancelled successfully. Reason: {cancel_request.reason}"
        )
        db.add(buyer_notification)
    except Exception as e:
        logger.error(f"Failed to create buyer notification: {e}", exc_info=True)
    
    # Create notification for farmer(s) - one notification per unique farmer
    try:
        farmer_ids = set()
        for item in order.items:
            if not item.product_id:
                continue
            product = db.get(Product, item.product_id)
            if product and product.farmer_id:
                farmer_ids.add(product.farmer_id)
        
        for farmer_id in farmer_ids:
            farmer_notification = OrderNotification(
                user_id=farmer_id,
                order_id=order.id,
                message=f"Order #{order.id} for {product_list} has been cancelled by the buyer. Reason: {cancel_request.reason}"
            )
            db.add(farmer_notification)
    except Exception as e:
        logger.error(f"Failed to create farmer notification: {e}", exc_info=True)
    
    db.commit()
    db.refresh(order)
    
    return order







