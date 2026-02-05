from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr


class UserRole(str, Enum):
    farmer = "farmer"
    buyer = "buyer"
    admin = "admin"


class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None


class UserCreate(UserBase):
    password: str
    role: UserRole


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(UserBase):
    id: int
    role: UserRole
    is_active: bool = True
    is_banned: bool = False
    deactivated_by_admin: bool = False
    created_at: datetime

    class Config:
        from_attributes = True







