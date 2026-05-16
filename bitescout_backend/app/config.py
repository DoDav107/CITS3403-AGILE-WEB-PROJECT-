import os
import secrets
from pathlib import Path


def _env_value(name, default=""):
    return (os.getenv(name) or default).strip()


def _secret_key():
    return _env_value("SECRET_KEY") or _env_value("FLASK_SECRET_KEY") or secrets.token_urlsafe(32)


class Config:
    def __init__(self, instance_path):
        self.instance_path = Path(instance_path)

    def as_dict(self):
        return {
            "SECRET_KEY": _secret_key(),
            "SQLALCHEMY_DATABASE_URI": _env_value(
                "DATABASE_URL",
                f"sqlite:///{self.instance_path / 'bitescout.db'}",
            ),
            "SQLALCHEMY_TRACK_MODIFICATIONS": False,
            "JSON_SORT_KEYS": False,
            "SESSION_COOKIE_HTTPONLY": True,
            "SESSION_COOKIE_SAMESITE": "Lax",
            "GOOGLE_MAPS_API_KEY": _env_value("GOOGLE_MAPS_API_KEY"),
            "GEMINI_API_KEY": _env_value("GEMINI_API_KEY"),
            "CSRF_PROTECT": True,
            "PASSWORD_RESET_TOKEN_IN_RESPONSE": False,
        }
