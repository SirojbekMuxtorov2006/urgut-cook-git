from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.accounts import views

router = DefaultRouter()
router.register("permissions", views.PermissionViewSet, basename="permission")
router.register("roles", views.RoleViewSet, basename="role")
router.register("employees", views.EmployeeViewSet, basename="employee")
router.register("audit-logs", views.AuditLogViewSet, basename="audit-log")

urlpatterns = [
    path("register/send-code/", views.SendRegisterCodeView.as_view(), name="register-send-code"),
    path("register/", views.RegisterView.as_view(), name="register"),
    path("verify-sms/", views.RegisterView.as_view(), name="verify-sms"),
    path("password/send-code/", views.SendResetCodeView.as_view(), name="password-send-code"),
    path("password/reset/", views.ResetPasswordView.as_view(), name="password-reset"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("pin-login/", views.PinLoginView.as_view(), name="pin-login"),
    path("pin-users/", views.PinUsersView.as_view(), name="pin-users"),
    path("manager-pin/", views.VerifyManagerPinView.as_view(), name="manager-pin"),
    path("refresh/", views.RefreshView.as_view(), name="token-refresh"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("me/", views.MeView.as_view(), name="me"),
    path("devices/register/", views.DeviceRegisterView.as_view(), name="device-register"),
] + router.urls
