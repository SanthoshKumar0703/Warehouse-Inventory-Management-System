"""Run with: python seed.py

Populates WareFlow with a realistic demo dataset:
  - 10 categories
  - 5 warehouses
  - 10 suppliers
  - 30 products (spread across categories/warehouses/suppliers, with a
    handful intentionally low-stock or out-of-stock so the dashboard
    alerts and AI predictions have something to show)
  - ~30 days of stock-out history on several products, so the Dashboard
    charts and Smart Reorder Recommendations widget aren't empty
  - A few purchase orders in different statuses

Safe to re-run — everything is checked for existence before inserting.
QR codes and barcodes are generated for every product, same as the API does.
"""
import random
import uuid
from datetime import datetime, timedelta

from app import create_app
from app.extensions import db
from app.models import Category, Warehouse, Supplier, Product, PurchaseOrder, PurchaseOrderItem, InventoryLog
from app.utils.codes import generate_qr_code, generate_barcode_image

app = create_app()
random.seed(42)  # reproducible demo data

CATEGORIES = [
    ("Electronics", "Consumer electronics and accessories"),
    ("Groceries & FMCG", "Fast-moving consumer goods and food staples"),
    ("Personal Care", "Health, hygiene, and personal care products"),
    ("Home Appliances", "Household electrical appliances"),
    ("Stationery & Office", "Office and stationery supplies"),
    ("Packaging Materials", "Boxes, wraps, and packing supplies"),
    ("Furniture", "Office and warehouse furniture"),
    ("Apparel & Textiles", "Clothing, fabric, and workwear"),
    ("Automotive Parts", "Vehicle spare parts and accessories"),
    ("Sports & Fitness", "Sporting goods and fitness equipment"),
]

WAREHOUSES = [
    {"name": "Main Warehouse", "location": "Chennai, Tamil Nadu", "capacity": 20000},
    {"name": "North Depot", "location": "Delhi, NCR", "capacity": 12000},
    {"name": "West Hub", "location": "Mumbai, Maharashtra", "capacity": 15000},
    {"name": "South Storage", "location": "Bengaluru, Karnataka", "capacity": 10000},
    {"name": "East Facility", "location": "Kolkata, West Bengal", "capacity": 9000},
]

SUPPLIERS = [
    {"name": "Acme Supplies Co.", "contact_person": "R. Kumar", "email": "sales@acmesupplies.example", "phone_number": "+91 98765 43210"},
    {"name": "Global Parts Ltd.", "contact_person": "S. Fernandez", "email": "contact@globalparts.example", "phone_number": "+91 98765 43211"},
    {"name": "Sunrise Distributors", "contact_person": "A. Sharma", "email": "orders@sunrisedist.example", "phone_number": "+91 98765 43212"},
    {"name": "Prime Traders", "contact_person": "V. Iyer", "email": "info@primetraders.example", "phone_number": "+91 98765 43213"},
    {"name": "Bluewave Exports", "contact_person": "N. Rao", "email": "sales@bluewaveexports.example", "phone_number": "+91 98765 43214"},
    {"name": "Nova Logistics Partners", "contact_person": "K. Menon", "email": "hello@novalogistics.example", "phone_number": "+91 98765 43215"},
    {"name": "Silverline Wholesale", "contact_person": "P. Desai", "email": "orders@silverlinewholesale.example", "phone_number": "+91 98765 43216"},
    {"name": "Horizon Textiles", "contact_person": "M. Joseph", "email": "sales@horizontextiles.example", "phone_number": "+91 98765 43217"},
    {"name": "Ironclad Auto Parts", "contact_person": "D. Singh", "email": "contact@ironcladauto.example", "phone_number": "+91 98765 43218"},
    {"name": "Evergreen FMCG Co.", "contact_person": "L. Pillai", "email": "orders@evergreenfmcg.example", "phone_number": "+91 98765 43219"},
]

# (name, category index, unit_price, base_quantity, reorder_level, stock_bias)
# stock_bias: "normal" | "low" | "out" — controls demo stock status variety
PRODUCTS = [
    ("LED Desk Lamp", 0, 12.50, 800, 100, "normal"),
    ("Bluetooth Speaker X200", 0, 34.99, 450, 80, "normal"),
    ("Wireless Mouse Pro", 0, 15.75, 60, 100, "low"),
    ("Basmati Rice 25kg Sack", 1, 28.00, 1200, 200, "normal"),
    ("Refined Sunflower Oil 15L", 1, 22.40, 900, 150, "normal"),
    ("Amul Ghee 5kg Tin", 1, 45.00, 0, 100, "out"),
    ("Herbal Shampoo 1L", 2, 6.20, 1500, 250, "normal"),
    ("Ayurvedic Soap Pack (6-bar)", 2, 4.10, 2000, 300, "normal"),
    ("Talcum Powder Jar 400g", 2, 3.30, 90, 150, "low"),
    ("Ceiling Fan 48-inch", 3, 38.00, 350, 60, "normal"),
    ("Electric Kettle 1.5L", 3, 18.90, 500, 90, "normal"),
    ("Mixer Grinder 750W", 3, 42.50, 0, 50, "out"),
    ("A4 Copier Paper Ream", 4, 5.60, 3000, 400, "normal"),
    ("Ballpoint Pen Box (50 pcs)", 4, 8.25, 1800, 250, "normal"),
    ("Whiteboard Marker Set", 4, 9.40, 120, 150, "low"),
    ("Corrugated Boxes (Medium, 25-pack)", 5, 14.00, 2500, 300, "normal"),
    ("Bubble Wrap Roll 100m", 5, 21.00, 700, 120, "normal"),
    ("Packing Tape Roll (36 pcs)", 5, 16.80, 950, 150, "normal"),
    ("Office Chair Ergonomic", 6, 89.00, 220, 40, "normal"),
    ("Steel Storage Rack", 6, 65.50, 180, 30, "normal"),
    ("Folding Table 4ft", 6, 47.20, 40, 60, "low"),
    ("Cotton T-Shirt Bulk Pack (50)", 7, 55.00, 600, 100, "normal"),
    ("Denim Fabric Roll", 7, 78.00, 300, 50, "normal"),
    ("Work Gloves Pack (20 pairs)", 7, 19.50, 850, 150, "normal"),
    ("Brake Pad Set", 8, 24.60, 400, 80, "normal"),
    ("Engine Oil Filter", 8, 7.90, 1100, 200, "normal"),
    ("Car Battery 12V", 8, 62.00, 0, 40, "out"),
    ("Yoga Mat Premium", 9, 13.40, 950, 150, "normal"),
    ("Dumbbell Set 20kg", 9, 58.00, 260, 50, "normal"),
    ("Cricket Bat Kashmir Willow", 9, 33.75, 180, 40, "normal"),
]


def get_or_create_category(name, description):
    obj = Category.query.filter_by(name=name).first()
    if obj:
        return obj
    obj = Category(name=name, description=description)
    db.session.add(obj)
    db.session.flush()
    return obj


def get_or_create_warehouse(data):
    obj = Warehouse.query.filter_by(name=data["name"]).first()
    if obj:
        return obj
    obj = Warehouse(**data)
    db.session.add(obj)
    db.session.flush()
    return obj


def get_or_create_supplier(data):
    obj = Supplier.query.filter_by(name=data["name"]).first()
    if obj:
        return obj
    obj = Supplier(**data)
    db.session.add(obj)
    db.session.flush()
    return obj


def get_or_create_product(name, category, warehouse, supplier, unit_price, quantity, reorder_level):
    obj = Product.query.filter_by(name=name).first()
    if obj:
        return obj, False
    sku = f"SKU-{uuid.uuid4().hex[:8].upper()}"
    obj = Product(
        sku=sku,
        name=name,
        description=f"{name} — demo product for {category.name}",
        category_id=category.id,
        warehouse_id=warehouse.id,
        supplier_id=supplier.id,
        unit_price=unit_price,
        quantity=quantity,
        reorder_level=reorder_level,
        status="active",
    )
    db.session.add(obj)
    db.session.flush()
    obj.qr_code_url = generate_qr_code(obj.sku, f"product_{obj.id}")
    obj.barcode_url = generate_barcode_image(obj.sku, f"product_{obj.id}")
    return obj, True


with app.app_context():
    print("Seeding categories...")
    categories = [get_or_create_category(name, desc) for name, desc in CATEGORIES]

    print("Seeding warehouses...")
    warehouses = [get_or_create_warehouse(w) for w in WAREHOUSES]

    print("Seeding suppliers...")
    suppliers = [get_or_create_supplier(s) for s in SUPPLIERS]

    db.session.commit()

    print("Seeding products (generating QR codes + barcodes)...")
    created_products = []
    for name, cat_idx, price, base_qty, reorder, bias in PRODUCTS:
        category = categories[cat_idx]
        warehouse = random.choice(warehouses)
        supplier = random.choice(suppliers)

        if bias == "out":
            quantity = 0
        elif bias == "low":
            quantity = max(1, reorder - random.randint(5, 30))
        else:
            quantity = base_qty

        product, was_created = get_or_create_product(
            name, category, warehouse, supplier, price, quantity, reorder
        )
        created_products.append(product)

    db.session.commit()
    print(f"  {len(created_products)} products present ({sum(1 for p in PRODUCTS)} in seed list).")

    print("Seeding 30 days of stock movement history for demo charts + AI predictions...")
    # Only add history if this looks like a fresh seed (no logs yet) so re-runs don't pile up duplicates.
    if InventoryLog.query.count() == 0:
        now = datetime.utcnow()
        movers = [p for p in created_products if p.quantity > 0][:12]
        for product in movers:
            daily_usage = random.randint(1, 6)
            for days_ago in range(29, -1, -1):
                if random.random() < 0.6:  # not every day has movement
                    qty_out = max(1, daily_usage + random.randint(-1, 1))
                    log_date = now - timedelta(days=days_ago, hours=random.randint(0, 23))
                    db.session.add(InventoryLog(
                        product_id=product.id,
                        warehouse_id=product.warehouse_id,
                        movement_type="out",
                        quantity=qty_out,
                        reason="Demo sale",
                        created_at=log_date,
                    ))
                if random.random() < 0.15:  # occasional restock
                    log_date = now - timedelta(days=days_ago, hours=random.randint(0, 23))
                    db.session.add(InventoryLog(
                        product_id=product.id,
                        warehouse_id=product.warehouse_id,
                        movement_type="in",
                        quantity=random.randint(20, 80),
                        reason="Demo restock",
                        created_at=log_date,
                    ))
        db.session.commit()
        print(f"  Added movement history for {len(movers)} products.")
    else:
        print("  Inventory logs already exist — skipping history seed to avoid duplicates.")

    print("Seeding sample purchase orders...")
    if PurchaseOrder.query.count() == 0:
        sample_orders = [
            ("pending", 0), ("approved", 1), ("received", 2),
        ]
        for status, idx in sample_orders:
            supplier = suppliers[idx % len(suppliers)]
            warehouse = warehouses[idx % len(warehouses)]
            product = created_products[idx * 3]
            order = PurchaseOrder(
                order_number=f"PO-{uuid.uuid4().hex[:8].upper()}",
                supplier_id=supplier.id,
                warehouse_id=warehouse.id,
                status=status,
            )
            db.session.add(order)
            db.session.flush()
            qty = 50
            db.session.add(PurchaseOrderItem(
                purchase_order_id=order.id,
                product_id=product.id,
                quantity=qty,
                unit_price=product.unit_price,
            ))
            order.total_amount = qty * float(product.unit_price)
            if status == "received":
                product.quantity = (product.quantity or 0) + qty
                db.session.add(InventoryLog(
                    product_id=product.id,
                    warehouse_id=warehouse.id,
                    movement_type="in",
                    quantity=qty,
                    reason=f"Purchase Order #{order.order_number}",
                ))
        db.session.commit()
        print(f"  Added {len(sample_orders)} sample purchase orders.")
    else:
        print("  Purchase orders already exist — skipping.")

    print("\nSeed complete:")
    print(f"  Categories: {Category.query.count()}")
    print(f"  Warehouses: {Warehouse.query.count()}")
    print(f"  Suppliers:  {Supplier.query.count()}")
    print(f"  Products:   {Product.query.count()}")
    print(f"  Purchase Orders: {PurchaseOrder.query.count()}")
    print(f"  Inventory Logs:  {InventoryLog.query.count()}")
