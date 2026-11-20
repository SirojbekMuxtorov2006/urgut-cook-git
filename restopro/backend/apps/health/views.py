from django.core.cache import cache
from django.db import connection
from drf_spectacular.utils import extend_schema
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.authentication import PublicAuthentication


class HealthView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = [PublicAuthentication]

    @extend_schema(responses={200: dict})
    def get(self, request):
        result = {"status": "ok", "db": "ok", "cache": "ok"}
        try:
            with connection.cursor() as c:
                c.execute("SELECT 1")
        except Exception as e:  # noqa: BLE001
            result.update(status="degraded", db=str(e)[:100])
        try:
            cache.set("health", 1, 5)
        except Exception as e:  # noqa: BLE001
            result.update(status="degraded", cache=str(e)[:100])
        return Response(result, status=200 if result["status"] == "ok" else 503)
