from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models import User, ActivityLog
from app.utils.rbac import roles_required
from app.utils.mail import send_email, password_changed_email_html
from app.utils.realtime import emit_event

users_bp = Blueprint("users", __name__, url_prefix="/api/users")

VALID_ROLES = {"admin", "manager", "staff"}


def _log(action, details=None):
    user_id = int(get_jwt_identity())
    db.session.add(ActivityLog(user_id=user_id, action=action, details=details))


@users_bp.route("", methods=["GET"])
@roles_required("admin")
def list_users():
    users = User.query.order_by(User.created_at.asc()).all()
    return jsonify({"users": [u.to_dict() for u in users]}), 200


@users_bp.route("/<int:user_id>", methods=["PUT"])
@roles_required("admin")
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found."}), 404

    data = request.get_json(silent=True) or {}
    current_user_id = int(get_jwt_identity())

    if "role" in data:
        new_role = data["role"]
        if new_role not in VALID_ROLES:
            return jsonify({"message": "Invalid role."}), 400
        if user.id == current_user_id and new_role != "admin":
            return jsonify({"message": "You cannot remove your own admin role."}), 400
        if user.role == "admin" and new_role != "admin":
            if User.query.filter_by(role="admin").count() <= 1:
                return jsonify({"message": "Cannot demote the last remaining admin."}), 400
        user.role = new_role

    if "is_active" in data:
        if user.id == current_user_id and not data["is_active"]:
            return jsonify({"message": "You cannot deactivate your own account."}), 400
        user.is_active = bool(data["is_active"])

    if "full_name" in data and data["full_name"].strip():
        user.full_name = data["full_name"].strip()

    _log("User Updated", user.full_name)
    db.session.commit()
    return jsonify({"message": "User updated successfully.", "user": user.to_dict()}), 200


@users_bp.route("/<int:user_id>/reset-password", methods=["POST"])
@roles_required("admin")
def admin_reset_password(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found."}), 404

    data = request.get_json(silent=True) or {}
    new_password = data.get("new_password") or ""
    if len(new_password) < 8:
        return jsonify({"message": "Password must be at least 8 characters long."}), 400

    user.set_password(new_password)
    _log("Password Changed Successfully", f"Admin reset password for {user.full_name}")
    db.session.commit()

    emit_event("password_changed", f"{user.full_name}'s password was reset by an admin", {"user_id": user.id})
    send_email(user.email, "Your WareFlow password was changed", password_changed_email_html())

    return jsonify({"message": "Password reset successfully."}), 200


@users_bp.route("/<int:user_id>", methods=["DELETE"])
@roles_required("admin")
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found."}), 404

    current_user_id = int(get_jwt_identity())
    if user.id == current_user_id:
        return jsonify({"message": "You cannot delete your own account."}), 400
    if user.role == "admin" and User.query.filter_by(role="admin").count() <= 1:
        return jsonify({"message": "Cannot delete the last remaining admin."}), 400

    name = user.full_name
    db.session.delete(user)
    _log("User Deleted", name)
    db.session.commit()
    return jsonify({"message": "User deleted successfully."}), 200
