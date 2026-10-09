import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "mysql+pymysql://root:password@localhost:3306/warehouse_ims"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-key")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ["headers"]

    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
    MAIL_APP_PASSWORD = os.getenv("MAIL_APP_PASSWORD", "")

    RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
    RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "app", "static", "uploads")
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5 MB
