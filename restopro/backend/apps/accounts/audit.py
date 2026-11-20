"""Audit jurnali: append-only. Har bir muhim amal shu orqali yoziladi."""
import json

from django.core.serializers.json import DjangoJSONEncoder
from django.forms.models import model_to_dict

from apps.core import context

SENSITIVE = {"password", "pin_hash", "pin_lookup", "token_hash"}


def snapshot(instance, fields=None) -> dict:
    data = model_to_dict(instance, fields=fields)
    data = {k: v for k, v in data.items() if k not in SENSITIVE}
    return json.loads(json.dumps(data, cls=DjangoJSONEncoder, default=str))


def log(action, *, entity=None, entity_id=None, old=None, new=None, reason="", severity="INFO",
        request=None, company_id=None, branch_id=None, user=None):
    from apps.accounts.models import AuditLog

    company_id = company_id or context.get_company_id()
    if company_id is None:
        return None
    ip = None
    impersonated_by = None
    if request is not None:
        ip = (request.META.get("HTTP_X_FORWARDED_FOR") or request.META.get("REMOTE_ADDR") or "").split(",")[0] or None
        impersonated_by = getattr(request, "impersonated_by", None)
        if user is None and getattr(request.user, "pk", None):
            user = request.user
    return AuditLog.all_objects.create(
        company_id=company_id,
        branch_id=branch_id or context.get_branch_id(),
        user=user if getattr(user, "pk", None) else None,
        device_id=context.get_device_id(),
        action=action,
        entity=entity or "",
        entity_id=str(entity_id or ""),
        old_value=old,
        new_value=new,
        reason=reason or "",
        severity=severity,
        ip=ip,
        impersonated_by=impersonated_by if impersonated_by and impersonated_by != user else None,
    )
