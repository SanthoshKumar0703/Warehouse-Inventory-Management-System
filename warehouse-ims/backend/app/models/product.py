from datetime import datetime
from app.extensions import db


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    sku = db.Column(db.String(60), unique=True, nullable=False)
    name = db.Column(db.String(180), nullable=False)
    description = db.Column(db.Text, nullable=True)

    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=True)
    warehouse_id = db.Column(db.Integer, db.ForeignKey("warehouses.id"), nullable=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey("suppliers.id"), nullable=True)

    unit_price = db.Column(db.Numeric(12, 2), default=0)
    quantity = db.Column(db.Integer, default=0)
    reorder_level = db.Column(db.Integer, default=10)

    status = db.Column(db.String(20), default="active")  # active | inactive | discontinued
    image_url = db.Column(db.String(255), nullable=True)
    qr_code_url = db.Column(db.String(255), nullable=True)
    barcode_url = db.Column(db.String(255), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    warehouse = db.relationship("Warehouse", foreign_keys=[warehouse_id])
    supplier = db.relationship("Supplier", foreign_keys=[supplier_id])

    @property
    def stock_status(self):
        if self.quantity <= 0:
            return "out_of_stock"
        if self.quantity <= self.reorder_level:
            return "low_stock"
        return "in_stock"

    def to_dict(self):
        return {
            "id": self.id,
            "sku": self.sku,
            "name": self.name,
            "description": self.description,
            "category": self.category.name if self.category else None,
            "category_id": self.category_id,
            "warehouse": self.warehouse.name if self.warehouse else None,
            "warehouse_id": self.warehouse_id,
            "supplier": self.supplier.name if self.supplier else None,
            "supplier_id": self.supplier_id,
            "unit_price": float(self.unit_price) if self.unit_price is not None else 0,
            "quantity": self.quantity,
            "reorder_level": self.reorder_level,
            "stock_status": self.stock_status,
            "status": self.status,
            "image_url": self.image_url,
            "qr_code_url": self.qr_code_url,
            "barcode_url": self.barcode_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
