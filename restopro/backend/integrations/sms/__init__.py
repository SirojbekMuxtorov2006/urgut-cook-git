from django.conf import settings

from .base import SmsError, SmsProvider


def get_sms_provider() -> SmsProvider:
    if settings.SMS_PROVIDER == "eskiz":
        from .eskiz import EskizSmsProvider

        return EskizSmsProvider(settings.ESKIZ_EMAIL, settings.ESKIZ_PASSWORD, settings.ESKIZ_FROM)
    from .console import ConsoleSmsProvider

    return ConsoleSmsProvider()


__all__ = ["get_sms_provider", "SmsProvider", "SmsError"]
