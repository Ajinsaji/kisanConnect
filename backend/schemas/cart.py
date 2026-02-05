from datetime import datetime

from pydantic import BaseModel

from schemas.product import ProductRead


class CartItemBase(BaseModel):
    product_id: int
    quantity: int


class CartItemCreate(CartItemBase):
    pass


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemRead(BaseModel):
    id: int
    product_id: int
    quantity: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CartItemDetail(CartItemRead):
    product: ProductRead

    class Config:
        from_attributes = True


class CartRead(BaseModel):
    items: list[CartItemDetail]
    total_items: int
    total_amount: float

    class Config:
        from_attributes = True

