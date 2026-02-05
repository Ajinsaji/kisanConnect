from datetime import datetime
from pydantic import BaseModel


class NewsRead(BaseModel):
    id: int
    title: str
    description: str | None = None
    content: str | None = None
    source: str
    source_url: str | None = None
    category: str | None = None
    published_at: datetime | None = None
    fetched_at: datetime
    is_important: bool = False
    image_url: str | None = None

    class Config:
        from_attributes = True


class NewsListResponse(BaseModel):
    news: list[NewsRead]
    total: int
    unread_count: int
