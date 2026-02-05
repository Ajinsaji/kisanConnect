from datetime import datetime

from pydantic import BaseModel
from schemas.user import UserRead


class ConversationRead(BaseModel):
    id: int
    buyer_id: int
    farmer_id: int
    created_at: datetime
    buyer: UserRead | None = None
    farmer: UserRead | None = None

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    conversation_id: int
    message_text: str | None = ""  # Can be empty if file is sent
    message_type: str = "text"
    meta: str | None = None
    file_url: str | None = None
    file_type: str | None = None  # image, document
    file_name: str | None = None


class CounterOfferCreate(BaseModel):
    """Send a price counter-offer in a conversation."""
    product_id: int
    quantity: int  # e.g. 15 kg
    price_per_unit: float  # counter price per unit


class CounterOfferRead(BaseModel):
    id: int
    message_id: int
    conversation_id: int
    product_id: int
    buyer_id: int
    farmer_id: int
    quantity: int
    price_per_unit: float
    original_price_per_unit: float
    status: str  # pending, accepted, rejected
    responded_at: datetime | None = None
    product_name: str | None = None  # optional for display

    class Config:
        from_attributes = True


class MessageRead(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    message_text: str | None = ""
    message_type: str = "text"
    meta: str | None = None
    file_url: str | None = None
    file_type: str | None = None
    file_name: str | None = None
    is_read: bool
    created_at: datetime
    counter_offer: CounterOfferRead | None = None

    class Config:
        from_attributes = True


class GroupChatRead(BaseModel):
    id: int
    name: str
    is_default_for_farmers: bool
    created_at: datetime

    class Config:
        from_attributes = True


class GroupChatMemberRead(BaseModel):
    id: int
    group_id: int
    user_id: int
    role: str
    joined_at: datetime
    user: UserRead | None = None

    class Config:
        from_attributes = True
class GroupChatMessageRead(BaseModel):
    id: int
    group_id: int
    sender_id: int
    message_text: str | None = ""
    file_url: str | None = None
    file_type: str | None = None
    file_name: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class GroupChatMessageCreate(BaseModel):
    message_text: str | None = ""
    file_url: str | None = None
    file_type: str | None = None
    file_name: str | None = None