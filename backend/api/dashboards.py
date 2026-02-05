from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
import logging

from core.security import get_current_user, get_db, require_role
from db.models import Order, OrderItem, Product, User, UserRole, OrderStatus
from schemas.order import OrderRead
from schemas.product import ProductRead

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/farmer", dependencies=[Depends(require_role(UserRole.FARMER))])
def farmer_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get farmer dashboard data."""
    try:
        # Validate current_user exists
        if not current_user:
            raise HTTPException(status_code=401, detail="User not authenticated")
        
        # Ensure user is a farmer
        if current_user.role != UserRole.FARMER:
            raise HTTPException(status_code=403, detail="Access denied. Farmer role required")
        # Get farmer's products
        products = (
            db.query(Product)
            .filter(Product.farmer_id == current_user.id)
            .order_by(Product.created_at.desc())
            .all()
        )
        
        # Get orders for farmer's products
        product_ids = [p.id for p in products]
        
        if product_ids:
            # ✅ Load relationships (items with product, buyer) for OrderRead schema
            # Use cast to handle status as string to avoid enum conversion issues
            from sqlalchemy import cast, String
            orders = (
                db.query(Order)
                .join(OrderItem, Order.id == OrderItem.order_id)
                .filter(OrderItem.product_id.in_(product_ids))
                .options(
                    joinedload(Order.items).joinedload(OrderItem.product),
                    joinedload(Order.buyer)
                )
                .distinct()
                .order_by(Order.created_at.desc())
                .limit(10)
                .all()
            )
        else:
            orders = []
        
        # Calculate statistics
        total_products = len(products)
        # Calculate total orders count (not just the limited recent orders)
        if product_ids:
            # Get distinct order IDs for farmer's products
            distinct_order_ids = (
                db.query(OrderItem.order_id)
                .filter(OrderItem.product_id.in_(product_ids))
                .distinct()
                .all()
            )
            total_orders = len(distinct_order_ids)
        else:
            total_orders = 0
        
        # Calculate total revenue (only if there are products)
        if product_ids:
            revenue_result = (
                db.query(func.sum(OrderItem.price * OrderItem.quantity))
                .filter(OrderItem.product_id.in_(product_ids))
                .scalar()
            )
            total_revenue = float(revenue_result) if revenue_result is not None else 0.0
        else:
            total_revenue = 0.0
        
        # Low stock products (quantity < 10)
        low_stock_products = [p for p in products if p.quantity < 10]
        
        # ✅ Convert SQLAlchemy objects to Pydantic schemas for JSON serialization
        try:
            products_data = [ProductRead.model_validate(p) for p in products]
            products_dict = [p.model_dump() for p in products_data]
        except Exception as e:
            logger.error(f"Error serializing products: {e}", exc_info=True)
            products_dict = []
        
        # ✅ Serialize orders - use manual serialization to avoid enum/type issues
        orders_dict = []
        for o in orders:
            try:
                # Get status value safely - handle enum conversion errors gracefully
                try:
                    if isinstance(o.status, str):
                        status_value = o.status.lower()
                    elif hasattr(o.status, 'value'):
                        status_value = o.status.value
                    else:
                        # Try to get string representation
                        status_str = str(o.status)
                        # If it looks like an enum name (uppercase), try to get the value
                        if status_str.isupper() and hasattr(OrderStatus, status_str):
                            status_value = getattr(OrderStatus, status_str).value
                        else:
                            status_value = status_str.lower()
                except Exception as status_err:
                    logger.warning(f"Error getting status for order {o.id}: {status_err}, using 'pending'")
                    status_value = "pending"  # Default fallback
                
                # Serialize items
                items_list = []
                for item in o.items:
                    item_dict = {
                        "id": item.id,
                        "product_id": item.product_id,
                        "quantity": item.quantity,
                        "price": float(item.price),
                    }
                    # Add product if available
                    if hasattr(item, 'product') and item.product:
                        try:
                            item_dict["product"] = {
                                "id": item.product.id,
                                "name": item.product.name,
                                "price": float(item.product.price),
                                "image_url": getattr(item.product, 'image_url', None),
                            }
                        except Exception as prod_err:
                            logger.warning(f"Error serializing product for item {item.id}: {prod_err}")
                            item_dict["product"] = None
                    else:
                        item_dict["product"] = None
                    items_list.append(item_dict)
                
                # Build order dictionary
                order_dict = {
                    "id": o.id,
                    "buyer_id": o.buyer_id,
                    "total_amount": float(o.total_amount),
                    "status": status_value,
                    "created_at": o.created_at.isoformat() if hasattr(o.created_at, 'isoformat') else str(o.created_at),
                    "items": items_list,
                    "buyer": None,
                    "shipping_address": getattr(o, 'shipping_address', None),
                    "payment_method": getattr(o, 'payment_method', None),
                    "buyer_email": getattr(o, 'buyer_email', None),
                    "cancellation_reason": getattr(o, 'cancellation_reason', None),
                    "delivery_type": getattr(o, 'delivery_type', None),
                    "preferred_date": str(o.preferred_date) if getattr(o, 'preferred_date', None) else None,
                    "preferred_time": getattr(o, 'preferred_time', None),
                }
                
                # Add buyer if available
                if hasattr(o, 'buyer') and o.buyer:
                    try:
                        order_dict["buyer"] = {
                            "id": o.buyer.id,
                            "name": o.buyer.name,
                            "email": o.buyer.email,
                        }
                    except Exception as buyer_err:
                        logger.warning(f"Error serializing buyer for order {o.id}: {buyer_err}")
                
                orders_dict.append(order_dict)
            except Exception as order_error:
                logger.error(f"Error serializing order {getattr(o, 'id', 'unknown')}: {order_error}", exc_info=True)
        
        try:
            low_stock_data = [ProductRead.model_validate(p) for p in low_stock_products[:5]]
            low_stock_dict = [p.model_dump() for p in low_stock_data]
        except Exception as e:
            logger.error(f"Error serializing low stock products: {e}", exc_info=True)
            low_stock_dict = []
        
        return {
            "user": {
                "id": current_user.id,
                "name": current_user.name,
                "email": current_user.email,
                "role": current_user.role.value,
            },
            "statistics": {
                "total_products": total_products,
                "total_orders": total_orders,
                "total_revenue": float(total_revenue),
                "low_stock_count": len(low_stock_products),
            },
            "products": products_dict,
            "recent_orders": orders_dict,
            "low_stock_products": low_stock_dict,
        }
    except Exception as e:
        error_msg = f"Error in farmer_dashboard: {type(e).__name__}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to load dashboard: {type(e).__name__}: {str(e)}"
        )


@router.get("/buyer", dependencies=[Depends(require_role(UserRole.BUYER))])
def buyer_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get buyer/customer dashboard data."""
    try:
        # Get all available products
        products = (
            db.query(Product)
            .filter(Product.quantity > 0)
            .order_by(Product.created_at.desc())
            .limit(10)
            .all()
        )
        
        # Get buyer's orders
        # ✅ Load relationships (items with product, buyer) for OrderRead schema
        orders = (
            db.query(Order)
            .filter(Order.buyer_id == current_user.id)
            .options(
                joinedload(Order.items).joinedload(OrderItem.product),
                joinedload(Order.buyer)
            )
            .order_by(Order.created_at.desc())
            .limit(5)
            .all()
        )
        
        # Get cart item count
        from db.models import CartItem
        cart_count = (
            db.query(func.sum(CartItem.quantity))
            .filter(CartItem.user_id == current_user.id)
            .scalar() or 0
        )
        
        # Calculate statistics
        total_orders = (
            db.query(func.count(Order.id))
            .filter(Order.buyer_id == current_user.id)
            .scalar() or 0
        )
        
        total_spent = (
            db.query(func.sum(Order.total_amount))
            .filter(Order.buyer_id == current_user.id)
            .scalar() or 0.0
        )
        
        # ✅ Convert SQLAlchemy objects to Pydantic schemas for JSON serialization
        try:
            products_data = [ProductRead.model_validate(p) for p in products]
            products_dict = [p.model_dump() for p in products_data]
        except Exception as e:
            logger.error(f"Error serializing products: {e}", exc_info=True)
            products_dict = []
        
        # ✅ Serialize orders - use manual serialization to avoid enum/type issues
        orders_dict = []
        for o in orders:
            try:
                # Get status value safely - handle enum conversion errors gracefully
                try:
                    if isinstance(o.status, str):
                        status_value = o.status.lower()
                    elif hasattr(o.status, 'value'):
                        status_value = o.status.value
                    else:
                        # Try to get string representation
                        status_str = str(o.status)
                        # If it looks like an enum name (uppercase), try to get the value
                        if status_str.isupper() and hasattr(OrderStatus, status_str):
                            status_value = getattr(OrderStatus, status_str).value
                        else:
                            status_value = status_str.lower()
                except Exception as status_err:
                    logger.warning(f"Error getting status for order {o.id}: {status_err}, using 'pending'")
                    status_value = "pending"  # Default fallback
                
                # Serialize items
                items_list = []
                for item in o.items:
                    item_dict = {
                        "id": item.id,
                        "product_id": item.product_id,
                        "quantity": item.quantity,
                        "price": float(item.price),
                    }
                    # Add product if available
                    if hasattr(item, 'product') and item.product:
                        try:
                            item_dict["product"] = {
                                "id": item.product.id,
                                "name": item.product.name,
                                "price": float(item.product.price),
                                "image_url": getattr(item.product, 'image_url', None),
                            }
                        except Exception as prod_err:
                            logger.warning(f"Error serializing product for item {item.id}: {prod_err}")
                            item_dict["product"] = None
                    else:
                        item_dict["product"] = None
                    items_list.append(item_dict)
                
                # Build order dictionary
                order_dict = {
                    "id": o.id,
                    "buyer_id": o.buyer_id,
                    "total_amount": float(o.total_amount),
                    "status": status_value,
                    "created_at": o.created_at.isoformat() if hasattr(o.created_at, 'isoformat') else str(o.created_at),
                    "items": items_list,
                    "buyer": None,
                    "shipping_address": getattr(o, 'shipping_address', None),
                    "payment_method": getattr(o, 'payment_method', None),
                    "buyer_email": getattr(o, 'buyer_email', None),
                    "cancellation_reason": getattr(o, 'cancellation_reason', None),
                    "delivery_type": getattr(o, 'delivery_type', None),
                    "preferred_date": str(o.preferred_date) if getattr(o, 'preferred_date', None) else None,
                    "preferred_time": getattr(o, 'preferred_time', None),
                }
                
                # Add buyer if available
                if hasattr(o, 'buyer') and o.buyer:
                    try:
                        order_dict["buyer"] = {
                            "id": o.buyer.id,
                            "name": o.buyer.name,
                            "email": o.buyer.email,
                        }
                    except Exception as buyer_err:
                        logger.warning(f"Error serializing buyer for order {o.id}: {buyer_err}")
                
                orders_dict.append(order_dict)
            except Exception as order_error:
                logger.error(f"Error serializing order {getattr(o, 'id', 'unknown')}: {order_error}", exc_info=True)
        
        return {
            "user": {
                "id": current_user.id,
                "name": current_user.name,
                "email": current_user.email,
                "role": current_user.role.value,
            },
            "statistics": {
                "total_orders": total_orders,
                "total_spent": float(total_spent),
                "cart_items": int(cart_count),
            },
            "featured_products": products_dict,
            "recent_orders": orders_dict,
        }
    except Exception as e:
        error_msg = f"Error in buyer_dashboard: {type(e).__name__}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to load dashboard: {type(e).__name__}: {str(e)}"
        )

