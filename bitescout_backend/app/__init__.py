from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import inspect, text
from .config import Config


db = SQLAlchemy()


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
    app = Flask(__name__, static_folder=str(frontend_dir), static_url_path="")
    app.config.update(Config(app.instance_path).as_dict())

    if test_config:
        app.config.update(test_config)

    Path(app.instance_path).mkdir(parents=True, exist_ok=True)

    db.init_app(app)

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
