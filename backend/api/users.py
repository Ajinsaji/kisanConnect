from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.security import get_current_user, get_db, require_role
from db.models import User, UserRole
from schemas.user import UserRead, UserBase

router = APIRouter()


@router.get("/me", response_model=UserRead)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Get current user's profile."""
    return current_user


@router.put("/me", response_model=UserRead)
def update_current_user_profile(
    user_update: UserBase,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update current user's profile."""
    # Check if email is being changed and if it's already taken
    if user_update.email != current_user.email:
        existing = db.query(User).filter(User.email == user_update.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Update all fields
    current_user.name = user_update.name
    current_user.email = user_update.email
    current_user.phone = user_update.phone
    current_user.address = user_update.address
    current_user.city = user_update.city
    current_user.state = user_update.state
    current_user.postal_code = user_update.postal_code
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.put("/me/toggle-active", response_model=UserRead, dependencies=[Depends(require_role(UserRole.FARMER))])
def toggle_farmer_active_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle farmer's active status. Only farmers can use this; blocked when admin deactivated."""
    if current_user.role != UserRole.FARMER:
        raise HTTPException(
            status_code=403,
            detail="Only farmers can toggle their active status",
        )
    if getattr(current_user, "deactivated_by_admin", False):
        raise HTTPException(
            status_code=403,
            detail="Your account is inactive. Please contact support.",
        )
    current_user.is_active = not current_user.is_active
    db.commit()
    db.refresh(current_user)
    return current_user

