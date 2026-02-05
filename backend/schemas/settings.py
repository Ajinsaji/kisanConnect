from datetime import datetime
from pydantic import BaseModel


class AppSettingRead(BaseModel):
    id: int
    setting_key: str
    setting_value: str
    description: str | None = None
    updated_at: datetime
    updated_by: int | None = None

    class Config:
        from_attributes = True


class AppSettingUpdate(BaseModel):
    setting_value: str


class NewsSettingsResponse(BaseModel):
    news_enabled: bool
    message: str
