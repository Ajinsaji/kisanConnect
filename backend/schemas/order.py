from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel
from schemas.user import UserRead
from schemas.product import ProductRead


class OrderStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    packed = "packed"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class OrderItemBase(BaseModel):
    product_id: int
    quantity: int


class OrderItemRead(BaseModel):
    id: int
    product_id: int | None = None  # None when product was deleted (ON DELETE SET NULL)
    quantity: int
    price: float
    product: ProductRead | None = None

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    items: list[OrderItemBase]
    shipping_address: str | None = None
    payment_method: str = "cash"
    delivery_type: str = "delivery"  # schedule_delivery | express_delivery | pickup
    preferred_date: str | None = None
    preferred_time: str | None = None  # e.g. "09:00-12:00" or "Morning"


class OrderRead(BaseModel):
    id: int
    buyer_id: int
    total_amount: float
    status: OrderStatus
    created_at: datetime
    items: list[OrderItemRead]
    buyer: UserRead | None = None
    shipping_address: str | None = None
    payment_method: str | None = None
    buyer_email: str | None = None
    cancellation_reason: str | None = None
    delivery_type: str | None = None
    preferred_date: date | None = None
    preferred_time: str | None = None

    class Config:
        from_attributes = True


class OrderCancelRequest(BaseModel):
    reason: str







