from datetime import datetime
from pydantic import BaseModel


class ComplaintCreate(BaseModel):
    order_id: int
    complaint_type: str  # "product_damage", "farmer_issue", "other"
    description: str


class ComplaintRead(BaseModel):
    id: int
    order_id: int
    user_id: int
    farmer_id: int
    complaint_type: str
    description: str
    status: str
    created_at: datetime
    resolved_at: datetime | None = None
    resolution_comment: str | None = None

    class Config:
        from_attributes = True


class ComplaintResolveRequest(BaseModel):
    resolution_comment: str  # Required comment explaining how the issue was resolved
