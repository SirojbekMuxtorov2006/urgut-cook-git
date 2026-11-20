import pytest
from asgiref.sync import async_to_sync
from channels.testing import WebsocketCommunicator

from apps.accounts.services import issue_tokens
from apps.realtime.events import TABLE_STATUS, broadcast
from config.asgi import application


@pytest.mark.django_db(transaction=True)
def test_ws_receives_branch_event():
    from tests.factories import make_company

    c = make_company("WS", "+998907770001", template=False)
    token = issue_tokens(c.owner)["access"]

    async def scenario():
        comm = WebsocketCommunicator(application, f"/ws/v1/events/?token={token}&branch={c.branch.id}")
        connected, _ = await comm.connect()
        assert connected
        hello = await comm.receive_json_from()
        assert hello["event"] == "hello"
        from channels.db import database_sync_to_async

        await database_sync_to_async(broadcast)(c.id, TABLE_STATUS, {"table": "7", "status": "BUSY"}, c.branch.id)
        msg = await comm.receive_json_from(timeout=2)
        assert msg == {"event": TABLE_STATUS, "payload": {"table": "7", "status": "BUSY"}}
        await comm.disconnect()

    async_to_sync(scenario)()


@pytest.mark.django_db(transaction=True)
def test_ws_rejects_anonymous():
    async def scenario():
        comm = WebsocketCommunicator(application, "/ws/v1/events/")
        connected, code = await comm.connect()
        assert not connected or code == 4401

    async_to_sync(scenario)()
