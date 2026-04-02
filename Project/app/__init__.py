from pathlib import Path

from flask import Flask

from config import Config

from .extensions import db


def create_app(config_class=Config):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_class)

    # Ensure the instance folder exists for SQLite DB files.
    Path(app.instance_path).mkdir(parents=True, exist_ok=True)

    db.init_app(app)

    from .routes import bp as main_bp

    app.register_blueprint(main_bp)

    with app.app_context():
        from . import models  # noqa: F401

        db.create_all()

    return app
