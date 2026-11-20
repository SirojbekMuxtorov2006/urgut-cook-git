import logging

from .base import SmsProvider

logger = logging.getLogger("restopro.sms")
OUTBOX: list[tuple[str, str]] = []  # testlar uchun


class ConsoleSmsProvider(SmsProvider):
    """Ishlab chiqish rejimi: SMS konsolga chiqariladi."""

    def send(self, phone: str, text: str) -> None:
        OUTBOX.append((phone, text))
        logger.warning("SMS -> %s: %s", phone, text)
