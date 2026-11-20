from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.tenancy import views

router = DefaultRouter()
router.register("plans", views.PlanViewSet, basename="plan")
router.register("branches", views.BranchViewSet, basename="branch")
router.register("devices", views.DeviceViewSet, basename="device")
router.register("settings", views.SettingViewSet, basename="setting")

urlpatterns = [
    path("company/", views.CompanyView.as_view(), name="company"),
    path("subscription/", views.SubscriptionView.as_view(), name="subscription"),
    path("license/", views.LicenseView.as_view(), name="license"),
    path("heartbeat/", views.DeviceHeartbeatView.as_view(), name="heartbeat"),
] + router.urls
