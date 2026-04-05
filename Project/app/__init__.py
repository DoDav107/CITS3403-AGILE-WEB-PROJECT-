from pathlib import Path

from flask import Flask

from config import Config

from .extensions import csrf, db, login_manager


def create_app(config_class=Config):
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(config_class)

    # Ensure the instance folder exists for SQLite DB files.
    Path(app.instance_path).mkdir(parents=True, exist_ok=True)

    db.init_app(app)
    csrf.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = "auth.login_page"
    login_manager.login_message_category = "info"

    from .routes import bp as main_bp
    from .auth import bp as auth_bp

    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)

    with app.app_context():
        from . import models  # noqa: F401

        db.create_all()

    return app
