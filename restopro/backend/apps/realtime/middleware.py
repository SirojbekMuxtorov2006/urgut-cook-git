from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware


@database_sync_to_async
def _resolve(token: str | None, device_token: str | None):
    from apps.tenancy.models import Device

    if device_token:
        device = Device.all_objects.filter(token_hash=Device.hash_token(device_token), is_active=True,
                                           deleted_at__isnull=True).first()
        if device:
            return {"company_id": device.company_id, "branch_id": device.branch_id, "user": None, "device": device}
    if token:
        from rest_framework_simplejwt.tokens import AccessToken

        from apps.accounts.models import User

        try:
            at = AccessToken(token)
        except Exception:  # noqa: BLE001
            return None
        user = User.objects.filter(pk=at["user_id"], is_active=True).first()
        if user and user.company_id:
            return {"company_id": user.company_id, "branch_id": at.get("branch_id"), "user": user, "device": None}
    return None


class JWTAuthMiddleware(BaseMiddleware):
    """WebSocket: ?token=<JWT> yoki ?device_token=<token>."""

    async def __call__(self, scope, receive, send):
        qs = parse_qs(scope.get("query_string", b"").decode())
        scope["rp"] = await _resolve((qs.get("token") or [None])[0], (qs.get("device_token") or [None])[0])
        return await super().__call__(scope, receive, send)
