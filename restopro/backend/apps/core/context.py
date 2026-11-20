"""Joriy so'rovning tenant (kompaniya) va filial konteksti.

contextvars ishlatiladi — thread va async (Channels) uchun xavfsiz.
"""
from contextlib import contextmanager
from contextvars import ContextVar

_company_id: ContextVar = ContextVar("company_id", default=None)
_branch_id: ContextVar = ContextVar("branch_id", default=None)
_user_id: ContextVar = ContextVar("user_id", default=None)
_device_id: ContextVar = ContextVar("device_id", default=None)


def set_tenant(company_id=None, branch_id=None, user_id=None, device_id=None):
    _company_id.set(company_id)
    _branch_id.set(branch_id)
    _user_id.set(user_id)
    _device_id.set(device_id)


def clear_tenant():
    set_tenant(None, None, None, None)


def get_company_id():
    return _company_id.get()


def get_branch_id():
    return _branch_id.get()


def get_user_id():
    return _user_id.get()


def get_device_id():
    return _device_id.get()


@contextmanager
def tenant_context(company_id, branch_id=None, user_id=None, device_id=None):
    """Celery vazifalari, management buyruqlari va testlar uchun."""
    tokens = (
        _company_id.set(company_id),
        _branch_id.set(branch_id),
        _user_id.set(user_id),
        _device_id.set(device_id),
    )
    try:
        yield
    finally:
        _company_id.reset(tokens[0])
        _branch_id.reset(tokens[1])
        _user_id.reset(tokens[2])
        _device_id.reset(tokens[3])
