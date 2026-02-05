from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from core.security import get_current_user, get_db, require_role
from db.models import Complaint, Order, User, UserRole, OrderItem, Product
from schemas.complaint import ComplaintCreate, ComplaintRead

router = APIRouter()


@router.post("/", response_model=ComplaintRead, status_code=status.HTTP_201_CREATED)
def create_complaint(
    complaint_in: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a complaint for a delivered order (Buyer only)."""
    if current_user.role != UserRole.BUYER:
        raise HTTPException(
            status_code=403,
            detail="Only buyers can file complaints"
        )
    
    # Validate complaint type
    valid_types = ["product_damage", "farmer_issue", "other"]
    if complaint_in.complaint_type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid complaint type. Must be one of: {', '.join(valid_types)}"
        )
    
    # Get order and verify it belongs to the user
    order = db.get(Order, complaint_in.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.buyer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only file complaints for your own orders"
        )
    
    # Check if order is delivered
    if order.status.value != "delivered":
        raise HTTPException(
            status_code=400,
            detail="You can only file complaints for delivered orders"
        )
    
    # Get farmer_id from order items (first item with a product)
    farmer_id = None
    for item in order.items:
        if item.product:
            farmer_id = item.product.farmer_id
            break
        if item.product_id:
            product = db.get(Product, item.product_id)
            if product:
                farmer_id = product.farmer_id
                break
    if not farmer_id:
        raise HTTPException(
            status_code=400,
            detail="Could not determine farmer for this order"
        )
    
    # Create complaint
    complaint = Complaint(
        order_id=complaint_in.order_id,
        user_id=current_user.id,
        farmer_id=farmer_id,
        complaint_type=complaint_in.complaint_type,
        description=complaint_in.description,
        status="pending"
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    
    return complaint


@router.get("/order/{order_id}", response_model=list[ComplaintRead])
def get_order_complaints(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all complaints for a specific order."""
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check authorization
    if current_user.role == UserRole.BUYER and order.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    complaints = (
        db.query(Complaint)
        .filter(Complaint.order_id == order_id)
        .order_by(Complaint.created_at.desc())
        .all()
    )
    
    return complaints
