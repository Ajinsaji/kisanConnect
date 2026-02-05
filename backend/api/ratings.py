from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
import logging

from core.security import get_current_user, get_db, require_role
from db.models import Rating, Order, User, UserRole, Product
from pydantic import BaseModel
from typing import Optional

router = APIRouter()
logger = logging.getLogger(__name__)


class RatingCreate(BaseModel):
    order_id: int
    rating: int  # 1-5
    comment: Optional[str] = None


class RatingRead(BaseModel):
    id: int
    order_id: int
    user_id: int
    farmer_id: int
    rating: int
    comment: Optional[str] = None
    created_at: str
    user_name: Optional[str] = None

    class Config:
        from_attributes = True


@router.post("/", response_model=RatingRead, status_code=status.HTTP_201_CREATED)
def create_rating(
    rating_in: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a rating for an order (Buyer only)."""
    if current_user.role != UserRole.BUYER:
        raise HTTPException(
            status_code=403,
            detail="Only buyers can rate orders"
        )
    
    # Validate rating
    if rating_in.rating < 1 or rating_in.rating > 5:
        raise HTTPException(
            status_code=400,
            detail="Rating must be between 1 and 5"
        )
    
    # Get order and verify it belongs to the user
    order = db.get(Order, rating_in.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.buyer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only rate your own orders"
        )
    
    # Check if order is delivered
    if order.status.value != "delivered":
        raise HTTPException(
            status_code=400,
            detail="You can only rate delivered orders"
        )
    
    # Check if already rated
    existing_rating = (
        db.query(Rating)
        .filter(Rating.order_id == rating_in.order_id)
        .filter(Rating.user_id == current_user.id)
        .first()
    )
    if existing_rating:
        raise HTTPException(
            status_code=400,
            detail="You have already rated this order"
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
    
    # Create rating
    rating = Rating(
        order_id=rating_in.order_id,
        user_id=current_user.id,
        farmer_id=farmer_id,
        rating=rating_in.rating,
        comment=rating_in.comment
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)
    
    # Get user name for response
    rating_dict = {
        "id": rating.id,
        "order_id": rating.order_id,
        "user_id": rating.user_id,
        "farmer_id": rating.farmer_id,
        "rating": rating.rating,
        "comment": rating.comment,
        "created_at": rating.created_at.isoformat(),
        "user_name": current_user.name
    }
    
    return rating_dict


@router.get("/farmer/{farmer_id}", response_model=dict)
def get_farmer_ratings(
    farmer_id: int,
    db: Session = Depends(get_db),
):
    """Get all ratings for a farmer."""
    ratings = (
        db.query(Rating)
        .filter(Rating.farmer_id == farmer_id)
        .order_by(Rating.created_at.desc())
        .all()
    )
    
    if not ratings:
        return {
            "farmer_id": farmer_id,
            "average_rating": 0.0,
            "total_ratings": 0,
            "ratings": []
        }
    
    # Calculate average
    total_rating = sum(r.rating for r in ratings)
    average_rating = total_rating / len(ratings)
    
    # Get user names
    ratings_list = []
    for rating in ratings:
        user = db.get(User, rating.user_id)
        ratings_list.append({
            "id": rating.id,
            "order_id": rating.order_id,
            "user_id": rating.user_id,
            "user_name": user.name if user else "Anonymous",
            "rating": rating.rating,
            "comment": rating.comment,
            "created_at": rating.created_at.isoformat()
        })
    
    return {
        "farmer_id": farmer_id,
        "average_rating": round(average_rating, 2),
        "total_ratings": len(ratings),
        "ratings": ratings_list
    }


@router.get("/order/{order_id}", response_model=Optional[RatingRead])
def get_order_rating(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get rating for a specific order."""
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check authorization
    if current_user.role == UserRole.BUYER and order.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    rating = (
        db.query(Rating)
        .filter(Rating.order_id == order_id)
        .first()
    )
    
    if not rating:
        return None
    
    user = db.get(User, rating.user_id)
    return {
        "id": rating.id,
        "order_id": rating.order_id,
        "user_id": rating.user_id,
        "farmer_id": rating.farmer_id,
        "rating": rating.rating,
        "comment": rating.comment,
        "created_at": rating.created_at.isoformat(),
        "user_name": user.name if user else None
    }
