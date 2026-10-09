import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import (
    PurchaseOrder,
    PurchaseOrderItem,
    Product,
    Supplier,
    Warehouse,
    InventoryLog,
    ActivityLog,
)
from app.utils.rbac import roles_required
from app.utils.realtime import emit_event

purchase_orders_bp = Blueprint("purchase_orders", __name__, url_prefix="/api/purchase-orders")


def _log(action, details=None):
    user_id = int(get_jwt_identity())
    db.session.add(ActivityLog(user_id=user_id, action=action, details=details))


@purchase_orders_bp.route("", methods=["GET"])
@jwt_required()
def list_purchase_orders():
    status = request.args.get("status", "").strip()
    query = PurchaseOrder.query
    if status:
        query = query.filter(PurchaseOrder.status == status)
    orders = query.order_by(PurchaseOrder.created_at.desc()).all()
    return jsonify({"purchase_orders": [o.to_dict() for o in orders]}), 200


@purchase_orders_bp.route("/<int:order_id>", methods=["GET"])
@jwt_required()
def get_purchase_order(order_id):
    order = PurchaseOrder.query.get(order_id)
    if not order:
        return jsonify({"message": "Purchase order not found."}), 404
    return jsonify({"purchase_order": order.to_dict()}), 200


@purchase_orders_bp.route("", methods=["POST"])
@roles_required("admin", "manager")
def create_purchase_order():
    data = request.get_json(silent=True) or {}
    supplier_id = data.get("supplier_id")
    warehouse_id = data.get("warehouse_id")
    items = data.get("items") or []

    if not supplier_id or not Supplier.query.get(supplier_id):
        return jsonify({"message": "A valid supplier is required."}), 400
    if not warehouse_id or not Warehouse.query.get(warehouse_id):
        return jsonify({"message": "A valid warehouse is required."}), 400
    if not items:
        return jsonify({"message": "At least one line item is required."}), 400

    order_number = f"PO-{uuid.uuid4().hex[:8].upper()}"
    order = PurchaseOrder(
        order_number=order_number,
        supplier_id=supplier_id,
        warehouse_id=warehouse_id,
        created_by=int(get_jwt_identity()),
        status="pending",
    )
    db.session.add(order)
    db.session.flush()

    total = 0
    for item in items:
        product = Product.query.get(item.get("product_id"))
        quantity = int(item.get("quantity") or 0)
        unit_price = float(item.get("unit_price") or (product.unit_price if product else 0))
        if not product or quantity <= 0:
            db.session.rollback()
            return jsonify({"message": "Each line item needs a valid product and a positive quantity."}), 400

        db.session.add(PurchaseOrderItem(
            purchase_order_id=order.id,
            product_id=product.id,
            quantity=quantity,
            unit_price=unit_price,
        ))
        total += quantity * unit_price

    order.total_amount = total
    _log("Purchase Order Created", order_number)
    db.session.commit()
    emit_event("purchase_order_created", f"Purchase order {order_number} created", {"order_id": order.id})
    return jsonify({"message": "Purchase order created successfully.", "purchase_order": order.to_dict()}), 201


@purchase_orders_bp.route("/<int:order_id>/approve", methods=["POST"])
@roles_required("admin", "manager")
def approve_purchase_order(order_id):
    order = PurchaseOrder.query.get(order_id)
    if not order:
        return jsonify({"message": "Purchase order not found."}), 404
    if order.status != "pending":
        return jsonify({"message": f"Only pending orders can be approved (current status: {order.status})."}), 409

    order.status = "approved"
    _log("Purchase Order Approved", order.order_number)
    db.session.commit()
    emit_event("purchase_order_approved", f"Purchase order {order.order_number} approved", {"order_id": order.id})
    return jsonify({"message": "Purchase order approved.", "purchase_order": order.to_dict()}), 200


@purchase_orders_bp.route("/<int:order_id>/reject", methods=["POST"])
@roles_required("admin", "manager")
def reject_purchase_order(order_id):
    order = PurchaseOrder.query.get(order_id)
    if not order:
        return jsonify({"message": "Purchase order not found."}), 404
    if order.status != "pending":
        return jsonify({"message": f"Only pending orders can be rejected (current status: {order.status})."}), 409

    order.status = "rejected"
    _log("Purchase Order Rejected", order.order_number)
    db.session.commit()
    return jsonify({"message": "Purchase order rejected.", "purchase_order": order.to_dict()}), 200


@purchase_orders_bp.route("/<int:order_id>/receive", methods=["POST"])
@roles_required("admin", "manager")
def receive_purchase_order(order_id):
    """Marks an approved order as received and automatically increases stock
    for every line item, logging each movement to InventoryLog."""
    order = PurchaseOrder.query.get(order_id)
    if not order:
        return jsonify({"message": "Purchase order not found."}), 404
    if order.status != "approved":
        return jsonify({"message": f"Only approved orders can be received (current status: {order.status})."}), 409

    user_id = int(get_jwt_identity())
    for item in order.items:
        item.product.quantity = (item.product.quantity or 0) + item.quantity
        db.session.add(InventoryLog(
            product_id=item.product_id,
            warehouse_id=order.warehouse_id,
            changed_by=user_id,
            movement_type="in",
            quantity=item.quantity,
            reason=f"Purchase Order #{order.order_number}",
        ))

    order.status = "received"
    _log("Inventory Updated", f"Stock received for {order.order_number}")
    db.session.commit()
    emit_event("stock_added", f"Stock received for {order.order_number}", {"order_id": order.id})
    emit_event("inventory_updated", "Inventory updated", {"order_id": order.id})
    return jsonify({"message": "Stock received and inventory updated.", "purchase_order": order.to_dict()}), 200


@purchase_orders_bp.route("/<int:order_id>/cancel", methods=["POST"])
@roles_required("admin", "manager")
def cancel_purchase_order(order_id):
    order = PurchaseOrder.query.get(order_id)
    if not order:
        return jsonify({"message": "Purchase order not found."}), 404
    if order.status in ("received", "cancelled"):
        return jsonify({"message": f"Cannot cancel an order that is already {order.status}."}), 409

    order.status = "cancelled"
    _log("Purchase Order Cancelled", order.order_number)
    db.session.commit()
    return jsonify({"message": "Purchase order cancelled.", "purchase_order": order.to_dict()}), 200
