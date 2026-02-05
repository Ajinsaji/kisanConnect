from typing import Union
from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Union[int, str] | None = None
    role: str | None = None







