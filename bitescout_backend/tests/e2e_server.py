"""
Standalone Flask process for Selenium end-to-end tests.

Started via subprocess so the live server does not share the global SQLAlchemy
instance with other tests running in the same interpreter.
"""
import os
import sys

BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app import create_app  # noqa: E402


def main() -> None:
    port = int(os.environ["BITESCOUT_E2E_PORT"])
    db_uri = os.environ["BITESCOUT_E2E_DB_URI"]
    app = create_app(
        {
            "SQLALCHEMY_DATABASE_URI": db_uri,
            "SECRET_KEY": "e2e-secret-key",
            "TESTING": True,
        }
    )
    app.run(host="127.0.0.1", port=port, use_reloader=False, threaded=False)


if __name__ == "__main__":
    main()
