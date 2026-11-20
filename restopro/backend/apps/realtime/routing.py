from django.urls import path

from apps.realtime.consumers import EventsConsumer

websocket_urlpatterns = [path("ws/v1/events/", EventsConsumer.as_asgi())]
