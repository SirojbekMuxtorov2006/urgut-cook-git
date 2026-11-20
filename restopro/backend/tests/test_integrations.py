from datetime import timedelta

import pytest
from django.utils import timezone

from apps.tenancy.models import Subscription
from apps.tenancy.tasks import check_subscriptions
from integrations.sms.base import SmsError
from integrations.sms.eskiz import EskizSmsProvider


class _Resp:
    def __init__(self, status, data=None):
        self.status_code = status
        self._data = data or {}
        self.text = str(data)

    def json(self):
        return self._data


def test_eskiz_send_with_token_refresh(monkeypatch, settings):
    settings.CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
    calls = []

    def fake_post(url, data=None, headers=None, timeout=None):
        calls.append(url)
        if url.endswith("/auth/login"):
            return _Resp(200, {"data": {"token": f"tok{len(calls)}"}})
        if len([c for c in calls if c.endswith("/send")]) == 1:
            return _Resp(401)
        return _Resp(200, {"status": "waiting"})

    monkeypatch.setattr("integrations.sms.eskiz.requests.post", fake_post)
    EskizSmsProvider("a@b.uz", "x").send("+998901234567", "kod")
    assert sum(c.endswith("/auth/login") for c in calls) == 2


def test_eskiz_error(monkeypatch):
    monkeypatch.setattr("integrations.sms.eskiz.requests.post",
                        lambda url, **kw: _Resp(200, {"data": {"token": "t"}}) if url.endswith("login") else _Resp(500))
    with pytest.raises(SmsError):
        EskizSmsProvider("a@b.uz", "x").send("+998901234567", "kod")


def test_check_subscriptions_task(company_a):
    sub = company_a.company.subscription
    sub.ends_at = timezone.now() - timedelta(days=10)
    sub.save()
    assert check_subscriptions() == 1
    sub.refresh_from_db()
    assert sub.status == Subscription.Status.EXPIRED
