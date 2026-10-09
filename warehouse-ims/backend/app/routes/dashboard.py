from datetime import datetime, timedelta
from collections import defaultdict

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models import Product, Category, Warehouse, Supplier, PurchaseOrder, ActivityLog, InventoryLog

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.route("/summary", methods=["GET"])
@jwt_required()
def summary():
    products = Product.query.all()
    low_stock = sum(1 for p in products if p.stock_status == "low_stock")
    out_of_stock = sum(1 for p in products if p.stock_status == "out_of_stock")
    available_stock = sum(p.quantity for p in products)

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_in = (
        db.session.query(db.func.coalesce(db.func.sum(InventoryLog.quantity), 0))
        .filter(InventoryLog.movement_type == "in", InventoryLog.created_at >= today_start)
        .scalar()
    )
    today_out = (
        db.session.query(db.func.coalesce(db.func.sum(InventoryLog.quantity), 0))
        .filter(InventoryLog.movement_type == "out", InventoryLog.created_at >= today_start)
        .scalar()
    )

    return jsonify({
        "total_products": len(products),
        "total_categories": Category.query.count(),
        "total_warehouses": Warehouse.query.count(),
        "total_suppliers": Supplier.query.count(),
        "purchase_orders": PurchaseOrder.query.count(),
        "available_stock": available_stock,
        "low_stock": low_stock,
        "out_of_stock": out_of_stock,
        "today_stock_in": int(today_in or 0),
        "today_stock_out": int(today_out or 0),
    }), 200


@dashboard_bp.route("/recent-activity", methods=["GET"])
@jwt_required()
def recent_activity():
    logs = ActivityLog.query.order_by(ActivityLog.created_at.desc()).limit(10).all()
    return jsonify({"activities": [log.to_dict() for log in logs]}), 200


@dashboard_bp.route("/analytics", methods=["GET"])
@jwt_required()
def analytics():
    # --- Monthly inventory / Stock In vs Stock Out (last 6 months) ---
    now = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    def add_months(base, delta):
        month = base.month - 1 + delta
        year = base.year + month // 12
        month = month % 12 + 1
        return base.replace(year=year, month=month)

    month_keys = [add_months(now, -i) for i in range(5, -1, -1)]
    stock_in_map = defaultdict(int)
    stock_out_map = defaultdict(int)

    earliest = month_keys[0]
    logs = InventoryLog.query.filter(InventoryLog.created_at >= earliest).all()
    for log in logs:
        key = log.created_at.strftime("%Y-%m")
        if log.movement_type == "in":
            stock_in_map[key] += log.quantity
        else:
            stock_out_map[key] += log.quantity

    labels = [m.strftime("%b %Y") for m in month_keys]
    keys = [m.strftime("%Y-%m") for m in month_keys]
    stock_in_series = [stock_in_map.get(k, 0) for k in keys]
    stock_out_series = [stock_out_map.get(k, 0) for k in keys]

    # --- Category distribution ---
    categories = Category.query.all()
    category_distribution = [
        {"label": c.name, "value": len(c.products)} for c in categories
    ]

    # --- Warehouse analytics (total quantity per warehouse) ---
    warehouses = Warehouse.query.all()
    warehouse_analytics = [
        {"label": w.name, "value": sum(p.quantity for p in Product.query.filter_by(warehouse_id=w.id).all())}
        for w in warehouses
    ]

    # --- Top moving products (by total inventory log quantity, last 6 months) ---
    product_movement = defaultdict(int)
    for log in logs:
        product_movement[log.product_id] += log.quantity
    top_product_ids = sorted(product_movement, key=product_movement.get, reverse=True)[:5]
    top_moving_products = []
    for pid in top_product_ids:
        product = Product.query.get(pid)
        if product:
            top_moving_products.append({"label": product.name, "value": product_movement[pid]})

    return jsonify({
        "monthly_labels": labels,
        "stock_in_series": stock_in_series,
        "stock_out_series": stock_out_series,
        "category_distribution": category_distribution,
        "warehouse_analytics": warehouse_analytics,
        "top_moving_products": top_moving_products,
    }), 200


@dashboard_bp.route("/predictions", methods=["GET"])
@jwt_required()
def predictions():
    """Smart Inventory Prediction: analyzes each product's stock-out history
    over the last 30 days to estimate daily usage, days of stock remaining,
    and a recommended reorder quantity (covers a 14-day lead time).
    """
    LOOKBACK_DAYS = 30
    LEAD_TIME_DAYS = 14
    since = datetime.utcnow() - timedelta(days=LOOKBACK_DAYS)

    usage_by_product = defaultdict(int)
    logs = InventoryLog.query.filter(
        InventoryLog.movement_type == "out", InventoryLog.created_at >= since
    ).all()
    for log in logs:
        usage_by_product[log.product_id] += log.quantity

    results = []
    for product_id, total_used in usage_by_product.items():
        product = Product.query.get(product_id)
        if not product:
            continue
        avg_daily_usage = total_used / LOOKBACK_DAYS
        if avg_daily_usage <= 0:
            continue
        days_remaining = round((product.quantity or 0) / avg_daily_usage, 1)
        recommended_reorder = max(0, round(avg_daily_usage * LEAD_TIME_DAYS - (product.quantity or 0)))

        results.append({
            "product_id": product.id,
            "product_name": product.name,
            "current_quantity": product.quantity,
            "avg_daily_usage": round(avg_daily_usage, 2),
            "days_remaining": days_remaining,
            "recommended_reorder": recommended_reorder,
        })

    results.sort(key=lambda r: r["days_remaining"])
    return jsonify({"predictions": results[:10]}), 200


@dashboard_bp.route("/audit-logs", methods=["GET"])
@jwt_required()
def audit_logs():
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)

    query = ActivityLog.query.order_by(ActivityLog.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "logs": [log.to_dict() for log in pagination.items],
        "total": pagination.total,
        "page": page,
        "per_page": per_page,
        "total_pages": (pagination.total + per_page - 1) // per_page if per_page else 1,
    }), 200
