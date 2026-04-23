import tempfile
import unittest
from pathlib import Path

from app import create_app


class BiteScoutIntegrationTests(unittest.TestCase):
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
        self.temp_dir.cleanup()

    def login_demo_user(self):
        return self.client.post(
            "/api/auth/login",
            json={"email": "demo@bitescout.app", "password": "password123"},
        )

    def test_frontend_home_page_is_served(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"BiteScout", response.data)
        self.assertIn(b"Find your next favorite bite", response.data)

    def test_browse_page_is_served(self):
        response = self.client.get("/browse.html")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Find restaurants and drinks spots", response.data)

    def test_frontend_app_script_is_served(self):
        response = self.client.get("/js/app.js")

        self.assertEqual(response.status_code, 200)
        self.assertIn(b"navigator.geolocation.getCurrentPosition", response.data)

    def test_login_round_trip_sets_session(self):
        response = self.login_demo_user()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["user"]["email"], "demo@bitescout.app")

        me_response = self.client.get("/api/auth/me")
        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.get_json()["user"]["email"], "demo@bitescout.app")

    def test_favourites_can_be_saved_and_listed(self):
        self.login_demo_user()

        save_response = self.client.post("/api/favourites/restaurants/r1")
        list_response = self.client.get("/api/favourites")

        self.assertEqual(save_response.status_code, 200)
        payload = list_response.get_json()
        self.assertEqual(payload["restaurants"][0]["id"], "r1")

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
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["review"]["restaurantId"], "r1")

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
        )
        review_id = create_response.get_json()["review"]["id"]

        response = self.client.put(
            f"/api/reviews/{review_id}",
            json={"rating": "bad"},
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
        )
        review_id = create_response.get_json()["review"]["id"]
        restaurant_after_create = self.client.get("/api/restaurants/r1").get_json()
        self.assertEqual(restaurant_after_create["rating"], 3.0)

        update_response = self.client.put(
            f"/api/reviews/{review_id}",
            json={"rating": 3, "title": "Updated rating", "content": "Adjusted upward."},
        )
        self.assertEqual(update_response.status_code, 200)
        restaurant_after_update = self.client.get("/api/restaurants/r1").get_json()
        self.assertEqual(restaurant_after_update["rating"], 4.0)

        delete_response = self.client.delete(f"/api/reviews/{review_id}")
        self.assertEqual(delete_response.status_code, 200)
        restaurant_after_delete = self.client.get("/api/restaurants/r1").get_json()
        self.assertEqual(restaurant_after_delete["rating"], 5.0)


if __name__ == "__main__":
    unittest.main()
