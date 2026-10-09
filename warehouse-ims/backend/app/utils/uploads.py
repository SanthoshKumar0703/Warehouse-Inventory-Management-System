import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def save_uploaded_image(file_storage, subfolder="products") -> str:
    """Saves an uploaded image under UPLOAD_FOLDER/<subfolder>/ with a unique
    name and returns its public URL path. Returns None if the file is missing
    or has a disallowed extension.
    """
    if not file_storage or not file_storage.filename:
        return None
    if not allowed_file(file_storage.filename):
        return None

    ext = file_storage.filename.rsplit(".", 1)[1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"

    folder = os.path.join(current_app.config["UPLOAD_FOLDER"], subfolder)
    os.makedirs(folder, exist_ok=True)

    filepath = os.path.join(folder, unique_name)
    file_storage.save(filepath)

    return f"/static/uploads/{subfolder}/{unique_name}"
