import os

from bitescout_backend.app import create_app, db


app = create_app()


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=False, port=int(os.getenv("PORT", "5001")), use_reloader=False)
