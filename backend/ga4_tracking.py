"""
Google Analytics 4 - Server-side Measurement Protocol
Sends events from the backend for reliable tracking (orders, payments, etc.)
"""
import os
import httpx
import logging
import uuid

logger = logging.getLogger(__name__)

GA4_MEASUREMENT_ID = os.environ.get("GA4_MEASUREMENT_ID")
GA4_API_SECRET = os.environ.get("GA4_API_SECRET")
GA4_ENDPOINT = "https://www.google-analytics.com/mp/collect"


async def send_ga4_event(client_id: str, events: list):
    """Send events to GA4 via Measurement Protocol"""
    if not GA4_MEASUREMENT_ID or not GA4_API_SECRET:
        logger.warning("GA4 credentials not configured, skipping server-side tracking")
        return

    url = f"{GA4_ENDPOINT}?measurement_id={GA4_MEASUREMENT_ID}&api_secret={GA4_API_SECRET}"

    payload = {
        "client_id": client_id,
        "events": events
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=5.0)
            if response.status_code == 204:
                logger.info(f"GA4 event sent successfully: {[e['name'] for e in events]}")
            else:
                logger.warning(f"GA4 event failed: {response.status_code}")
    except Exception as e:
        logger.error(f"GA4 tracking error: {e}")


async def track_purchase(order: dict):
    """Track a purchase event server-side"""
    client_id = order.get("user_id") or str(uuid.uuid4())

    items_list = []
    for item in order.get("items", []):
        items_list.append({
            "item_id": item.get("product_id", ""),
            "item_name": item.get("name", ""),
            "price": item.get("price", 0),
            "quantity": item.get("quantity", 1)
        })

    events = [{
        "name": "purchase",
        "params": {
            "transaction_id": order.get("order_id", ""),
            "currency": "XOF",
            "value": order.get("total", 0),
            "shipping": order.get("shipping_cost", 0),
            "items": items_list
        }
    }]

    await send_ga4_event(client_id, events)


async def track_order_status(order_id: str, status: str, user_id: str = None):
    """Track order status changes"""
    client_id = user_id or str(uuid.uuid4())

    events = [{
        "name": "order_status_update",
        "params": {
            "order_id": order_id,
            "status": status
        }
    }]

    await send_ga4_event(client_id, events)
