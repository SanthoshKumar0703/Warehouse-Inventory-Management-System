from datetime import datetime
from app.extensions import db


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    products = db.relationship("Product", backref="category", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "product_count": len(self.products),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Warehouse(db.Model):
    __tablename__ = "warehouses"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    location = db.Column(db.String(255), nullable=True)
    capacity = db.Column(db.Integer, nullable=True)  # max units
    manager_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    manager = db.relationship("User", foreign_keys=[manager_id])

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "location": self.location,
            "capacity": self.capacity,
            "manager": self.manager.full_name if self.manager else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Supplier(db.Model):
    __tablename__ = "suppliers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    contact_person = db.Column(db.String(120), nullable=True)
    email = db.Column(db.String(160), nullable=True)
    phone_number = db.Column(db.String(20), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "contact_person": self.contact_person,
            "email": self.email,
            "phone_number": self.phone_number,
            "address": self.address,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
