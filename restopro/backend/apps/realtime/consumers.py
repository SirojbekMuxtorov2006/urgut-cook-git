from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from apps.realtime.events import group_name


class EventsConsumer(AsyncJsonWebsocketConsumer):
    """ws/v1/events/?branch=<uuid>&token=<jwt> — filial hodisalari oqimi."""

    async def connect(self):
        rp = self.scope.get("rp")
        if not rp:
            await self.close(code=4401)
            return
        branch = self._branch_param() or rp.get("branch_id")
        if branch and rp.get("user") is not None:
            if not await database_sync_to_async(rp["user"].can_access_branch)(branch):
                await self.close(code=4403)
                return
        if rp.get("device") is not None and branch and str(branch) != str(rp["device"].branch_id):
            await self.close(code=4403)
            return
        self.groups_joined = [group_name(rp["company_id"], branch)] if branch else [group_name(rp["company_id"])]
        for g in self.groups_joined:
            await self.channel_layer.group_add(g, self.channel_name)
        await self.accept()
        await self.send_json({"event": "hello", "payload": {"groups": self.groups_joined}})

    def _branch_param(self):
        from urllib.parse import parse_qs

        qs = parse_qs(self.scope.get("query_string", b"").decode())
        return (qs.get("branch") or [None])[0]

    async def disconnect(self, code):
        for g in getattr(self, "groups_joined", []):
            await self.channel_layer.group_discard(g, self.channel_name)

    async def receive_json(self, content, **kwargs):
        if content.get("type") == "ping":
            await self.send_json({"event": "pong"})

    async def rp_event(self, message):
        await self.send_json({"event": message["event"], "payload": message["payload"]})
