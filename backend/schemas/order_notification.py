from datetime import datetime

from pydantic import BaseModel


class OrderNotificationRead(BaseModel):
    id: int
    user_id: int
    order_id: int
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
