import os
from pathlib import Path


def _env_value(name, default=""):
    return (os.getenv(name) or default).strip()


class Config:
    def __init__(self, instance_path):
        self.instance_path = Path(instance_path)

    def as_dict(self):
        return {
            "SECRET_KEY": _env_value("SECRET_KEY", "dev-change-me"),
            "SQLALCHEMY_DATABASE_URI": _env_value(
                "DATABASE_URL",
                f"sqlite:///{self.instance_path / 'bitescout.db'}",
            ),
            "SQLALCHEMY_TRACK_MODIFICATIONS": False,
            "JSON_SORT_KEYS": False,
            "GOOGLE_MAPS_API_KEY": _env_value("GOOGLE_MAPS_API_KEY"),
            "GEMINI_API_KEY": _env_value("GEMINI_API_KEY"),
            "CSRF_PROTECT": True,
        }
