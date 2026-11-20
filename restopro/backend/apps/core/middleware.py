from apps.core import context


class TenantMiddleware:
    """Har bir so'rov boshida va oxirida tenant kontekstini tozalaydi.

    Kontekstning o'zi autentifikatsiya paytida o'rnatiladi
    (TenantJWTAuthentication / DeviceTokenAuthentication), chunki DRF
    foydalanuvchini view ichida aniqlaydi. Django admin (sessiya) uchun
    shu yerda o'rnatiladi.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        context.clear_tenant()
        user = getattr(request, "user", None)
        if user is not None and user.is_authenticated and getattr(user, "company_id", None):
            if not user.is_superuser:
                context.set_tenant(user.company_id, None, user.id, None)
        try:
            return self.get_response(request)
        finally:
            context.clear_tenant()
