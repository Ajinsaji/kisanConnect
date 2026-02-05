from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from core.security import (
    create_access_token,
    verify_password,
    get_current_user,
    require_role,
)
from db.models import User, UserRole, Order, OrderItem, Product, AdminMessage, Complaint, OrderNotification, AppSettings
from pydantic import BaseModel
from typing import Optional
from db.session import get_db
from schemas.auth import Token
from schemas.user import UserLogin, UserRead
from schemas.complaint import ComplaintResolveRequest
from schemas.settings import AppSettingRead, AppSettingUpdate, NewsSettingsResponse
from core.config import settings

router = APIRouter()

# Hardcoded admin credentials
ADMIN_EMAIL = "admin@gmail.com"
ADMIN_PASSWORD = "admin"


@router.post("/login", response_model=Token)
def admin_login(user_in: UserLogin, db: Session = Depends(get_db)):
    """Admin login with hardcoded credentials"""
    if user_in.email != ADMIN_EMAIL or user_in.password != ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials",
        )
    
    expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": "admin", "role": "admin"},
        expires_delta=expires,
    )
    return Token(access_token=access_token)


def get_admin_user(token: str = Depends(None)) -> bool:
    """Verify admin access - check if user is admin"""
    # This would be enhanced with proper JWT verification
    return True


@router.get("/users", response_model=list[UserRead])
def get_all_users(db: Session = Depends(get_db)):
    """Get all users and farmers"""
    users = db.query(User).all()
    return users


@router.get("/users/farmers", response_model=list[UserRead])
def get_all_farmers(db: Session = Depends(get_db)):
    """Get all farmers"""
    farmers = db.query(User).filter(User.role == UserRole.FARMER).all()
    return farmers


@router.get("/users/buyers", response_model=list[UserRead])
def get_all_buyers(db: Session = Depends(get_db)):
    """Get all customers/buyers"""
    buyers = db.query(User).filter(User.role == UserRole.BUYER).all()
    return buyers


@router.get("/users/{user_id}", response_model=UserRead)
def get_user_details(user_id: int, db: Session = Depends(get_db)):
    """Get specific user details"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.post("/users/{user_id}/ban")
def ban_user(user_id: int, db: Session = Depends(get_db)):
    """Ban a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot ban admin user",
        )
    user.is_banned = True
    db.commit()
    db.refresh(user)
    return {"message": "User banned successfully", "user": user}


@router.post("/users/{user_id}/unban")
def unban_user(user_id: int, db: Session = Depends(get_db)):
    """Unban a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    user.is_banned = False
    db.commit()
    db.refresh(user)
    return {"message": "User unbanned successfully", "user": user}


@router.post("/users/{user_id}/deactivate")
def deactivate_user(user_id: int, db: Session = Depends(get_db)):
    """Deactivate a user (super inactive): they cannot log in or self-reactivate."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    if user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate admin user",
        )
    user.is_active = False
    user.deactivated_by_admin = True
    db.commit()
    db.refresh(user)
    return {"message": "User deactivated successfully", "user": user}


@router.post("/users/{user_id}/activate")
def activate_user(user_id: int, db: Session = Depends(get_db)):
    """Activate a user (clears admin deactivation so they can log in and self-toggle)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    user.is_active = True
    user.deactivated_by_admin = False
    db.commit()
    db.refresh(user)
    return {"message": "User activated successfully", "user": user}


@router.get("/orders", response_model=list[dict])
def get_all_orders(db: Session = Depends(get_db)):
    """Get all orders"""
    orders = db.query(Order).all()
    result = []
    for order in orders:
        result.append({
            "id": order.id,
            "buyer_id": order.buyer_id,
            "buyer_name": order.buyer.name,
            "buyer_email": order.buyer.email,
            "buyer_phone": getattr(order.buyer, 'phone', None),
            "total_amount": float(order.total_amount),
            "status": order.status.value,
            "created_at": order.created_at.isoformat(),
            "items_count": len(order.items),
            "cancellation_reason": getattr(order, 'cancellation_reason', None),
        })
    return result


@router.get("/orders/{order_id}", response_model=dict)
def get_order_details(order_id: int, db: Session = Depends(get_db)):
    """Get specific order details"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )
    
    # Get buyer details
    buyer = order.buyer
    buyer_details = {
        "id": buyer.id,
        "name": buyer.name,
        "email": buyer.email,
        "phone": getattr(buyer, 'phone', None),
        "address": getattr(buyer, 'address', None),
        "city": getattr(buyer, 'city', None),
        "state": getattr(buyer, 'state', None),
        "postal_code": getattr(buyer, 'postal_code', None),
    }
    
    # Get unique farmers from order items
    farmers = {}
    for item in order.items:
        if item.product and item.product.farmer:
            farmer = item.product.farmer
            if farmer.id not in farmers:
                farmers[farmer.id] = {
                    "id": farmer.id,
                    "name": farmer.name,
                    "email": farmer.email,
                    "phone": getattr(farmer, 'phone', None),
                    "address": getattr(farmer, 'address', None),
                    "city": getattr(farmer, 'city', None),
                    "state": getattr(farmer, 'state', None),
                }
    
    return {
        "id": order.id,
        "buyer_id": order.buyer_id,
        "buyer": buyer_details,
        "buyer_name": order.buyer.name,
        "buyer_email": order.buyer.email,
        "total_amount": float(order.total_amount),
        "status": order.status.value,
        "created_at": order.created_at.isoformat(),
        "shipping_address": getattr(order, 'shipping_address', None),
        "payment_method": getattr(order, 'payment_method', None),
        "cancellation_reason": getattr(order, 'cancellation_reason', None),
        "farmers": list(farmers.values()),  # List of all unique farmers
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else "(deleted product)",
                "farmer_id": item.product.farmer_id if item.product else None,
                "farmer_name": item.product.farmer.name if item.product else None,
                "farmer_email": item.product.farmer.email if item.product else None,
                "quantity": item.quantity,
                "price": float(item.price)
            }
            for item in order.items
        ]
    }


@router.get("/stats", response_model=dict, dependencies=[Depends(require_role(UserRole.ADMIN))])
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get admin dashboard statistics"""
    try:
        # Validate user is admin
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        total_users = db.query(User).count()
        total_farmers = db.query(User).filter(User.role == UserRole.FARMER).count()
        total_buyers = db.query(User).filter(User.role == UserRole.BUYER).count()
        total_orders = db.query(Order).count()
        total_products = db.query(Product).count()
        banned_users = db.query(User).filter(User.is_banned.is_(True)).count()
        inactive_users = db.query(User).filter(User.is_active.is_(False)).count()
        
        # Calculate total revenue
        total_revenue = 0.0
        try:
            orders = db.query(Order).all()
            for order in orders:
                total_revenue += float(order.total_amount)
        except Exception as e:
            # If there's an error calculating revenue, log it but continue
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Error calculating revenue: {e}")

        # Calculate growth/trend data based on orders over time
        # This makes the charts react when new orders are placed.
        def _order_growth():
            """
            Returns list of dicts with daily order counts and cumulative totals.
            """
            rows = (
                db.query(
                    func.date(Order.created_at).label("day"),
                    func.count(Order.id).label("count"),
                )
                .group_by(func.date(Order.created_at))
                .order_by(func.date(Order.created_at))
                .all()
            )

            data = []
            cumulative = 0
            for row in rows:
                day = row.day
                count = int(row.count or 0)
                cumulative += count
                day_str = day.isoformat() if hasattr(day, "isoformat") else str(day)
                data.append(
                    {
                        "date": day_str,
                        "new_orders": count,
                        "total_orders": cumulative,
                    }
                )
            return data

        # Use the same order-based series for both cards (admin sees demand trend from buyers and sales trend for farmers)
        order_growth = _order_growth()
        growth_farmers = order_growth
        growth_buyers = order_growth

        return {
            "total_users": total_users,
            "total_farmers": total_farmers,
            "total_buyers": total_buyers,
            "total_orders": total_orders,
            "total_products": total_products,
            "banned_users": banned_users,
            "inactive_users": inactive_users,
            "total_revenue": total_revenue,
            "growth": {
                "farmers": growth_farmers,
                "buyers": growth_buyers,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error in get_admin_stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load statistics: {str(e)}"
        )


@router.get("/users/{user_id}/products", response_model=list[dict])
def get_farmer_products(user_id: int, db: Session = Depends(get_db)):
    """Get products for a specific farmer"""
    farmer = db.query(User).filter(User.id == user_id).first()
    if not farmer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer not found",
        )
    
    products = db.query(Product).filter(Product.farmer_id == user_id).all()
    result = []
    for product in products:
        result.append({
            "id": product.id,
            "name": product.name,
            "category": product.category,
            "price": float(product.price),
            "quantity": product.quantity,
            "description": product.description,
            "created_at": product.created_at.isoformat()
        })
    return result


@router.get("/users/{user_id}/orders", response_model=list[dict])
def get_user_orders(user_id: int, db: Session = Depends(get_db)):
    """Get orders for a specific user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    orders = db.query(Order).filter(Order.buyer_id == user_id).all()
    result = []
    for order in orders:
        result.append({
            "id": order.id,
            "total_amount": float(order.total_amount),
            "status": order.status.value,
            "created_at": order.created_at.isoformat(),
            "items_count": len(order.items)
        })
    return result


# =========================
# ADMIN MESSAGING SCHEMAS
# =========================

class AdminMessageCreate(BaseModel):
    farmer_id: Optional[int] = None  # None = group message to all farmers
    message_text: str | None = ""  # Can be empty if file is sent
    message_type: str = "info"  # info, policy, news, announcement
    link_url: Optional[str] = None
    file_url: Optional[str] = None
    file_type: Optional[str] = None  # image, document
    file_name: Optional[str] = None


class AdminMessageRead(BaseModel):
    id: int
    farmer_id: Optional[int]
    message_text: str | None = ""
    message_type: str
    link_url: Optional[str]
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    file_name: Optional[str] = None
    is_read: bool
    created_at: str


# =========================
# ADMIN MESSAGING ENDPOINTS
# =========================

@router.post("/messages/send", response_model=dict)
def send_admin_message(
    msg_in: AdminMessageCreate,
    db: Session = Depends(get_db),
):
    """Send message from admin to farmer(s). If farmer_id is None, sends to all farmers."""
    if msg_in.farmer_id:
        # Individual message
        farmer = db.get(User, msg_in.farmer_id)
        if not farmer or farmer.role != UserRole.FARMER:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Farmer not found",
            )
        
        message = AdminMessage(
            farmer_id=msg_in.farmer_id,
            message_text=msg_in.message_text or "",
            message_type=msg_in.message_type,
            link_url=msg_in.link_url,
            file_url=msg_in.file_url,
            file_type=msg_in.file_type,
            file_name=msg_in.file_name,
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        
        return {
            "message": "Message sent successfully",
            "sent_to": "individual",
            "farmer_id": msg_in.farmer_id,
            "admin_message_id": message.id
        }
    else:
        # Group message to all farmers
        farmers = db.query(User).filter(User.role == UserRole.FARMER).all()
        created_messages = []
        
        for farmer in farmers:
            message = AdminMessage(
                farmer_id=farmer.id,
                message_text=msg_in.message_text or "",
                message_type=msg_in.message_type,
                link_url=msg_in.link_url,
                file_url=msg_in.file_url,
                file_type=msg_in.file_type,
                file_name=msg_in.file_name,
            )
            db.add(message)
            created_messages.append(message.id)
        
        db.commit()
        
        return {
            "message": "Group message sent successfully",
            "sent_to": "all_farmers",
            "recipients_count": len(farmers),
            "admin_message_ids": created_messages
        }


@router.get("/messages/farmer/{farmer_id}", response_model=list[AdminMessageRead])
def get_farmer_admin_messages(
    farmer_id: int,
    db: Session = Depends(get_db),
):
    """Get all admin messages for a specific farmer."""
    farmer = db.get(User, farmer_id)
    if not farmer or farmer.role != UserRole.FARMER:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Farmer not found",
        )
    
    messages = (
        db.query(AdminMessage)
        .filter(AdminMessage.farmer_id == farmer_id)
        .order_by(AdminMessage.created_at.desc())
        .all()
    )
    
    return [
        {
            "id": msg.id,
            "farmer_id": msg.farmer_id,
            "message_text": msg.message_text,
            "message_type": msg.message_type,
            "link_url": msg.link_url,
            "file_url": msg.file_url,
            "file_type": msg.file_type,
            "file_name": msg.file_name,
            "is_read": msg.is_read,
            "created_at": msg.created_at.isoformat(),
        }
        for msg in messages
    ]


@router.get("/complaints", response_model=list[dict])
def get_all_complaints(
    status_filter: Optional[str] = Query(default=None, description="Filter by status: pending, resolved, dismissed"),
    db: Session = Depends(get_db),
):
    """Get all complaints with optional status filter."""
    from sqlalchemy.orm import joinedload
    
    query = db.query(Complaint).options(
        joinedload(Complaint.user),
        joinedload(Complaint.farmer),
        joinedload(Complaint.order)
    )
    
    if status_filter and status_filter.lower() != "all":
        query = query.filter(Complaint.status == status_filter.lower())
    
    complaints = query.order_by(Complaint.created_at.desc()).all()
    
    return [
        {
            "id": c.id,
            "order_id": c.order_id,
            "user_id": c.user_id,
            "farmer_id": c.farmer_id,
            "user_name": c.user.name if c.user else "Unknown",
            "farmer_name": c.farmer.name if c.farmer else "Unknown",
            "complaint_type": c.complaint_type,
            "description": c.description,
            "status": c.status,
            "created_at": c.created_at.isoformat(),
            "resolved_at": c.resolved_at.isoformat() if c.resolved_at else None,
            "resolution_comment": c.resolution_comment,
            "order_total": c.order.total_amount if c.order else None,
        }
        for c in complaints
    ]


@router.put("/complaints/{complaint_id}/resolve")
def resolve_complaint(
    complaint_id: int,
    resolve_request: ComplaintResolveRequest,
    db: Session = Depends(get_db),
):
    """Mark a complaint as resolved. Requires a resolution comment explaining how the issue was resolved."""
    from datetime import datetime, timezone
    
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    if not resolve_request.resolution_comment or not resolve_request.resolution_comment.strip():
        raise HTTPException(
            status_code=400, 
            detail="Resolution comment is required. Please explain how the issue was resolved."
        )
    
    if len(resolve_request.resolution_comment.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Resolution comment must be at least 10 characters long."
        )
    
    complaint.status = "resolved"
    complaint.resolved_at = datetime.now(timezone.utc)
    complaint.resolution_comment = resolve_request.resolution_comment.strip()
    db.commit()
    db.refresh(complaint)
    
    return {"message": "Complaint resolved successfully", "complaint_id": complaint_id}


@router.put("/complaints/{complaint_id}/dismiss")
def dismiss_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
):
    """Dismiss a complaint."""
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    complaint.status = "dismissed"
    db.commit()
    db.refresh(complaint)
    
    return {"message": "Complaint dismissed successfully", "complaint_id": complaint_id}


class ComplaintMessageCreate(BaseModel):
    message: str


@router.post("/complaints/{complaint_id}/send-message")
def send_complaint_message(
    complaint_id: int,
    msg_in: ComplaintMessageCreate,
    db: Session = Depends(get_db),
):
    """Send a message to customer about their complaint and create notification.
    Also sends a notification to the farmer about the complaint."""
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    order = db.get(Order, complaint.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Create notification for the customer
    customer_notification = OrderNotification(
        user_id=complaint.user_id,
        order_id=complaint.order_id,
        message=msg_in.message,
        is_read=False
    )
    db.add(customer_notification)
    
    # Create notification for the farmer about the complaint
    farmer_message = (
        "This is an official message from Kisan Connect team. "
        "We got a complaint against you from last order. "
        "We will check the issue. Please cooperate with us. Thank you."
    )
    farmer_notification = OrderNotification(
        user_id=complaint.farmer_id,
        order_id=complaint.order_id,
        message=farmer_message,
        is_read=False
    )
    db.add(farmer_notification)
    db.commit()
    
    return {
        "message": "Message sent successfully to customer and farmer",
        "complaint_id": complaint_id,
        "customer_notification_id": customer_notification.id,
        "farmer_notification_id": farmer_notification.id
    }


@router.get("/complaints/{complaint_id}/farmer-details", response_model=dict)
def get_complaint_farmer_details(
    complaint_id: int,
    db: Session = Depends(get_db),
):
    """Get farmer details and selling history for a complaint."""
    from sqlalchemy.orm import joinedload
    
    complaint = db.get(Complaint, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Get farmer details
    farmer = db.get(User, complaint.farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer not found")
    
    # Get farmer's products
    products = (
        db.query(Product)
        .filter(Product.farmer_id == complaint.farmer_id)
        .order_by(Product.created_at.desc())
        .all()
    )
    
    # Get farmer's orders (orders for their products)
    farmer_orders = (
        db.query(Order)
        .join(OrderItem, Order.id == OrderItem.order_id)
        .join(Product, OrderItem.product_id == Product.id)
        .filter(Product.farmer_id == complaint.farmer_id)
        .options(joinedload(Order.items))
        .distinct()
        .order_by(Order.created_at.desc())
        .limit(10)
        .all()
    )
    
    # Calculate statistics
    total_products = len(products)
    total_orders = len(farmer_orders)
    total_revenue = sum(
        float(order.total_amount) for order in farmer_orders 
        if order.status.value == "delivered"
    )
    
    return {
        "farmer": {
            "id": farmer.id,
            "name": farmer.name,
            "email": farmer.email,
            "phone": farmer.phone,
            "address": farmer.address,
            "city": farmer.city,
            "state": farmer.state,
            "postal_code": farmer.postal_code,
            "created_at": farmer.created_at.isoformat(),
        },
        "statistics": {
            "total_products": total_products,
            "total_orders": total_orders,
            "total_revenue": float(total_revenue) if total_revenue else 0.0,
        },
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "category": p.category,
                "price": float(p.price),
                "quantity": p.quantity,
                "created_at": p.created_at.isoformat(),
            }
            for p in products
        ],
        "recent_orders": [
            {
                "id": o.id,
                "total_amount": float(o.total_amount),
                "status": o.status.value,
                "created_at": o.created_at.isoformat(),
            }
            for o in farmer_orders
        ],
    }


@router.get("/messages/all", response_model=list[dict])
def get_all_admin_messages(
    db: Session = Depends(get_db),
):
    """Get all admin messages (for admin dashboard)."""
    messages = (
        db.query(AdminMessage)
        .order_by(AdminMessage.created_at.desc())
        .limit(100)
        .all()
    )
    
    result = []
    for msg in messages:
        farmer_name = msg.farmer.name if msg.farmer else "All Farmers"
        result.append({
            "id": msg.id,
            "farmer_id": msg.farmer_id,
            "farmer_name": farmer_name,
            "message_text": msg.message_text,
            "message_type": msg.message_type,
            "link_url": msg.link_url,
            "file_url": msg.file_url,
            "file_type": msg.file_type,
            "file_name": msg.file_name,
            "is_read": msg.is_read,
            "created_at": msg.created_at.isoformat(),
        })
    
    return result


# =========================
# APP SETTINGS - Government News Mute/Unmute
# =========================

@router.get("/settings/news", response_model=NewsSettingsResponse)
def get_news_settings(
    db: Session = Depends(get_db),
):
    """Get current government news notification settings.

    NOTE: For simplicity in this demo project, this endpoint is not restricted
    to admin-only via authentication. It only reads a global setting.
    """
    setting = db.query(AppSettings).filter(AppSettings.setting_key == "government_news_enabled").first()
    
    if not setting:
        # Default: enabled
        return NewsSettingsResponse(
            news_enabled=True,
            message="Government news notifications are enabled"
        )
    
    is_enabled = setting.setting_value.lower() == "true"
    return NewsSettingsResponse(
        news_enabled=is_enabled,
        message=f"Government news notifications are {'enabled' if is_enabled else 'muted'}"
    )


@router.put("/settings/news/toggle", response_model=NewsSettingsResponse)
def toggle_news_notifications(
    db: Session = Depends(get_db),
):
    """Toggle government news notifications on/off (mute/unmute).

    NOTE: For simplicity in this demo project, this endpoint is not restricted
    to admin-only via authentication. In a production system, this should
    require proper admin authentication/authorization.
    """
    setting = db.query(AppSettings).filter(AppSettings.setting_key == "government_news_enabled").first()
    
    if not setting:
        # Create new setting, default to enabled
        setting = AppSettings(
            setting_key="government_news_enabled",
            setting_value="true",
            description="Enable/disable government news notifications for all users",
            updated_by=None
        )
        db.add(setting)
    else:
        # Toggle the value
        current_value = setting.setting_value.lower() == "true"
        setting.setting_value = "false" if current_value else "true"
        setting.updated_by = None
    
    db.commit()
    db.refresh(setting)
    
    is_enabled = setting.setting_value.lower() == "true"
    return NewsSettingsResponse(
        news_enabled=is_enabled,
        message=f"Government news notifications have been {'enabled' if is_enabled else 'muted'}"
    )
