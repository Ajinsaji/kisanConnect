from datetime import timedelta
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session

from core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
)
from db.models import (
    User,
    UserRole,
    GroupChat,
    GroupChatMember,
)
from db.session import get_db
from schemas.auth import Token
from schemas.user import UserCreate, UserLogin, UserRead
from core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/register", response_model=UserRead)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = User(
        name=user_in.name,
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        role=UserRole(user_in.role),
        phone=user_in.phone,
        address=user_in.address,
        city=user_in.city,
        state=user_in.state,
        postal_code=user_in.postal_code,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Auto-join farmers to the default "Free to Ask" group chat
    try:
        if user.role == UserRole.FARMER:
            # Find or create default farmer group
            group = (
                db.query(GroupChat)
                .filter(GroupChat.is_default_for_farmers.is_(True))
                .first()
            )
            if not group:
                group = GroupChat(
                    name="Free to Ask",
                    is_default_for_farmers=True,
                    created_by=None,
                )
                db.add(group)
                db.commit()
                db.refresh(group)

            # Ensure farmer is a member
            existing_member = (
                db.query(GroupChatMember)
                .filter(
                    GroupChatMember.group_id == group.id,
                    GroupChatMember.user_id == user.id,
                )
                .first()
            )
            if not existing_member:
                db.add(
                    GroupChatMember(
                        group_id=group.id,
                        user_id=user.id,
                        role="farmer",
                    )
                )

            # Ensure at least one admin is a member
            admin_user = db.query(User).filter(User.role == UserRole.ADMIN).first()
            if admin_user:
                admin_member = (
                    db.query(GroupChatMember)
                    .filter(
                        GroupChatMember.group_id == group.id,
                        GroupChatMember.user_id == admin_user.id,
                    )
                    .first()
                )
                if not admin_member:
                    db.add(
                        GroupChatMember(
                            group_id=group.id,
                            user_id=admin_user.id,
                            role="admin",
                        )
                    )

            db.commit()
    except Exception:
        # Group chat membership is non-critical; avoid failing registration
        db.rollback()

    return user


@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    # Log will only execute if validation passed (user_in is valid)
    logger.info(f"Login attempt for email: {user_in.email}")
    user = db.query(User).filter(User.email == user_in.email).first()
    
    if not user:
        logger.warning(f"Login failed: User not found for email: {user_in.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    
    logger.info(f"User found: {user.id}, checking password...")
    
    if not verify_password(user_in.password, user.hashed_password):
        logger.warning(f"Login failed: Invalid password for user: {user.id} ({user_in.email})")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password",
        )
    
    # Check if user is banned
    if user.is_banned:
        logger.warning(f"Login blocked: User {user.id} ({user_in.email}) is banned")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been banned. Please contact support.",
        )
    
    # Block login only when admin deactivated (super inactive). Farmer self-inactive can still log in.
    if getattr(user, "deactivated_by_admin", False):
        logger.warning(f"Login blocked: User {user.id} ({user_in.email}) is deactivated by admin")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is inactive. Please contact support.",
        )
    
    logger.info(f"Login successful for user: {user.id} ({user_in.email})")
    expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=expires,
    )
    return Token(access_token=access_token)


