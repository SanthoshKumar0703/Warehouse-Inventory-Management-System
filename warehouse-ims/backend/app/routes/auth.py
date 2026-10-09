import random
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
)
from email_validator import validate_email, EmailNotValidError
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from app.extensions import db
from app.models import User, ActivityLog, PasswordResetOTP
from app.utils.mail import send_email, otp_email_html, password_changed_email_html
from app.utils.realtime import emit_event

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _log_activity(user_id, action, details=None):
    db.session.add(ActivityLog(user_id=user_id, action=action, details=details))


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    full_name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    phone_number = (data.get("phone_number") or "").strip()
    password = data.get("password") or ""
    confirm_password = data.get("confirm_password") or ""

    if not full_name or not email or not password:
        return jsonify({"message": "Full name, email, and password are required."}), 400

    try:
        validate_email(email, check_deliverability=False)
    except EmailNotValidError:
        return jsonify({"message": "Please enter a valid email address."}), 400

    if password != confirm_password:
        return jsonify({"message": "Passwords do not match."}), 400

    if len(password) < 8:
        return jsonify({"message": "Password must be at least 8 characters long."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "An account with this email already exists."}), 409

    # First registered user becomes Admin automatically. Everyone else picks
    # Staff or Manager on the signup form; Admin is never publicly selectable.
    requested_role = (data.get("role") or "staff").strip().lower()
    if requested_role not in ("staff", "manager"):
        requested_role = "staff"
    role = "admin" if User.query.count() == 0 else requested_role

    user = User(full_name=full_name, email=email, phone_number=phone_number, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()  # get user.id before logging

    _log_activity(user.id, "User Registered", f"{full_name} joined as {role}")
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    emit_event("user_registered", f"{full_name} joined WareFlow", {"user_id": user.id})

    return jsonify({
        "message": "Welcome! Your account has been created successfully.",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict(),
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"message": "Invalid email or password."}), 401

    if not user.is_active:
        return jsonify({"message": "This account has been deactivated. Contact an administrator."}), 403

    user.last_login_at = datetime.utcnow()
    _log_activity(user.id, "User logged in")
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "message": f"Welcome back, {user.full_name.split(' ')[0]}!",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return jsonify({"access_token": access_token}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    identity = get_jwt_identity()
    user = User.query.get(int(identity))
    if not user:
        return jsonify({"message": "User not found."}), 404
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    identity = get_jwt_identity()
    user = User.query.get(int(identity))
    if not user:
        return jsonify({"message": "User not found."}), 404

    data = request.get_json(silent=True) or {}
    if data.get("full_name"):
        user.full_name = data["full_name"].strip()
    if "phone_number" in data:
        user.phone_number = data.get("phone_number")

    _log_activity(user.id, "Profile Updated")
    db.session.commit()
    emit_event("profile_updated", f"{user.full_name} updated their profile", {"user_id": user.id})
    return jsonify({"message": "Profile updated successfully.", "user": user.to_dict()}), 200


@auth_bp.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    identity = get_jwt_identity()
    user = User.query.get(int(identity))
    if not user:
        return jsonify({"message": "User not found."}), 404

    data = request.get_json(silent=True) or {}
    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""

    if not user.check_password(current_password):
        return jsonify({"message": "Current password is incorrect."}), 400
    if len(new_password) < 8:
        return jsonify({"message": "New password must be at least 8 characters long."}), 400

    user.set_password(new_password)
    _log_activity(user.id, "Password Changed Successfully")
    db.session.commit()

    emit_event("password_changed", f"{user.full_name} changed their password", {"user_id": user.id})
    send_email(user.email, "Your WareFlow password was changed", password_changed_email_html())

    return jsonify({"message": "Password changed successfully."}), 200


@auth_bp.route("/google-login", methods=["POST"])
def google_login():
    """Verifies a Google ID token (from the frontend's Google Identity Services
    button) and logs the user in, creating an account on first sign-in.
    Requires GOOGLE_CLIENT_ID to be set in .env.
    """
    data = request.get_json(silent=True) or {}
    credential = data.get("credential")
    if not credential:
        return jsonify({"message": "Missing Google credential."}), 400

    client_id = current_app.config.get("GOOGLE_CLIENT_ID")
    if not client_id:
        return jsonify({
            "message": "Google Sign-In is not configured yet. Set GOOGLE_CLIENT_ID in the backend .env file."
        }), 501

    try:
        payload = google_id_token.verify_oauth2_token(
            credential, google_requests.Request(), client_id
        )
    except ValueError:
        return jsonify({"message": "Invalid Google credential."}), 401

    email = (payload.get("email") or "").strip().lower()
    if not email or not payload.get("email_verified", False):
        return jsonify({"message": "Google account email is not verified."}), 401

    full_name = payload.get("name") or email.split("@")[0]
    avatar_url = payload.get("picture")
    google_id = payload.get("sub")

    user = User.query.filter_by(email=email).first()
    if not user:
        role = "admin" if User.query.count() == 0 else "staff"
        user = User(
            full_name=full_name,
            email=email,
            role=role,
            google_id=google_id,
            avatar_url=avatar_url,
        )
        db.session.add(user)
        db.session.flush()
        _log_activity(user.id, "User Registered", f"{full_name} joined via Google as {role}")
        emit_event("user_registered", f"{full_name} joined WareFlow via Google", {"user_id": user.id})
    else:
        if not user.is_active:
            return jsonify({"message": "This account has been deactivated. Contact an administrator."}), 403
        user.google_id = user.google_id or google_id
        user.avatar_url = user.avatar_url or avatar_url

    user.last_login_at = datetime.utcnow()
    _log_activity(user.id, "User logged in via Google")
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        "message": f"Welcome, {user.full_name.split(' ')[0]}!",
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/forgot-password/request-otp", methods=["POST"])
def request_otp():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    user = User.query.filter_by(email=email).first()
    # Always return 200 even if the email doesn't exist, so the endpoint
    # can't be used to enumerate registered accounts.
    if not user:
        return jsonify({"message": "If that email exists, an OTP has been sent."}), 200

    otp_code = f"{random.randint(0, 999999):06d}"
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    db.session.add(PasswordResetOTP(user_id=user.id, otp_code=otp_code, expires_at=expires_at))
    db.session.commit()

    sent = send_email(user.email, "Your WareFlow password reset code", otp_email_html(otp_code))
    if not sent:
        current_app.logger.info(f"[DEV FALLBACK] OTP for {user.email}: {otp_code}")

    return jsonify({"message": "If that email exists, an OTP has been sent."}), 200


@auth_bp.route("/forgot-password/verify-otp", methods=["POST"])
def verify_otp():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    otp_code = (data.get("otp") or "").strip()

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "Invalid or expired code."}), 400

    record = (
        PasswordResetOTP.query.filter_by(user_id=user.id, otp_code=otp_code, is_used=False)
        .order_by(PasswordResetOTP.created_at.desc())
        .first()
    )
    if not record or record.expires_at < datetime.utcnow():
        return jsonify({"message": "Invalid or expired code."}), 400

    return jsonify({"message": "Code verified. You can now set a new password."}), 200


@auth_bp.route("/forgot-password/reset", methods=["POST"])
def reset_password():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    otp_code = (data.get("otp") or "").strip()
    new_password = data.get("new_password") or ""

    if len(new_password) < 8:
        return jsonify({"message": "Password must be at least 8 characters long."}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"message": "Invalid or expired code."}), 400

    record = (
        PasswordResetOTP.query.filter_by(user_id=user.id, otp_code=otp_code, is_used=False)
        .order_by(PasswordResetOTP.created_at.desc())
        .first()
    )
    if not record or record.expires_at < datetime.utcnow():
        return jsonify({"message": "Invalid or expired code."}), 400

    user.set_password(new_password)
    record.is_used = True
    _log_activity(user.id, "Password Changed Successfully")
    db.session.commit()

    emit_event("password_changed", f"{user.full_name}'s password was changed", {"user_id": user.id})

    sent = send_email(user.email, "Your WareFlow password was changed", password_changed_email_html())
    if not sent:
        current_app.logger.info(f"[DEV FALLBACK] Password changed confirmation not emailed to {user.email}")

    return jsonify({"message": "Password updated successfully. You can now sign in."}), 200
