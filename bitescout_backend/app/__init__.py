from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from pathlib import Path


db = SQLAlchemy()


def create_app(test_config=None):
    app = Flask(__name__, static_folder="static", static_url_path="/static")
    app.config.update(
        SECRET_KEY="dev-change-me",
        SQLALCHEMY_DATABASE_URI=f"sqlite:///{Path(app.instance_path) / 'bitescout.db'}",
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        JSON_SORT_KEYS=False,
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
