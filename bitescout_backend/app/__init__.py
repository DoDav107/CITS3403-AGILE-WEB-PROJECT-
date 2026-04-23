from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os
from pathlib import Path
from dotenv import load_dotenv


db = SQLAlchemy()


def create_app(test_config=None):
    backend_dir = Path(__file__).resolve().parents[1]
    load_dotenv(backend_dir / ".env")

    frontend_dir = Path(__file__).resolve().parents[2] / "bitescout_frontend"
    app = Flask(__name__, static_folder=str(frontend_dir), static_url_path="")
    app.config.update(
        SECRET_KEY="dev-change-me",
        SQLALCHEMY_DATABASE_URI=f"sqlite:///{Path(app.instance_path) / 'bitescout.db'}",
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        JSON_SORT_KEYS=False,
        GOOGLE_MAPS_API_KEY=(os.getenv("GOOGLE_MAPS_API_KEY") or "").strip(),
    )

    if test_config:
        app.config.update(test_config)

    Path(app.instance_path).mkdir(parents=True, exist_ok=True)

    db.init_app(app)

    from . import models  # noqa: F401
    from .routes import bp

    app.register_blueprint(bp)

    with app.app_context():
        db.create_all()
        from .seed import seed_if_empty
        seed_if_empty()

    return app
