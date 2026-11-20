from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.views import exception_handler


class BusinessError(APIException):
    """Biznes qoidasi buzilganda (masalan, tarif limiti, smena yopiq)."""

    status_code = status.HTTP_400_BAD_REQUEST
    default_code = "business_error"
    default_detail = "Amalni bajarib bo'lmaydi"

    def __init__(self, detail=None, code=None):
        super().__init__(detail=detail, code=code)


class PlanLimitExceeded(BusinessError):
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_code = "plan_limit"


def api_exception_handler(exc, ctx):
    if isinstance(exc, DjangoValidationError):
        exc = ValidationError(exc.message_dict if hasattr(exc, "message_dict") else exc.messages)
    response = exception_handler(exc, ctx)
    if response is not None and isinstance(exc, APIException):
        codes = exc.get_codes()
        response.data = {
            "error": codes if isinstance(codes, str) else "invalid",
            "detail": response.data.get("detail", response.data) if isinstance(response.data, dict) else response.data,
        }
    return response
