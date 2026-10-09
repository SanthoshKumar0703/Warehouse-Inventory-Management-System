import os
import qrcode
import barcode
from barcode.writer import ImageWriter
from flask import current_app


def _ensure_dir(subfolder: str) -> str:
    path = os.path.join(current_app.config["UPLOAD_FOLDER"], subfolder)
    os.makedirs(path, exist_ok=True)
    return path


def generate_qr_code(data: str, filename: str) -> str:
    """Generates a QR code PNG and returns its public URL path (/static/uploads/...)."""
    folder = _ensure_dir("qrcodes")
    filepath = os.path.join(folder, f"{filename}.png")

    img = qrcode.make(data)
    img.save(filepath)

    return f"/static/uploads/qrcodes/{filename}.png"


def generate_barcode_image(data: str, filename: str) -> str:
    """Generates a Code128 barcode PNG and returns its public URL path."""
    folder = _ensure_dir("barcodes")
    filepath_no_ext = os.path.join(folder, filename)

    code128 = barcode.get_barcode_class("code128")
    barcode_obj = code128(data, writer=ImageWriter())
    barcode_obj.save(filepath_no_ext, options={"write_text": True, "module_height": 8})

    return f"/static/uploads/barcodes/{filename}.png"
