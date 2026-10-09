from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from app.models import User


def roles_required(*allowed_roles):
    """Usage: @roles_required('admin', 'manager')"""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            identity = get_jwt_identity()
            user = User.query.get(int(identity))
            if not user or user.role not in allowed_roles:
                return jsonify({"message": "You do not have permission to perform this action."}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator
