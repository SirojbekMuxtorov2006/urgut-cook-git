from rest_framework.throttling import SimpleRateThrottle


class SmsThrottle(SimpleRateThrottle):
    scope = "sms"

    def get_cache_key(self, request, view):
        phone = "".join(ch for ch in str(request.data.get("phone", "")) if ch.isdigit())[-9:]
        return self.cache_format % {"scope": self.scope, "ident": phone or self.get_ident(request)}


class PinThrottle(SimpleRateThrottle):
    scope = "pin"

    def get_cache_key(self, request, view):
        device = getattr(request, "device", None)
        return self.cache_format % {"scope": self.scope, "ident": device.id if device else self.get_ident(request)}


class LoginThrottle(SimpleRateThrottle):
    scope = "login"

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}
