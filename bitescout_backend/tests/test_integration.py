import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from app import create_app


class BiteScoutIntegrationTests(unittest.TestCase):
    def test_app_can_be_created(self):
        temp_dir = tempfile.TemporaryDirectory()
        try:
            app = create_app(
                {
                    "TESTING": True,
                    "SQLALCHEMY_DATABASE_URI": f"sqlite:///{Path(temp_dir.name) / 'test.db'}",
                    "SECRET_KEY": "test-secret",
                    "WTF_CSRF_ENABLED": False,
                }
            )

            self.assertTrue(app.testing)
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
                        "WTF_CSRF_ENABLED": False,
                    }
                )

            self.assertEqual(app.config["GOOGLE_MAPS_API_KEY"], "test-google-key")
        finally:
            temp_dir.cleanup()

    def test_secret_key_is_loaded_from_environment(self):
        temp_dir = tempfile.TemporaryDirectory()
        try:
            with patch.dict("os.environ", {"SECRET_KEY": "env-secret-key"}):
                app = create_app(
                    {
                        "TESTING": True,
                        "SQLALCHEMY_DATABASE_URI": f"sqlite:///{Path(temp_dir.name) / 'test.db'}",
                    }
                )

            self.assertEqual(app.config["SECRET_KEY"], "env-secret-key")
        finally:
            temp_dir.cleanup()

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.app = create_app(
            {
                "TESTING": True,
                "SQLALCHEMY_DATABASE_URI": f"sqlite:///{Path(self.temp_dir.name) / 'test.db'}",
                "SECRET_KEY": "test-secret",
                "WTF_CSRF_ENABLED": False,
            }
        )
        self.client = self.app.test_client()

    def tearDown(self):
        from app import db
        with self.app.app_context():
            db.session.remove()
            db.engine.dispose()
        self.temp_dir.cleanup()

    def csrf_headers(self):
        response = self.client.get("/api/csrf-token")
        self.assertEqual(response.status_code, 200)
        token = response.get_json()["csrfToken"]
        return {"X-CSRFToken": token}

    def login_demo_user(self):
        return self.client.post(
            "/api/auth/login",
            json={"email": "demo@bitescout.app", "password": "password123"},
            headers=self.csrf_headers(),
        )

    def test_csrf_token_endpoint_sets_session_token(self):
        response = self.client.get("/api/csrf-token")

        self.assertEqual(response.status_code, 200)
        token = response.get_json()["csrfToken"]
        self.assertIsInstance(token, str)
        self.assertGreaterEqual(len(token), 32)

    def test_mutating_request_without_csrf_token_is_rejected(self):
        response = self.client.post(
            "/api/auth/login",
            json={"email": "demo@bitescout.app", "password": "password123"},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["error"], "Invalid CSRF token.")

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

        response = self.client.put(
            "/api/users/me",
            json={
                "bio": "Updated bio from the profile page.",
                "preferredCuisine": "Thai",
                "avatarUrl": "preset:avatar-curry",
            },
            headers=self.csrf_headers(),
        )

        self.assertEqual(response.status_code, 200)
        user = response.get_json()["user"]
        self.assertEqual(user["bio"], "Updated bio from the profile page.")
        self.assertEqual(user["preferredCuisine"], "Thai")
        self.assertEqual(user["avatarUrl"], "preset:avatar-curry")

    def test_profile_rejects_invalid_avatar_url(self):
        self.login_demo_user()

        response = self.client.put(
            "/api/users/me",
            json={"avatarUrl": "javascript:alert(1)"},
            headers=self.csrf_headers(),
        )

        self.assertEqual(response.status_code, 400)

    def test_missing_place_request_can_be_created_and_listed(self):
        create_response = self.client.post(
            "/api/missing-place-requests",
            json={
                "placeName": "Test Dumpling House",
                "details": "Northbridge, dumplings, suggested by a user.",
            },
            headers=self.csrf_headers(),
        )
        list_response = self.client.get("/api/missing-place-requests")

        self.assertEqual(create_response.status_code, 201)
        payload = list_response.get_json()
        self.assertEqual(payload[0]["placeName"], "Test Dumpling House")
        self.assertIn("Northbridge", payload[0]["details"])

    def test_favourites_can_be_saved_and_listed(self):
        self.login_demo_user()

        save_response = self.client.post("/api/favourites/restaurants/r1", headers=self.csrf_headers())
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
        response = self.client.post(
            "/api/restaurants/from-google",
            json={
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
            headers=self.csrf_headers(),
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

        response = self.client.post(
            "/api/reviews",
            json={
                "restaurantId": "r1",
                "dishId": "d1",
                "rating": 5,
                "title": "Great bowl",
                "content": "Would order again.",
            },
            headers=self.csrf_headers(),
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["review"]["restaurantId"], "r1")
        self.assertEqual(response.get_json()["review"]["dishId"], "")

    def test_invalid_review_rating_is_rejected_on_create(self):
        self.login_demo_user()

        response = self.client.post(
            "/api/reviews",
            json={
                "restaurantId": "r1",
                "dishId": "d1",
                "rating": "bad",
                "title": "Bad input",
                "content": "Should be rejected.",
            },
            headers=self.csrf_headers(),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["error"], "Rating must be an integer between 1 and 5.")

    def test_invalid_review_rating_is_rejected_on_update(self):
        self.login_demo_user()
        create_response = self.client.post(
            "/api/reviews",
            json={
                "restaurantId": "r1",
                "dishId": "d1",
                "rating": 4,
                "title": "Editable review",
                "content": "Created for update validation.",
            },
            headers=self.csrf_headers(),
        )
        review_id = create_response.get_json()["review"]["id"]

        response = self.client.put(
            f"/api/reviews/{review_id}",
            json={"rating": "bad"},
            headers=self.csrf_headers(),
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["error"], "Rating must be an integer between 1 and 5.")

    def test_restaurant_rating_is_synchronized_after_review_changes(self):
        self.login_demo_user()

        create_response = self.client.post(
            "/api/reviews",
            json={
                "restaurantId": "r1",
                "dishId": "d1",
                "rating": 1,
                "title": "Low rating",
                "content": "Forcing a rating recalculation.",
            },
            headers=self.csrf_headers(),
        )
        review_id = create_response.get_json()["review"]["id"]
        restaurant_after_create = self.client.get("/api/restaurants/r1").get_json()
        self.assertEqual(restaurant_after_create["rating"], 3.0)

        update_response = self.client.put(
            f"/api/reviews/{review_id}",
            json={"rating": 3, "title": "Updated rating", "content": "Adjusted upward."},
            headers=self.csrf_headers(),
        )
        self.assertEqual(update_response.status_code, 200)
        restaurant_after_update = self.client.get("/api/restaurants/r1").get_json()
        self.assertEqual(restaurant_after_update["rating"], 4.0)

        delete_response = self.client.delete(f"/api/reviews/{review_id}", headers=self.csrf_headers())
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
            response = self.client.post(
                "/api/google/nearby",
                json={"lat": -31.95, "lng": 115.86, "radius": 8000, "includedTypes": ["cafe"]},
                headers=self.csrf_headers(),
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


class CSRFProtectionTests(unittest.TestCase):
    """Tests that verify CSRF protection is enforced when enabled."""

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.app = create_app(
            {
                "TESTING": True,
                "SQLALCHEMY_DATABASE_URI": f"sqlite:///{Path(self.temp_dir.name) / 'test.db'}",
                "SECRET_KEY": "test-secret",
                "WTF_CSRF_ENABLED": True,
            }
        )
        self.client = self.app.test_client()

    def tearDown(self):
        from app import db
        with self.app.app_context():
            db.session.remove()
            db.engine.dispose()
        self.temp_dir.cleanup()

    def test_post_without_csrf_token_is_rejected(self):
        """State-changing requests without a CSRF token should return 400."""
        response = self.client.post(
            "/api/auth/login",
            json={"email": "demo@bitescout.app", "password": "password123"},
        )
        self.assertEqual(response.status_code, 400)

    def test_post_with_valid_csrf_token_succeeds(self):
        """State-changing requests with a valid CSRF token should be accepted."""
        token_response = self.client.get("/api/csrf-token")
        csrf_token = token_response.get_json()["csrfToken"]

        response = self.client.post(
            "/api/auth/login",
            json={"email": "demo@bitescout.app", "password": "password123"},
            headers={"X-CSRFToken": csrf_token},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["user"]["email"], "demo@bitescout.app")


if __name__ == "__main__":
    unittest.main()
