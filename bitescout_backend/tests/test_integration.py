import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from app import create_app, db
from werkzeug.security import check_password_hash


class BiteScoutIntegrationTests(unittest.TestCase):
    def test_app_can_be_created(self):
        temp_dir = tempfile.TemporaryDirectory()
        try:
            app = create_app(
                {
                    "TESTING": True,
                    "SQLALCHEMY_DATABASE_URI": f"sqlite:///{Path(temp_dir.name) / 'test.db'}",
                    "SECRET_KEY": "test-secret",
                }
            )

            self.assertTrue(app.testing)
            with app.app_context():
                db.session.remove()
                db.engine.dispose()
        finally:
            temp_dir.cleanup()

    def test_google_maps_api_key_is_loaded_from_environment(self):
        temp_dir = tempfile.TemporaryDirectory()
        try:
            with patch.dict("os.environ", {"GOOGLE_MAPS_API_KEY": "test-google-key"}):
                app = create_app(
                    {
                        "TESTING": True,
                        "SQLALCHEMY_DATABASE_URI": f"sqlite:///{Path(temp_dir.name) / 'test.db'}",
                        "SECRET_KEY": "test-secret",
                    }
                )

            self.assertEqual(app.config["GOOGLE_MAPS_API_KEY"], "test-google-key")
            with app.app_context():
                db.session.remove()
                db.engine.dispose()
        finally:
            temp_dir.cleanup()

    def test_secret_key_database_url_and_gemini_key_are_loaded_from_environment(self):
        temp_dir = tempfile.TemporaryDirectory()
        try:
            database_path = Path(temp_dir.name) / "env-config.db"
            with patch.dict(
                "os.environ",
                {
                    "SECRET_KEY": "env-secret-key",
                    "DATABASE_URL": f"sqlite:///{database_path}",
                    "GEMINI_API_KEY": "test-gemini-key",
                },
            ):
                app = create_app({"TESTING": True})

            self.assertEqual(app.config["SECRET_KEY"], "env-secret-key")
            self.assertEqual(app.config["SQLALCHEMY_DATABASE_URI"], f"sqlite:///{database_path}")
            self.assertEqual(app.config["GEMINI_API_KEY"], "test-gemini-key")
        finally:
            temp_dir.cleanup()

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.app = create_app(
            {
                "TESTING": True,
                "SQLALCHEMY_DATABASE_URI": f"sqlite:///{Path(self.temp_dir.name) / 'test.db'}",
                "SECRET_KEY": "test-secret",
            }
        )
        self.client = self.app.test_client()

    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.engine.dispose()
        self.temp_dir.cleanup()

    def login_demo_user(self):
        return self.client.post(
            "/api/auth/login",
            headers=self.csrf_headers(),
            json={"email": "demo@bitescout.app", "password": "password123"},
        )

    def csrf_headers(self):
        response = self.client.get("/api/csrf-token")
        self.assertEqual(response.status_code, 200)
        token = response.get_json()["csrfToken"]
        return {"X-CSRFToken": token}

    def post_json(self, path, payload=None):
        return self.client.post(path, headers=self.csrf_headers(), json=payload or {})

    def put_json(self, path, payload=None):
        return self.client.put(path, headers=self.csrf_headers(), json=payload or {})

    def delete_json(self, path):
        return self.client.delete(path, headers=self.csrf_headers())

    def test_csrf_token_endpoint_returns_session_token(self):
        response = self.client.get("/api/csrf-token")

        self.assertEqual(response.status_code, 200)
        token = response.get_json()["csrfToken"]
        self.assertIsInstance(token, str)
        self.assertGreaterEqual(len(token), 32)

    def test_csrf_token_is_required_for_state_changing_requests(self):
        response = self.client.post(
            "/api/missing-place-requests",
            json={"placeName": "Tokenless Test"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["error"], "CSRF token is missing or invalid.")

    def test_signup_stores_salted_password_hash(self):
        response = self.client.post(
            "/api/auth/signup",
            headers=self.csrf_headers(),
            json={
                "name": "Salted User",
                "username": "salteduser",
                "email": "salted@example.com",
                "confirmEmail": "salted@example.com",
                "password": "Password123",
            },
        )

        self.assertEqual(response.status_code, 201)
        from app.models import User

        with self.app.app_context():
            user = User.query.filter_by(email="salted@example.com").first()
            demo_user = User.query.filter_by(email="demo@bitescout.app").first()
            self.assertIsNotNone(user)
            self.assertNotEqual(user.password_hash, "Password123")
            self.assertTrue(check_password_hash(user.password_hash, "Password123"))
            self.assertNotEqual(user.password_hash, demo_user.password_hash)

    def test_frontend_home_page_is_served(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"BiteScout", response.data)
        self.assertIn(b"Find your next favorite bite", response.data)

    def test_browse_page_is_served(self):
        response = self.client.get("/browse.html")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Restaurants near you", response.data)
        self.assertIn(b'id="locationInput"', response.data)
        self.assertNotIn(b"Use current location", response.data)
        self.assertIn(b'<option value="3">\xe2\x98\x85\xe2\x98\x85\xe2\x98\x85\xe2\x98\x86\xe2\x98\x86</option>', response.data)
        self.assertNotIn(b"and up", response.data)

    def test_frontend_app_script_is_served(self):
        response = self.client.get("/js/app.js")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"navigator.geolocation.getCurrentPosition", response.data)

    def test_places_request_page_is_served(self):
        response = self.client.get("/places-request.html")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Missing Place Requests", response.data)

    def test_login_round_trip_sets_session(self):
        response = self.login_demo_user()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["user"]["email"], "demo@bitescout.app")
        self.assertEqual(response.get_json()["user"]["avatarUrl"], "preset:avatar-sushi")

        me_response = self.client.get("/api/auth/me")
        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.get_json()["user"]["email"], "demo@bitescout.app")

    def test_profile_can_be_updated(self):
        self.login_demo_user()

        response = self.put_json(
            "/api/users/me",
            {
                "bio": "Updated bio from the profile page.",
                "preferredCuisine": "Thai",
                "avatarUrl": "preset:avatar-curry",
            },
        )

        self.assertEqual(response.status_code, 200)
        user = response.get_json()["user"]
        self.assertEqual(user["bio"], "Updated bio from the profile page.")
        self.assertEqual(user["preferredCuisine"], "Thai")
        self.assertEqual(user["avatarUrl"], "preset:avatar-curry")

    def test_profile_rejects_invalid_avatar_url(self):
        self.login_demo_user()

        response = self.put_json(
            "/api/users/me",
            {"avatarUrl": "javascript:alert(1)"},
        )

        self.assertEqual(response.status_code, 400)

    def test_missing_place_request_can_be_created_and_listed(self):
        create_response = self.post_json(
            "/api/missing-place-requests",
            {
                "placeName": "Test Dumpling House",
                "details": "Northbridge, dumplings, suggested by a user.",
            },
        )
        list_response = self.client.get("/api/missing-place-requests")

        self.assertEqual(create_response.status_code, 201)
        payload = list_response.get_json()
        self.assertEqual(payload[0]["placeName"], "Test Dumpling House")
        self.assertIn("Northbridge", payload[0]["details"])

    def test_favourites_can_be_saved_and_listed(self):
        self.login_demo_user()

        save_response = self.post_json("/api/favourites/restaurants/r1")
        list_response = self.client.get("/api/favourites")

        self.assertEqual(save_response.status_code, 200)
        payload = list_response.get_json()
        self.assertEqual(payload["restaurants"][0]["id"], "r1")

    def test_restaurants_can_be_filtered_by_tag(self):
        response = self.client.get("/api/restaurants?tag=sushi")

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual([restaurant["id"] for restaurant in payload], ["r3"])

    def test_google_place_can_be_mirrored_as_local_restaurant(self):
        response = self.post_json(
            "/api/restaurants/from-google",
            {
                "placeId": "places/google-ramen-1",
                "name": "Northbridge Ramen Lab",
                "address": "99 Roe St, Northbridge WA",
                "lat": -31.9471,
                "lng": 115.8599,
                "rating": 4.7,
                "primaryType": "japanese_restaurant",
                "types": ["restaurant", "food", "ramen_restaurant"],
                "photoName": "places/google-ramen-1/photos/photo-123",
                "websiteUri": "https://ramen.example.com",
                "googleMapsUri": "https://maps.google.com/?cid=123",
            },
        )

        self.assertEqual(response.status_code, 201)
        restaurant = response.get_json()["restaurant"]
        self.assertEqual(restaurant["name"], "Northbridge Ramen Lab")
        self.assertEqual(restaurant["cuisine"], "Japanese Restaurant")
        self.assertIn("ramen_restaurant", restaurant["tags"])
        self.assertEqual(restaurant["photoName"], "places/google-ramen-1/photos/photo-123")
        self.assertEqual(restaurant["websiteUri"], "https://ramen.example.com")

        detail_response = self.client.get(f"/api/restaurants/{restaurant['id']}")
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.get_json()["address"], "99 Roe St, Northbridge WA")
        self.assertEqual(detail_response.get_json()["photoName"], "places/google-ramen-1/photos/photo-123")
        self.assertEqual(detail_response.get_json()["websiteUri"], "https://ramen.example.com")

    def test_review_can_be_created(self):
        self.login_demo_user()

        response = self.post_json(
            "/api/reviews",
            {
                "restaurantId": "r1",
                "dishId": "d1",
                "rating": 5,
                "title": "Great bowl",
                "content": "Would order again.",
            },
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["review"]["restaurantId"], "r1")
        self.assertEqual(response.get_json()["review"]["dishId"], "")

    def test_invalid_review_rating_is_rejected_on_create(self):
        self.login_demo_user()

        response = self.post_json(
            "/api/reviews",
            {
                "restaurantId": "r1",
                "dishId": "d1",
                "rating": "bad",
                "title": "Bad input",
                "content": "Should be rejected.",
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["error"], "Rating must be an integer between 1 and 5.")

    def test_invalid_review_rating_is_rejected_on_update(self):
        self.login_demo_user()
        create_response = self.post_json(
            "/api/reviews",
            {
                "restaurantId": "r1",
                "dishId": "d1",
                "rating": 4,
                "title": "Editable review",
                "content": "Created for update validation.",
            },
        )
        review_id = create_response.get_json()["review"]["id"]

        response = self.put_json(
            f"/api/reviews/{review_id}",
            {"rating": "bad"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["error"], "Rating must be an integer between 1 and 5.")

    def test_restaurant_rating_is_synchronized_after_review_changes(self):
        self.login_demo_user()

        create_response = self.post_json(
            "/api/reviews",
            {
                "restaurantId": "r1",
                "dishId": "d1",
                "rating": 1,
                "title": "Low rating",
                "content": "Forcing a rating recalculation.",
            },
        )
        review_id = create_response.get_json()["review"]["id"]
        restaurant_after_create = self.client.get("/api/restaurants/r1").get_json()
        self.assertEqual(restaurant_after_create["rating"], 3.0)

        update_response = self.put_json(
            f"/api/reviews/{review_id}",
            {"rating": 3, "title": "Updated rating", "content": "Adjusted upward."},
        )
        self.assertEqual(update_response.status_code, 200)
        restaurant_after_update = self.client.get("/api/restaurants/r1").get_json()
        self.assertEqual(restaurant_after_update["rating"], 4.0)

        delete_response = self.delete_json(f"/api/reviews/{review_id}")
        self.assertEqual(delete_response.status_code, 200)
        restaurant_after_delete = self.client.get("/api/restaurants/r1").get_json()
        self.assertEqual(restaurant_after_delete["rating"], 5.0)

    def test_google_nearby_returns_results(self):
        self.app.config["GOOGLE_MAPS_API_KEY"] = "test-google-key"
        google_response = Mock()
        google_response.ok = True
        google_response.json.return_value = {
            "places": [
                {
                    "id": "place-1",
                    "displayName": {"text": "Test Cafe"},
                    "formattedAddress": "123 Test St",
                    "location": {"latitude": -31.95, "longitude": 115.86},
                    "rating": 4.5,
                    "primaryType": "cafe",
                    "types": ["cafe", "food"],
                    "websiteUri": "https://test-cafe.example.com",
                    "googleMapsUri": "https://maps.google.com/?cid=456",
                    "photos": [
                        {
                            "name": "places/place-1/photos/photo-1",
                            "authorAttributions": [{"displayName": "Test photographer"}],
                        }
                    ],
                }
            ]
        }

        with patch("app.google_places.requests.post", return_value=google_response):
            response = self.post_json(
                "/api/google/nearby",
                {"lat": -31.95, "lng": 115.86, "radius": 8000, "includedTypes": ["cafe"]},
            )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["results"][0]["name"], "Test Cafe")
        self.assertEqual(payload["results"][0]["photoName"], "places/place-1/photos/photo-1")
        self.assertEqual(payload["results"][0]["websiteUri"], "https://test-cafe.example.com")

    def test_google_photo_redirects_to_photo_uri(self):
        self.app.config["GOOGLE_MAPS_API_KEY"] = "test-google-key"
        google_response = Mock()
        google_response.ok = True
        google_response.json.return_value = {"photoUri": "https://lh3.googleusercontent.com/test-photo"}

        with patch("app.google_places.requests.get", return_value=google_response):
            response = self.client.get("/api/google/photo?name=places/place-1/photos/photo-1")

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response.headers["Location"], "https://lh3.googleusercontent.com/test-photo")


if __name__ == "__main__":
    unittest.main()
