from datetime import datetime
from app.extensions import db


class PurchaseOrder(db.Model):
    __tablename__ = "purchase_orders"

    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(40), unique=True, nullable=False)
    supplier_id = db.Column(db.Integer, db.ForeignKey("suppliers.id"), nullable=False)
    warehouse_id = db.Column(db.Integer, db.ForeignKey("warehouses.id"), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    status = db.Column(db.String(20), default="pending")  # pending | approved | rejected | received | cancelled
    total_amount = db.Column(db.Numeric(12, 2), default=0)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    supplier = db.relationship("Supplier", foreign_keys=[supplier_id])
    warehouse = db.relationship("Warehouse", foreign_keys=[warehouse_id])
    items = db.relationship("PurchaseOrderItem", backref="purchase_order", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "order_number": self.order_number,
            "supplier": self.supplier.name if self.supplier else None,
            "warehouse": self.warehouse.name if self.warehouse else None,
            "status": self.status,
            "total_amount": float(self.total_amount) if self.total_amount is not None else 0,
            "items": [item.to_dict() for item in self.items],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class PurchaseOrderItem(db.Model):
    __tablename__ = "purchase_order_items"

    id = db.Column(db.Integer, primary_key=True)
    purchase_order_id = db.Column(db.Integer, db.ForeignKey("purchase_orders.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(12, 2), nullable=False)

    product = db.relationship("Product", foreign_keys=[product_id])

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product.name if self.product else None,
            "quantity": self.quantity,
            "unit_price": float(self.unit_price),
        }


class InventoryLog(db.Model):
    """Every stock in / stock out movement — the source of truth for history & AI prediction."""
    __tablename__ = "inventory_logs"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    warehouse_id = db.Column(db.Integer, db.ForeignKey("warehouses.id"), nullable=True)
    changed_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    movement_type = db.Column(db.String(10), nullable=False)  # in | out
    quantity = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.String(255), nullable=True)  # e.g. "Purchase Order #123", "Manual adjustment"

    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    product = db.relationship("Product", foreign_keys=[product_id])

    def to_dict(self):
        return {
            "id": self.id,
            "product_id": self.product_id,
            "product_name": self.product.name if self.product else None,
            "movement_type": self.movement_type,
            "quantity": self.quantity,
            "reason": self.reason,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ActivityLog(db.Model):
    """Powers the live activity feed and audit log."""
    __tablename__ = "activity_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    action = db.Column(db.String(255), nullable=False)  # e.g. "Product Added", "User logged in"
    details = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    user = db.relationship("User", foreign_keys=[user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "user": self.user.full_name if self.user else "System",
            "action": self.action,
            "details": self.details,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
