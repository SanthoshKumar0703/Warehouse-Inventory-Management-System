import uuid
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import Product, Category, Warehouse, Supplier, ActivityLog
from app.utils.rbac import roles_required
from app.utils.codes import generate_qr_code, generate_barcode_image
from app.utils.uploads import save_uploaded_image
from app.utils.realtime import emit_event

products_bp = Blueprint("products", __name__, url_prefix="/api/products")


def _log(action, details=None):
    user_id = int(get_jwt_identity())
    db.session.add(ActivityLog(user_id=user_id, action=action, details=details))


@products_bp.route("", methods=["GET"])
@jwt_required()
def list_products():
    search = request.args.get("search", "").strip()
    category_id = request.args.get("category_id", type=int)
    warehouse_id = request.args.get("warehouse_id", type=int)
    status = request.args.get("status", "").strip()
    stock_status = request.args.get("stock_status", "").strip()
    page = request.args.get("page", 1, type=int)
    per_page = min(request.args.get("per_page", 12, type=int), 100)

    query = Product.query
    if search:
        like = f"%{search}%"
        query = query.filter(db.or_(Product.name.ilike(like), Product.sku.ilike(like)))
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if warehouse_id:
        query = query.filter(Product.warehouse_id == warehouse_id)
    if status:
        query = query.filter(Product.status == status)

    query = query.order_by(Product.created_at.desc())

    if stock_status:
        # stock_status is a computed property, so filter in Python after fetching
        all_matching = [p for p in query.all() if p.stock_status == stock_status]
        total = len(all_matching)
        start = (page - 1) * per_page
        items = all_matching[start:start + per_page]
    else:
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)
        items = pagination.items
        total = pagination.total

    return jsonify({
        "products": [p.to_dict() for p in items],
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": (total + per_page - 1) // per_page if per_page else 1,
    }), 200


@products_bp.route("/<int:product_id>", methods=["GET"])
@jwt_required()
def get_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"message": "Product not found."}), 404
    return jsonify({"product": product.to_dict()}), 200


def _validate_refs(data):
    if data.get("category_id") and not Category.query.get(data["category_id"]):
        return "Selected category does not exist."
    if data.get("warehouse_id") and not Warehouse.query.get(data["warehouse_id"]):
        return "Selected warehouse does not exist."
    if data.get("supplier_id") and not Supplier.query.get(data["supplier_id"]):
        return "Selected supplier does not exist."
    return None


@products_bp.route("", methods=["POST"])
@roles_required("admin", "manager")
def create_product():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"message": "Product name is required."}), 400

    error = _validate_refs(data)
    if error:
        return jsonify({"message": error}), 400

    sku = (data.get("sku") or "").strip() or f"SKU-{uuid.uuid4().hex[:8].upper()}"
    if Product.query.filter_by(sku=sku).first():
        return jsonify({"message": "A product with this SKU already exists."}), 409

    product = Product(
        sku=sku,
        name=name,
        description=data.get("description"),
        category_id=data.get("category_id"),
        warehouse_id=data.get("warehouse_id"),
        supplier_id=data.get("supplier_id"),
        unit_price=data.get("unit_price", 0),
        quantity=data.get("quantity", 0),
        reorder_level=data.get("reorder_level", 10),
        status=data.get("status", "active"),
    )
    db.session.add(product)
    db.session.flush()  # need product.id for QR/barcode filenames

    try:
        product.qr_code_url = generate_qr_code(product.sku, f"product_{product.id}")
        product.barcode_url = generate_barcode_image(product.sku, f"product_{product.id}")
    except Exception as exc:  # noqa: BLE001 — QR/barcode generation shouldn't block product creation
        db.session.rollback()
        return jsonify({"message": f"Product could not be saved: {exc}"}), 500

    _log("Product Added", name)
    db.session.commit()
    emit_event("product_added", f"{name} was added", {"product_id": product.id})
    return jsonify({"message": "Product added successfully.", "product": product.to_dict()}), 201


@products_bp.route("/<int:product_id>", methods=["PUT"])
@roles_required("admin", "manager")
def update_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"message": "Product not found."}), 404

    data = request.get_json(silent=True) or {}
    error = _validate_refs(data)
    if error:
        return jsonify({"message": error}), 400

    if data.get("sku") and data["sku"] != product.sku:
        if Product.query.filter_by(sku=data["sku"]).first():
            return jsonify({"message": "A product with this SKU already exists."}), 409
        product.sku = data["sku"]
        # regenerate codes since SKU changed
        product.qr_code_url = generate_qr_code(product.sku, f"product_{product.id}")
        product.barcode_url = generate_barcode_image(product.sku, f"product_{product.id}")

    for field in ["name", "description", "category_id", "warehouse_id", "supplier_id",
                  "unit_price", "quantity", "reorder_level", "status"]:
        if field in data:
            setattr(product, field, data.get(field))

    _log("Product Updated", product.name)
    db.session.commit()
    emit_event("product_updated", f"{product.name} was updated", {"product_id": product.id})
    return jsonify({"message": "Product updated successfully.", "product": product.to_dict()}), 200


@products_bp.route("/<int:product_id>", methods=["DELETE"])
@roles_required("admin", "manager")
def delete_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"message": "Product not found."}), 404

    name = product.name
    db.session.delete(product)
    _log("Product Deleted", name)
    db.session.commit()
    emit_event("product_deleted", f"{name} was deleted")
    return jsonify({"message": "Product deleted successfully."}), 200


@products_bp.route("/<int:product_id>/image", methods=["POST"])
@roles_required("admin", "manager")
def upload_product_image(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"message": "Product not found."}), 404

    file_storage = request.files.get("image")
    url = save_uploaded_image(file_storage, subfolder="products")
    if not url:
        return jsonify({"message": "Please upload a valid image file (png, jpg, jpeg, webp, gif)."}), 400

    product.image_url = url
    _log("Product Updated", f"{product.name} image updated")
    db.session.commit()
    return jsonify({"message": "Image uploaded successfully.", "product": product.to_dict()}), 200
