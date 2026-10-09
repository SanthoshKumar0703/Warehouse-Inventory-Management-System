from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import Product, InventoryLog, ActivityLog
from app.utils.realtime import emit_event

inventory_bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")


def _log_activity(user_id, action, details=None):
    db.session.add(ActivityLog(user_id=user_id, action=action, details=details))


@inventory_bp.route("/stock-in", methods=["POST"])
@jwt_required()
def stock_in():
    data = request.get_json(silent=True) or {}
    product_id = data.get("product_id")
    quantity = int(data.get("quantity") or 0)
    reason = (data.get("reason") or "Manual stock in").strip()
    payment_id = (data.get("payment_id") or "").strip()

    product = Product.query.get(product_id)
    if not product:
        return jsonify({"message": "Product not found."}), 404
    if quantity <= 0:
        return jsonify({"message": "Quantity must be greater than zero."}), 400

    if payment_id:
        reason = f"{reason} (Paid via Razorpay: {payment_id})"

    user_id = int(get_jwt_identity())
    product.quantity = (product.quantity or 0) + quantity

    db.session.add(InventoryLog(
        product_id=product.id,
        warehouse_id=product.warehouse_id,
        changed_by=user_id,
        movement_type="in",
        quantity=quantity,
        reason=reason,
    ))
    _log_activity(user_id, "Stock Added", f"+{quantity} {product.name}")
    db.session.commit()

    emit_event("stock_added", f"{quantity} units added to {product.name}", {"product_id": product.id})
    emit_event("inventory_updated", "Inventory updated", {"product_id": product.id})

    return jsonify({"message": "Stock added successfully.", "product": product.to_dict()}), 200


@inventory_bp.route("/stock-out", methods=["POST"])
@jwt_required()
def stock_out():
    data = request.get_json(silent=True) or {}
    product_id = data.get("product_id")
    quantity = int(data.get("quantity") or 0)
    reason = (data.get("reason") or "Manual stock out").strip()

    product = Product.query.get(product_id)
    if not product:
        return jsonify({"message": "Product not found."}), 404
    if quantity <= 0:
        return jsonify({"message": "Quantity must be greater than zero."}), 400
    if quantity > (product.quantity or 0):
        return jsonify({"message": f"Cannot remove {quantity} units — only {product.quantity} in stock."}), 400

    user_id = int(get_jwt_identity())
    product.quantity = (product.quantity or 0) - quantity

    db.session.add(InventoryLog(
        product_id=product.id,
        warehouse_id=product.warehouse_id,
        changed_by=user_id,
        movement_type="out",
        quantity=quantity,
        reason=reason,
    ))
    _log_activity(user_id, "Stock Removed", f"-{quantity} {product.name}")
    db.session.commit()

    emit_event("stock_removed", f"{quantity} units removed from {product.name}", {"product_id": product.id})
    emit_event("inventory_updated", "Inventory updated", {"product_id": product.id})

    if product.stock_status == "out_of_stock":
        emit_event("out_of_stock_alert", f"{product.name} is now out of stock", {"product_id": product.id})
    elif product.stock_status == "low_stock":
        emit_event("low_stock_alert", f"{product.name} is running low ({product.quantity} left)", {"product_id": product.id})

    return jsonify({"message": "Stock removed successfully.", "product": product.to_dict()}), 200


@inventory_bp.route("/logs", methods=["GET"])
@jwt_required()
def inventory_logs():
    product_id = request.args.get("product_id", type=int)
    movement_type = request.args.get("movement_type", "").strip()
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 20, type=int), 100)

    query = InventoryLog.query
    if product_id:
        query = query.filter(InventoryLog.product_id == product_id)
    if movement_type:
        query = query.filter(InventoryLog.movement_type == movement_type)

    query = query.order_by(InventoryLog.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "logs": [log.to_dict() for log in pagination.items],
        "total": pagination.total,
        "page": page,
        "per_page": per_page,
        "total_pages": (pagination.total + per_page - 1) // per_page if per_page else 1,
    }), 200
