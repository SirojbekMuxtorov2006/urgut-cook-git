from celery import shared_task
from django.utils import timezone

from apps.tenancy.models import Subscription
from apps.tenancy.services import invalidate_access_cache


@shared_task
def check_subscriptions():
    """Obuna holatlarini yangilaydi: ACTIVE/TRIAL -> GRACE -> EXPIRED (faqat ko'rish)."""
    now = timezone.now()
    changed = 0
    for sub in Subscription.objects.exclude(status=Subscription.Status.EXPIRED).filter(ends_at__lt=now):
        new_status = sub.compute_status(now)
        if new_status != sub.status:
            sub.status = new_status
            sub.save(update_fields=["status"])
            invalidate_access_cache(sub.company_id)
            changed += 1
    return changed
