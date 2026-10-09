from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import Category, ActivityLog
from app.utils.rbac import roles_required

categories_bp = Blueprint("categories", __name__, url_prefix="/api/categories")


def _log(action, details=None):
    user_id = int(get_jwt_identity())
    db.session.add(ActivityLog(user_id=user_id, action=action, details=details))


@categories_bp.route("", methods=["GET"])
@jwt_required()
def list_categories():
    search = request.args.get("search", "").strip()
    query = Category.query
    if search:
        query = query.filter(Category.name.ilike(f"%{search}%"))
    categories = query.order_by(Category.name.asc()).all()
    return jsonify({"categories": [c.to_dict() for c in categories]}), 200


@categories_bp.route("", methods=["POST"])
@roles_required("admin", "manager")
def create_category():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"message": "Category name is required."}), 400
    if Category.query.filter_by(name=name).first():
        return jsonify({"message": "A category with this name already exists."}), 409

    category = Category(name=name, description=data.get("description"))
    db.session.add(category)
    db.session.flush()
    _log("Category Added", name)
    db.session.commit()
    return jsonify({"message": "Category added successfully.", "category": category.to_dict()}), 201


@categories_bp.route("/<int:category_id>", methods=["PUT"])
@roles_required("admin", "manager")
def update_category(category_id):
    category = Category.query.get(category_id)
    if not category:
        return jsonify({"message": "Category not found."}), 404

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if name:
        existing = Category.query.filter_by(name=name).first()
        if existing and existing.id != category_id:
            return jsonify({"message": "A category with this name already exists."}), 409
        category.name = name
    if "description" in data:
        category.description = data.get("description")

    _log("Category Updated", category.name)
    db.session.commit()
    return jsonify({"message": "Category updated successfully.", "category": category.to_dict()}), 200


@categories_bp.route("/<int:category_id>", methods=["DELETE"])
@roles_required("admin", "manager")
def delete_category(category_id):
    category = Category.query.get(category_id)
    if not category:
        return jsonify({"message": "Category not found."}), 404
    if category.products:
        return jsonify({"message": "Cannot delete a category that still has products assigned."}), 409

    name = category.name
    db.session.delete(category)
    _log("Category Deleted", name)
    db.session.commit()
    return jsonify({"message": "Category deleted successfully."}), 200
