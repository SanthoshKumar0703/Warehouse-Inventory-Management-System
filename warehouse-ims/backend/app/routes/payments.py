import razorpay
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required

payments_bp = Blueprint("payments", __name__, url_prefix="/api/payments")


def _get_client():
    key_id = current_app.config.get("RAZORPAY_KEY_ID")
    key_secret = current_app.config.get("RAZORPAY_KEY_SECRET")
    if not key_id or not key_secret:
        return None
    return razorpay.Client(auth=(key_id, key_secret))


@payments_bp.route("/create-order", methods=["POST"])
@jwt_required()
def create_order():
    """Creates a Razorpay order for a Stock In restock payment.
    Amount is given in the request as a decimal currency amount (e.g. rupees)
    and converted to the smallest currency unit (paise) as Razorpay requires.
    """
    client = _get_client()
    if not client:
        return jsonify({
            "message": "Razorpay isn't configured yet. Set RAZORPAY_KEY_ID and "
                       "RAZORPAY_KEY_SECRET in the backend .env file."
        }), 501

    data = request.get_json(silent=True) or {}
    amount = data.get("amount")
    try:
        amount = float(amount)
    except (TypeError, ValueError):
        amount = 0

    if amount <= 0:
        return jsonify({"message": "Amount must be greater than zero to create a payment."}), 400

    amount_paise = int(round(amount * 100))

    try:
        order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "payment_capture": 1,
            "notes": {"source": "WareFlow Stock In"},
        })
    except Exception as exc:  # noqa: BLE001
        current_app.logger.error(f"Razorpay order creation failed: {exc}")
        return jsonify({"message": "Could not create the payment order. Please try again."}), 502

    return jsonify({
        "order_id": order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "key_id": current_app.config.get("RAZORPAY_KEY_ID"),
    }), 201


@payments_bp.route("/verify", methods=["POST"])
@jwt_required()
def verify_payment():
    """Verifies the signature Razorpay Checkout returns after a successful
    payment. Must be called before trusting a payment_id client-side.
    """
    client = _get_client()
    if not client:
        return jsonify({
            "message": "Razorpay isn't configured yet. Set RAZORPAY_KEY_ID and "
                       "RAZORPAY_KEY_SECRET in the backend .env file."
        }), 501

    data = request.get_json(silent=True) or {}
    required = ["razorpay_order_id", "razorpay_payment_id", "razorpay_signature"]
    if not all(data.get(f) for f in required):
        return jsonify({"message": "Missing payment verification fields.", "verified": False}), 400

    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": data["razorpay_order_id"],
            "razorpay_payment_id": data["razorpay_payment_id"],
            "razorpay_signature": data["razorpay_signature"],
        })
    except razorpay.errors.SignatureVerificationError:
        return jsonify({"message": "Payment signature verification failed.", "verified": False}), 400

    return jsonify({"message": "Payment verified successfully.", "verified": True,
                     "payment_id": data["razorpay_payment_id"]}), 200
