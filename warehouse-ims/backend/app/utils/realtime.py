from app.extensions import socketio

# Maps event "type" to the icon + tone the frontend toast should use.
EVENT_META = {
    "product_added": {"icon": "✅", "tone": "success"},
    "product_updated": {"icon": "✏", "tone": "info"},
    "product_deleted": {"icon": "🗑", "tone": "warning"},
    "supplier_added": {"icon": "🚚", "tone": "success"},
    "purchase_order_created": {"icon": "🚚", "tone": "info"},
    "purchase_order_approved": {"icon": "✔", "tone": "success"},
    "stock_added": {"icon": "📦", "tone": "success"},
    "stock_removed": {"icon": "📤", "tone": "info"},
    "low_stock_alert": {"icon": "⚠", "tone": "warning"},
    "out_of_stock_alert": {"icon": "⚠", "tone": "danger"},
    "user_registered": {"icon": "👤", "tone": "info"},
    "password_changed": {"icon": "🔐", "tone": "success"},
    "inventory_updated": {"icon": "📊", "tone": "info"},
    "profile_updated": {"icon": "👤", "tone": "info"},
}


def emit_event(event_type: str, message: str, payload: dict = None):
    """Broadcasts a real-time event to every connected client.
    Frontend listens on the 'inventory_event' channel and shows a toast +
    refreshes relevant live data (dashboard cards, charts, activity feed).
    """
    meta = EVENT_META.get(event_type, {"icon": "📢", "tone": "info"})
    socketio.emit("inventory_event", {
        "type": event_type,
        "message": message,
        "icon": meta["icon"],
        "tone": meta["tone"],
        "payload": payload or {},
    })
