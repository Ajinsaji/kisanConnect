from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class ProductBase(BaseModel):
    name: str
    category: str | None = None
    description: str | None = None
    price: float
    quantity: int
    image_url: str | None = None
    min_negotiable_price: Optional[float] = None  # Minimum price farmer can offer (e.g. 15 when listed 20)


class ProductCreate(ProductBase):
    """Farmer-specific fields like farmer_id come from auth."""

    pass


class ProductUpdate(BaseModel):
    name: str | None = None
    category: str | None = None
    description: str | None = None
    price: float | None = None
    quantity: int | None = None
    image_url: str | None = None
    min_negotiable_price: Optional[float] = None


class ProductRead(ProductBase):
    id: int
    farmer_id: int
    created_at: datetime
    farmer: Optional["UserRead"] = None
    effective_price: Optional[float] = None  # Negotiated/special price for this buyer when set
    min_negotiable_price: Optional[float] = None

    class Config:
        from_attributes = True


# Import UserRead at runtime to resolve forward reference
# This is safe because user.py doesn't import from product.py
from schemas.user import UserRead  # noqa: E402

# Rebuild the model to resolve the forward reference
ProductRead.model_rebuild()







