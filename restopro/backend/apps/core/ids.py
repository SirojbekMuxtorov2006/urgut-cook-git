"""UUID v7 — vaqt bo'yicha tartiblangan ID (RFC 9562). Offline qurilmalar ham shu formatda ID yaratadi."""
import uuid

from uuid6 import uuid7 as _uuid7


def uuid7() -> uuid.UUID:
    return uuid.UUID(str(_uuid7()))
