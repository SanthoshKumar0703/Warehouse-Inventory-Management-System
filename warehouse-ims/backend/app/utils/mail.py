import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import current_app


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Send an email via Gmail SMTP using MAIL_USERNAME / MAIL_APP_PASSWORD from .env.

    Returns True on success, False on failure (never raises — callers decide
    whether a failed send should block the request).
    """
    username = current_app.config.get("MAIL_USERNAME")
    app_password = current_app.config.get("MAIL_APP_PASSWORD")

    if not username or not app_password:
        current_app.logger.warning(
            "MAIL_USERNAME / MAIL_APP_PASSWORD not set — skipping email send. "
            "Set them in .env to enable OTP emails."
        )
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"WareFlow <{username}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(username, app_password)
            server.sendmail(username, to_email, msg.as_string())
        return True
    except Exception as exc:  # noqa: BLE001 — log and degrade gracefully
        current_app.logger.error(f"Failed to send email to {to_email}: {exc}")
        return False


def otp_email_html(otp_code: str) -> str:
    return f"""
    <div style="font-family: Arial, sans-serif; background:#1A1A1A; padding:32px; color:#F5F5F5;">
      <div style="max-width:420px; margin:0 auto; background:#252525; border-radius:16px; padding:32px; border:1px solid rgba(184,115,51,0.3);">
        <h2 style="color:#B87333; margin-top:0;">WareFlow Password Reset</h2>
        <p>Use the code below to reset your password. This code expires in 10 minutes.</p>
        <div style="font-size:32px; font-weight:700; letter-spacing:8px; text-align:center; color:#F5F5F5; background:#1F1F1F; padding:16px; border-radius:12px; margin:24px 0;">
          {otp_code}
        </div>
        <p style="color:#A3A3A3; font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    </div>
    """


def password_changed_email_html() -> str:
    return """
    <div style="font-family: Arial, sans-serif; background:#1A1A1A; padding:32px; color:#F5F5F5;">
      <div style="max-width:420px; margin:0 auto; background:#252525; border-radius:16px; padding:32px; border:1px solid rgba(184,115,51,0.3);">
        <h2 style="color:#B87333; margin-top:0;">Password Changed Successfully</h2>
        <p>Your WareFlow account password was just changed. If this wasn't you, please contact your administrator immediately.</p>
      </div>
    </div>
    """
