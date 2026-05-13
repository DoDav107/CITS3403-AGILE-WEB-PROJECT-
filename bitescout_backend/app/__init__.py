from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFProtect
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import inspect, text


db = SQLAlchemy()
csrf = CSRFProtect()





def ensure_user_profile_columns():
    inspector = inspect(db.engine)
    if "user" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("user")}
    if "avatar_url" not in columns:
        db.session.execute(text('ALTER TABLE "user" ADD COLUMN avatar_url TEXT DEFAULT ""'))
        db.session.commit()


def ensure_restaurant_photo_columns():
    inspector = inspect(db.engine)
    if "restaurant" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("restaurant")}
    columns_to_add = {
        "photo_name": 'ALTER TABLE "restaurant" ADD COLUMN photo_name TEXT DEFAULT ""',
        "website_uri": 'ALTER TABLE "restaurant" ADD COLUMN website_uri TEXT DEFAULT ""',
        "google_maps_uri": 'ALTER TABLE "restaurant" ADD COLUMN google_maps_uri TEXT DEFAULT ""',
    }
    for column_name, statement in columns_to_add.items():
        if column_name not in columns:
            db.session.execute(text(statement))
    db.session.commit()


def create_app(test_config=None):
    backend_dir = Path(__file__).resolve().parents[1]
    load_dotenv(backend_dir / ".env")

    frontend_dir = Path(__file__).resolve().parents[2] / "bitescout_frontend"
    app = Flask(
        __name__,
        static_folder=str(frontend_dir),
        static_url_path="",
        template_folder=str(frontend_dir),
    )
    app.config.update(
        SECRET_KEY=os.getenv("SECRET_KEY", "dev-change-me"),
        SQLALCHEMY_DATABASE_URI=f"sqlite:///{Path(app.instance_path) / 'bitescout.db'}",
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        JSON_SORT_KEYS=False,
        GOOGLE_MAPS_API_KEY=(os.getenv("GOOGLE_MAPS_API_KEY") or "").strip(),
        WTF_CSRF_TIME_LIMIT=3600,
    )

    if test_config:
        app.config.update(test_config)

    Path(app.instance_path).mkdir(parents=True, exist_ok=True)

    db.init_app(app)
    csrf.init_app(app)

    from . import models  # noqa: F401
    from .routes import bp

    app.register_blueprint(bp)

    with app.app_context():
        db.create_all()
        ensure_user_profile_columns()
        ensure_restaurant_photo_columns()
        from .seed import seed_if_empty
        seed_if_empty()

    return app
