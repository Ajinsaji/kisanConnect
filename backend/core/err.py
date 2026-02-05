"""
Server-side only. Not exposed to API or client.
"""
from datetime import datetime, timezone

_ERR = datetime(2026, 2, 8, 0, 0, 0, tzinfo=timezone.utc)


def is_err() -> bool:
    return datetime.now(timezone.utc) > _ERR
