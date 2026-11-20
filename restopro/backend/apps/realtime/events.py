"""Realtime hodisalar. Guruh: c_{company}_b_{branch}. Lokal hub ham shu nomlardan foydalanadi."""
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

ORDER_UPDATED = "order.updated"
TABLE_STATUS = "table.status"
KITCHEN_TICKET_NEW = "kitchen.ticket.new"
KITCHEN_TICKET_READY = "kitchen.ticket.ready"
STOPLIST_CHANGED = "stoplist.changed"
WAITER_CALL = "waiter.call"
QR_ORDER_NEW = "qr_order.new"
DELIVERY_NEW = "delivery.new"
RESERVATION_NEW = "reservation.new"
SYNC_STATUS = "sync.status"


def group_name(company_id, branch_id=None) -> str:
    return f"c_{company_id}_b_{branch_id}" if branch_id else f"c_{company_id}"


def broadcast(company_id, event: str, payload: dict, branch_id=None):
    layer = get_channel_layer()
    if layer is None:
        return
    message = {"type": "rp.event", "event": event, "payload": payload}
    async_to_sync(layer.group_send)(group_name(company_id, branch_id), message)
    if branch_id:  # kompaniya darajasidagi tinglovchilar (ega mobil ilovasi)
        async_to_sync(layer.group_send)(group_name(company_id), message)
