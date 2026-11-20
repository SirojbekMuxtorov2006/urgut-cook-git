import requests
from django.core.cache import cache

from .base import SmsError, SmsProvider

BASE_URL = "https://notify.eskiz.uz/api"
TOKEN_KEY = "eskiz:token"


class EskizSmsProvider(SmsProvider):
    """Eskiz.uz adapteri. Token 29 kun keshlanadi, 401 bo'lsa yangilanadi."""

    def __init__(self, email: str, password: str, sender: str = "4546", timeout: int = 10):
        self.email = email
        self.password = password
        self.sender = sender
        self.timeout = timeout

    def _login(self) -> str:
        r = requests.post(f"{BASE_URL}/auth/login", data={"email": self.email, "password": self.password},
                          timeout=self.timeout)
        if r.status_code != 200:
            raise SmsError(f"Eskiz login xatosi: {r.status_code}")
        token = r.json()["data"]["token"]
        cache.set(TOKEN_KEY, token, 60 * 60 * 24 * 29)
        return token

    def _token(self, refresh=False) -> str:
        token = None if refresh else cache.get(TOKEN_KEY)
        return token or self._login()

    def send(self, phone: str, text: str) -> None:
        payload = {"mobile_phone": phone.lstrip("+"), "message": text, "from": self.sender}
        for attempt in range(2):
            headers = {"Authorization": f"Bearer {self._token(refresh=attempt > 0)}"}
            r = requests.post(f"{BASE_URL}/message/sms/send", data=payload, headers=headers, timeout=self.timeout)
            if r.status_code == 401:
                continue
            if r.status_code >= 400:
                raise SmsError(f"Eskiz xatosi: {r.status_code} {r.text[:200]}")
            return
        raise SmsError("Eskiz avtorizatsiya xatosi")
