import os
from flask import Flask, jsonify

from app.config import Config
from app.extensions import db, bcrypt, jwt, cors, socketio


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["FRONTEND_URL"]}}, supports_credentials=True)
    socketio.init_app(app)

    from app.routes.auth import auth_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.categories import categories_bp
    from app.routes.warehouses import warehouses_bp
    from app.routes.suppliers import suppliers_bp
    from app.routes.products import products_bp
    from app.routes.purchase_orders import purchase_orders_bp
    from app.routes.inventory import inventory_bp
    from app.routes.reports import reports_bp
    from app.routes.users import users_bp
    from app.routes.payments import payments_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(warehouses_bp)
    app.register_blueprint(suppliers_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(purchase_orders_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(payments_bp)

    @app.route("/api/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "service": "warehouse-ims-backend"}), 200

    @jwt.unauthorized_loader
    def unauthorized_callback(reason):
        return jsonify({"message": "Missing or invalid access token."}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return jsonify({"message": "Invalid access token."}), 422

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"message": "Access token has expired."}), 401

    with app.app_context():
        from app import models  # noqa: F401  (ensures models are registered before create_all)
        db.create_all()

    return app
