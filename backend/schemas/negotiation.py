from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NegotiationMessageRead(BaseModel):
    id: int
    sender_type: str  # buyer, system
    message_text: str
    offer_amount: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NegotiationRead(BaseModel):
    id: int
    buyer_id: int
    product_id: int
    farmer_id: int
    status: str  # ongoing, accepted, confirmed
    created_at: datetime
    updated_at: datetime
    messages: list[NegotiationMessageRead] = []

    class Config:
        from_attributes = True


class NegotiationOfferIn(BaseModel):
    price_per_unit: float  # Customer's offer (₹/kg)


class NegotiationOfferResponse(BaseModel):
    accepted: bool  # True if offer >= min_negotiable_price
    message: str  # System auto-reply text
    negotiation: NegotiationRead
