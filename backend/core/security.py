from datetime import datetime, timedelta, timezone
from typing import Annotated
import logging

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from core.config import settings
from db.models import User, UserRole
from db.session import get_db
from schemas.auth import TokenData

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
# Optional scheme for routes that need to handle OPTIONS (CORS preflight)
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


# =========================
# PASSWORD HELPERS
# =========================

def _bcrypt_safe(password: str) -> str:
    """
    bcrypt supports max 72 bytes.
    This does NOT change logic, only prevents runtime crash.
    """
    pwd_bytes = password.encode("utf-8")
    if len(pwd_bytes) > 72:
        pwd_bytes = pwd_bytes[:72]
        return pwd_bytes.decode("utf-8", errors="ignore")
    return password


def verify_password(plain: str, hashed: str) -> bool:
    plain = _bcrypt_safe(plain)
    return pwd_context.verify(plain, hashed)


def get_password_hash(password: str) -> str:
    password = _bcrypt_safe(password)
    return pwd_context.hash(password)


# =========================
# JWT TOKEN HELPERS
# =========================

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": int(expire.timestamp())})
    return jwt.encode(
        to_encode,
        settings.secret_key,
        algorithm=settings.algorithm
    )


# =========================
# USER HELPERS
# =========================

def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


async def get_current_user_optional(
    request: Request,
    token: Annotated[str | None, Depends(oauth2_scheme_optional)] = None,
    db: Annotated[Session, Depends(get_db)] = None,
) -> User | None:
    """Get current user if token present; return None for no token or OPTIONS (CORS preflight)."""
    if request.method == "OPTIONS":
        return None
    if not token:
        return None
    try:
        return await get_current_user_from_token(token, db)
    except HTTPException:
        raise
    except Exception:
        return None


async def get_current_user_from_token(token: str, db: Session) -> User:
    """Extract user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        logger.info(f"Decoding token: {token[:20]}...")
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        logger.info(f"Token decoded successfully. Payload: {payload}")
        user_id = payload.get("sub")
        role = payload.get("role")
        
        logger.info(f"Extracted user_id={user_id}, role={role}")

        if user_id is None:
            logger.error("user_id is None in token payload")
            raise credentials_exception

        token_data = TokenData(user_id=user_id, role=role)

    except JWTError as e:
        logger.error(f"JWT decode error: {e}")
        raise credentials_exception

    # Resolve admin token to a real user row so FK constraints (e.g. group_chat_messages.sender_id) work
    if token_data.user_id == "admin" and token_data.role == "admin":
        admin_user = (
            db.query(User)
            .filter(User.email == "admin@gmail.com", User.role == UserRole.ADMIN)
            .first()
        )
        if not admin_user:
            admin_user = (
                db.query(User).filter(User.role == UserRole.ADMIN).first()
            )
        if not admin_user:
            # Create admin user so group chat and other FKs work (matches admin login credentials)
            admin_user = User(
                name="Admin",
                email="admin@gmail.com",
                hashed_password=get_password_hash("admin"),
                role=UserRole.ADMIN,
                phone=None,
                address=None,
                city=None,
                state=None,
                postal_code=None,
                is_active=True,
                is_banned=False,
                deactivated_by_admin=False,
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            logger.info("Admin user created in database and authenticated")
        else:
            logger.info("Admin user authenticated (from database)")
        return admin_user

    user = (
        get_user_by_id(db, int(token_data.user_id))
        if token_data.user_id
        else None
    )

    logger.info(f"User lookup result: {user}")

    if user is None:
        logger.error(f"User not found with id={token_data.user_id}")
        raise credentials_exception

    return user


# Keep original get_current_user for backward compatibility
async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Original get_current_user - use get_current_user_optional for routes that need OPTIONS support."""
    return await get_current_user_from_token(token, db)


# =========================
# ROLE GUARD
# =========================

def require_role(*roles: UserRole):
    async def dependency(
        request: Request,
        current_user: User | None = Depends(get_current_user_optional)
    ) -> User | None:
        # ✅ CRITICAL FIX: Allow CORS preflight (OPTIONS) requests without auth
        # OPTIONS requests don't have Authorization headers, so we must skip auth check
        if request.method == "OPTIONS":
            return None  # Allow OPTIONS to pass through
        
        # For non-OPTIONS requests, user must be authenticated
        if current_user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
            )
        
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return dependency
