from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import Warehouse, User, ActivityLog
from app.utils.rbac import roles_required

warehouses_bp = Blueprint("warehouses", __name__, url_prefix="/api/warehouses")


def _log(action, details=None):
    user_id = int(get_jwt_identity())
    db.session.add(ActivityLog(user_id=user_id, action=action, details=details))


@warehouses_bp.route("", methods=["GET"])
@jwt_required()
def list_warehouses():
    search = request.args.get("search", "").strip()
    query = Warehouse.query
    if search:
        query = query.filter(Warehouse.name.ilike(f"%{search}%"))
    warehouses = query.order_by(Warehouse.name.asc()).all()
    return jsonify({"warehouses": [w.to_dict() for w in warehouses]}), 200


@warehouses_bp.route("", methods=["POST"])
@roles_required("admin", "manager")
def create_warehouse():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"message": "Warehouse name is required."}), 400
    if Warehouse.query.filter_by(name=name).first():
        return jsonify({"message": "A warehouse with this name already exists."}), 409

    manager_id = data.get("manager_id")
    if manager_id and not User.query.get(manager_id):
        return jsonify({"message": "Selected manager does not exist."}), 400

    warehouse = Warehouse(
        name=name,
        location=data.get("location"),
        capacity=data.get("capacity"),
        manager_id=manager_id,
    )
    db.session.add(warehouse)
    db.session.flush()
    _log("Warehouse Added", name)
    db.session.commit()
    return jsonify({"message": "Warehouse added successfully.", "warehouse": warehouse.to_dict()}), 201


@warehouses_bp.route("/<int:warehouse_id>", methods=["PUT"])
@roles_required("admin", "manager")
def update_warehouse(warehouse_id):
    warehouse = Warehouse.query.get(warehouse_id)
    if not warehouse:
        return jsonify({"message": "Warehouse not found."}), 404

    data = request.get_json(silent=True) or {}
    if data.get("name"):
        name = data["name"].strip()
        existing = Warehouse.query.filter_by(name=name).first()
        if existing and existing.id != warehouse_id:
            return jsonify({"message": "A warehouse with this name already exists."}), 409
        warehouse.name = name
    if "location" in data:
        warehouse.location = data.get("location")
    if "capacity" in data:
        warehouse.capacity = data.get("capacity")
    if "manager_id" in data:
        manager_id = data.get("manager_id")
        if manager_id and not User.query.get(manager_id):
            return jsonify({"message": "Selected manager does not exist."}), 400
        warehouse.manager_id = manager_id

    _log("Warehouse Updated", warehouse.name)
    db.session.commit()
    return jsonify({"message": "Warehouse updated successfully.", "warehouse": warehouse.to_dict()}), 200


@warehouses_bp.route("/<int:warehouse_id>", methods=["DELETE"])
@roles_required("admin", "manager")
def delete_warehouse(warehouse_id):
    warehouse = Warehouse.query.get(warehouse_id)
    if not warehouse:
        return jsonify({"message": "Warehouse not found."}), 404

    name = warehouse.name
    db.session.delete(warehouse)
    _log("Warehouse Deleted", name)
    db.session.commit()
    return jsonify({"message": "Warehouse deleted successfully."}), 200
