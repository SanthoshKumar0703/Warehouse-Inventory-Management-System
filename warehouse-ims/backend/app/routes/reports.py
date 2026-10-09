from flask import Blueprint, request, send_file
from flask_jwt_extended import jwt_required

from app.models import Product, Warehouse, Supplier, PurchaseOrder
from app.utils.reports import build_pdf_report, build_excel_report

reports_bp = Blueprint("reports", __name__, url_prefix="/api/reports")


def _respond(fmt, title, headers, rows, filename):
    if fmt == "excel":
        buffer = build_excel_report(title, headers, rows)
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"{filename}.xlsx",
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
    buffer = build_pdf_report(title, headers, rows)
    return send_file(buffer, as_attachment=True, download_name=f"{filename}.pdf", mimetype="application/pdf")


@reports_bp.route("/inventory", methods=["GET"])
@jwt_required()
def inventory_report():
    fmt = request.args.get("format", "pdf")
    products = Product.query.order_by(Product.name.asc()).all()
    headers = ["SKU", "Name", "Category", "Warehouse", "Quantity", "Reorder Level", "Stock Status", "Unit Price"]
    rows = [
        [p.sku, p.name, p.category.name if p.category else "-", p.warehouse.name if p.warehouse else "-",
         p.quantity, p.reorder_level, p.stock_status.replace("_", " "), f"${float(p.unit_price):.2f}"]
        for p in products
    ]
    return _respond(fmt, "Inventory Report", headers, rows, "inventory_report")


@reports_bp.route("/warehouse", methods=["GET"])
@jwt_required()
def warehouse_report():
    fmt = request.args.get("format", "pdf")
    warehouses = Warehouse.query.order_by(Warehouse.name.asc()).all()
    headers = ["Name", "Location", "Capacity", "Products", "Total Units Stored"]
    rows = []
    for w in warehouses:
        products = Product.query.filter_by(warehouse_id=w.id).all()
        rows.append([w.name, w.location or "-", w.capacity or "-", len(products), sum(p.quantity for p in products)])
    return _respond(fmt, "Warehouse Report", headers, rows, "warehouse_report")


@reports_bp.route("/product", methods=["GET"])
@jwt_required()
def product_report():
    fmt = request.args.get("format", "pdf")
    products = Product.query.order_by(Product.created_at.desc()).all()
    headers = ["SKU", "Name", "Category", "Supplier", "Quantity", "Unit Price", "Status"]
    rows = [
        [p.sku, p.name, p.category.name if p.category else "-", p.supplier.name if p.supplier else "-",
         p.quantity, f"${float(p.unit_price):.2f}", p.status]
        for p in products
    ]
    return _respond(fmt, "Product Report", headers, rows, "product_report")


@reports_bp.route("/supplier", methods=["GET"])
@jwt_required()
def supplier_report():
    fmt = request.args.get("format", "pdf")
    suppliers = Supplier.query.order_by(Supplier.name.asc()).all()
    headers = ["Name", "Contact Person", "Email", "Phone", "Purchase Orders", "Total Spend"]
    rows = []
    for s in suppliers:
        orders = PurchaseOrder.query.filter_by(supplier_id=s.id).all()
        total_spend = sum(float(o.total_amount or 0) for o in orders if o.status == "received")
        rows.append([s.name, s.contact_person or "-", s.email or "-", s.phone_number or "-",
                     len(orders), f"${total_spend:.2f}"])
    return _respond(fmt, "Supplier Report", headers, rows, "supplier_report")


@reports_bp.route("/purchase", methods=["GET"])
@jwt_required()
def purchase_report():
    fmt = request.args.get("format", "pdf")
    orders = PurchaseOrder.query.order_by(PurchaseOrder.created_at.desc()).all()
    headers = ["Order #", "Supplier", "Warehouse", "Status", "Total Amount", "Created"]
    rows = [
        [o.order_number, o.supplier.name if o.supplier else "-", o.warehouse.name if o.warehouse else "-",
         o.status, f"${float(o.total_amount or 0):.2f}", o.created_at.strftime("%Y-%m-%d") if o.created_at else "-"]
        for o in orders
    ]
    return _respond(fmt, "Purchase Order Report", headers, rows, "purchase_report")
