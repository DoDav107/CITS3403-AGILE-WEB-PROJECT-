from pathlib import Path

from flask import Flask, send_from_directory
from flask_sqlalchemy import SQLAlchemy

from .config import Config, load_dotenv_file


db = SQLAlchemy()


def create_app(config=None):
    load_dotenv_file()

    app = Flask(
        __name__,
        instance_relative_config=True,
        static_folder="../../bitescout_frontend",
        static_url_path="",
    )
    app.config.from_object(Config)
    if config:
        app.config.update(config)

    Path(app.instance_path).mkdir(parents=True, exist_ok=True)
    db.init_app(app)

    from .routes import bp, require_csrf

    app.before_request(require_csrf)
    app.register_blueprint(bp)

    @app.get("/")
    def frontend_index():
        return send_from_directory(app.static_folder, "index.html")

    @app.get("/<path:filename>")
    def frontend_files(filename):
        if filename.startswith("api/"):
            return {"error": "Not found"}, 404
        return send_from_directory(app.static_folder, filename)

    with app.app_context():
        from . import models  # noqa: F401

    return app
