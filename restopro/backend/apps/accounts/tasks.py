from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from apps.accounts.models import SmsCode


@shared_task
def cleanup_sms_codes():
    return SmsCode.objects.filter(created_at__lt=timezone.now() - timedelta(days=1)).delete()[0]
