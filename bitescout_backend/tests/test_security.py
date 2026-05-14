import tempfile
import unittest
from pathlib import Path

from werkzeug.security import check_password_hash

from bitescout_backend.app import create_app, db
from bitescout_backend.app.models import Restaurant, User


class SecurityTestCase(unittest.TestCase):
    def setUp(self):
        self.instance_dir = tempfile.TemporaryDirectory()
        self.app = create_app(
            {
                "TESTING": True,
                "SECRET_KEY": "test-secret",
                "SQLALCHEMY_DATABASE_URI": f"sqlite:///{Path(self.instance_dir.name) / 'test.db'}",
                "WTF_CSRF_ENABLED": True,
            }
        )
        self.client = self.app.test_client()
        with self.app.app_context():
            db.create_all()
            db.session.add(
                Restaurant(
                    id="r1",
                    name="Bite Cafe",
                    suburb="Perth",
                    cuisine="Cafe",
                    price="$",
                    rating=4.0,
                    lat=-31.95,
                    lng=115.86,
                    blurb="A friendly cafe.",
                    address="1 Test Street",
                    tags="coffee,brunch",
                )
            )
            db.session.commit()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
        self.instance_dir.cleanup()

    def csrf_headers(self):
        response = self.client.get("/api/csrf-token")
        self.assertEqual(response.status_code, 200)
        token = response.get_json()["csrfToken"]
        return {"X-CSRFToken": token}

    def test_signup_stores_salted_password_hash_and_login_still_works(self):
        payload = {
            "name": "Test User",
            "username": "testuser",
            "email": "test@example.com",
            "password": "Password123!",
        }
        response = self.client.post("/api/auth/signup", json=payload, headers=self.csrf_headers())

        self.assertEqual(response.status_code, 201)
        with self.app.app_context():
            user = User.query.filter_by(email="test@example.com").first()
            self.assertIsNotNone(user)
            self.assertNotEqual(user.password_hash, payload["password"])
            self.assertTrue(check_password_hash(user.password_hash, payload["password"]))

            second_user = User(
                name="Other User",
                username="otheruser",
                email="other@example.com",
            )
            second_user.set_password(payload["password"])
            self.assertNotEqual(user.password_hash, second_user.password_hash)

        self.client.post("/api/auth/logout", headers=self.csrf_headers())
        login = self.client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "Password123!"},
            headers=self.csrf_headers(),
        )
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.get_json()["user"]["email"], "test@example.com")

    def test_unsafe_requests_require_valid_csrf_token(self):
        blocked = self.client.post(
            "/api/auth/signup",
            json={
                "name": "No Token",
                "username": "notoken",
                "email": "notoken@example.com",
                "password": "Password123!",
            },
        )
        self.assertEqual(blocked.status_code, 400)
        self.assertEqual(blocked.get_json()["error"], "Invalid CSRF token")

    def test_environment_configuration_comes_from_env_style_config(self):
        app = create_app(
            {
                "TESTING": True,
                "SECRET_KEY": "configured-secret",
                "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
                "GOOGLE_MAPS_API_KEY": "configured-google-key",
            }
        )

        self.assertEqual(app.config["SECRET_KEY"], "configured-secret")
        self.assertEqual(app.config["SQLALCHEMY_DATABASE_URI"], "sqlite:///:memory:")
        self.assertEqual(app.config["GOOGLE_MAPS_API_KEY"], "configured-google-key")


if __name__ == "__main__":
    unittest.main()
