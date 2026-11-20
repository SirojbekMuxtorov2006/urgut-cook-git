from rest_framework.permissions import SAFE_METHODS, BasePermission


class HasPerm(BasePermission):
    """View'da `required_perms = {"list": "staff.view", "create": "staff.manage", "*": "..."}`.

    Kalit — action nomi (ViewSet) yoki HTTP metod (APIView). "*" — standart.
    """

    message = "Bu amal uchun huquq yetarli emas"

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated or getattr(user, "is_device", False):
            return False
        required = getattr(view, "required_perms", None)
        if not required:
            return True
        key = getattr(view, "action", None) or request.method.lower()
        code = required.get(key) or required.get(request.method.lower()) or required.get("*")
        if code is None:
            return True
        codes = code if isinstance(code, (list, tuple)) else [code]
        return any(user.has_perm_code(c) for c in codes)


class IsUser(BasePermission):
    """Faqat odam foydalanuvchi (qurilma tokeni yetmaydi)."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and not getattr(request.user, "is_device", False))


class IsDevice(BasePermission):
    def has_permission(self, request, view):
        return getattr(request, "device", None) is not None


class SubscriptionActive(BasePermission):
    """Obuna muddati (+grace) tugagan bo'lsa — faqat ko'rish rejimi. Ma'lumot o'chmaydi."""

    message = "Obuna muddati tugagan. Faqat ko'rish rejimi. To'lovni amalga oshiring."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS or getattr(request.user, "is_superuser", False):
            return True
        company_id = getattr(request, "company_id", None)
        if not company_id:
            return True
        from apps.tenancy.services import get_access_level

        return get_access_level(company_id) == "full"


DEFAULT_PERMS = [IsUser, HasPerm, SubscriptionActive]
