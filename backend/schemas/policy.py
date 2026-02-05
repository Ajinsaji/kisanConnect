from datetime import datetime

from pydantic import BaseModel


class PolicyBase(BaseModel):
    title: str
    description: str
    category: str | None = None
    document_url: str | None = None


class PolicyCreate(PolicyBase):
    pass


class PolicyRead(PolicyBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationRead(BaseModel):
    id: int
    user_id: int
    policy_id: int
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True







