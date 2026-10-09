from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import Supplier, PurchaseOrder, ActivityLog
from app.utils.rbac import roles_required
from app.utils.realtime import emit_event

suppliers_bp = Blueprint("suppliers", __name__, url_prefix="/api/suppliers")


def _log(action, details=None):
    user_id = int(get_jwt_identity())
    db.session.add(ActivityLog(user_id=user_id, action=action, details=details))


@suppliers_bp.route("", methods=["GET"])
@jwt_required()
def list_suppliers():
    search = request.args.get("search", "").strip()
    query = Supplier.query
    if search:
        query = query.filter(Supplier.name.ilike(f"%{search}%"))
    suppliers = query.order_by(Supplier.name.asc()).all()
    return jsonify({"suppliers": [s.to_dict() for s in suppliers]}), 200


@suppliers_bp.route("/<int:supplier_id>/purchase-history", methods=["GET"])
@jwt_required()
def supplier_purchase_history(supplier_id):
    supplier = Supplier.query.get(supplier_id)
    if not supplier:
        return jsonify({"message": "Supplier not found."}), 404
    orders = PurchaseOrder.query.filter_by(supplier_id=supplier_id).order_by(PurchaseOrder.created_at.desc()).all()
    return jsonify({"purchase_history": [o.to_dict() for o in orders]}), 200


@suppliers_bp.route("", methods=["POST"])
@roles_required("admin", "manager")
def create_supplier():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"message": "Supplier name is required."}), 400

    supplier = Supplier(
        name=name,
        contact_person=data.get("contact_person"),
        email=data.get("email"),
        phone_number=data.get("phone_number"),
        address=data.get("address"),
    )
    db.session.add(supplier)
    db.session.flush()
    _log("Supplier Added", name)
    db.session.commit()
    emit_event("supplier_added", f"{name} was added as a supplier", {"supplier_id": supplier.id})
    return jsonify({"message": "Supplier added successfully.", "supplier": supplier.to_dict()}), 201


@suppliers_bp.route("/<int:supplier_id>", methods=["PUT"])
@roles_required("admin", "manager")
def update_supplier(supplier_id):
    supplier = Supplier.query.get(supplier_id)
    if not supplier:
        return jsonify({"message": "Supplier not found."}), 404

    data = request.get_json(silent=True) or {}
    for field in ["name", "contact_person", "email", "phone_number", "address"]:
        if field in data:
            setattr(supplier, field, data.get(field))

    _log("Supplier Updated", supplier.name)
    db.session.commit()
    return jsonify({"message": "Supplier updated successfully.", "supplier": supplier.to_dict()}), 200


@suppliers_bp.route("/<int:supplier_id>", methods=["DELETE"])
@roles_required("admin", "manager")
def delete_supplier(supplier_id):
    supplier = Supplier.query.get(supplier_id)
    if not supplier:
        return jsonify({"message": "Supplier not found."}), 404
    if PurchaseOrder.query.filter_by(supplier_id=supplier_id).first():
        return jsonify({"message": "Cannot delete a supplier with existing purchase orders."}), 409

    name = supplier.name
    db.session.delete(supplier)
    _log("Supplier Deleted", name)
    db.session.commit()
    return jsonify({"message": "Supplier deleted successfully."}), 200
