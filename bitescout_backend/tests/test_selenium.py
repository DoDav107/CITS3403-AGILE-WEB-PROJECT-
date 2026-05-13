"""
Selenium end-to-end tests for BiteScout.
Requires a live server running at http://127.0.0.1:5000
Run with: python -m pytest tests/test_selenium.py -v
"""

import unittest
import uuid

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://127.0.0.1:5000"
WAIT_SECONDS = 10


class SeleniumTests(unittest.TestCase):
    """Selenium tests that run against a live BiteScout server."""

    def setUp(self):
        options = webdriver.ChromeOptions()
        options.add_argument("--headless=new")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1280,1024")
        options.add_argument("--no-sandbox")
        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, WAIT_SECONDS)

    def tearDown(self):
        self.driver.quit()

    # ─── Helpers ──────────────────────────────────────────────

    def _login_demo_user(self):
        """Log in as the seeded demo user."""
        self.driver.get(f"{BASE_URL}/login.html")
        email = self.wait.until(EC.presence_of_element_located((By.ID, "loginEmail")))
        email.clear()
        email.send_keys("demo@bitescout.app")
        password = self.driver.find_element(By.ID, "loginPassword")
        password.clear()
        password.send_keys("password123")
        self.driver.find_element(By.CSS_SELECTOR, "#loginForm button[type='submit']").click()
        # Wait until we are redirected away from login page
        self.wait.until(lambda d: "/login.html" not in d.current_url)

    # ─── Test 1: Homepage loads and contains key elements ─────

    def test_homepage_loads_with_hero(self):
        """The homepage should render and contain the hero title."""
        self.driver.get(BASE_URL)
        self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".hero-title")))
        self.assertIn("BiteScout", self.driver.title)
        hero = self.driver.find_element(By.CSS_SELECTOR, ".hero-title")
        self.assertIn("bite", hero.text.lower())


    # ─── Test 2: Navigation links work ────────────────────────

    def test_nav_browse_link_navigates(self):
        """Clicking 'Browse' in the navbar should load the browse page."""
        self.driver.get(BASE_URL)
        self.wait.until(EC.presence_of_element_located((By.ID, "navMenu")))
        browse_link = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, '#navMenu a[href="browse.html"]'))
        )
        browse_link.click()
        self.wait.until(EC.url_contains("browse.html"))
        self.assertIn("browse.html", self.driver.current_url)

    # ─── Test 3: Login with seed demo user ────────────────────

    def test_login_with_demo_user(self):
        """Logging in with valid seed credentials should redirect and show the user's name in the nav."""
        self._login_demo_user()
        # After login, profile link should appear in the nav with the user's first name
        profile_link = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".profile-nav-link"))
        )
        self.assertIn("Demo", profile_link.text)

    # ─── Test 4: Login with wrong password shows error ────────

    def test_login_wrong_password_shows_error(self):
        """Submitting wrong credentials should display an error message, not redirect."""
        self.driver.get(f"{BASE_URL}/login.html")
        email = self.wait.until(EC.presence_of_element_located((By.ID, "loginEmail")))
        email.send_keys("demo@bitescout.app")
        password = self.driver.find_element(By.ID, "loginPassword")
        password.send_keys("wrongpassword123")
        self.driver.find_element(By.CSS_SELECTOR, "#loginForm button[type='submit']").click()
        # The error message area should become visible
        error_msg = self.wait.until(
            EC.visibility_of_element_located((By.ID, "loginMessage"))
        )
        self.assertTrue(len(error_msg.text) > 0)

    # ─── Test 5: Browse page shows seed restaurants ───────────

    def test_browse_shows_seed_restaurants(self):
        """The browse page should render at least one seed restaurant card."""
        self.driver.get(f"{BASE_URL}/browse.html")
        # Wait for JS to render restaurant cards
        self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".restaurant-card, .card, [data-restaurant-id]"))
        )
        cards = self.driver.find_elements(By.CSS_SELECTOR, ".restaurant-card, .card, [data-restaurant-id]")
        self.assertGreaterEqual(len(cards), 1)

    # ─── Test 6: Profile page requires login ──────────────────

    def test_profile_requires_login(self):
        """Visiting profile.html without being logged in should show a login prompt."""
        self.driver.get(f"{BASE_URL}/profile.html")
        # Should see a notice prompting login
        notice = self.wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "main"))
        )
        page_text = notice.text.lower()
        self.assertTrue("log in" in page_text or "login" in page_text or "sign in" in page_text)

    # ─── Test 7: Write review flow (login + submit) ───────────

    def test_write_review_flow(self):
        """A logged-in user should be able to submit a review."""
        self._login_demo_user()
        self.driver.get(f"{BASE_URL}/write-review.html")
        # Wait for the restaurant dropdown to be populated
        restaurant_select = self.wait.until(
            EC.presence_of_element_located((By.ID, "reviewRestaurantSelect"))
        )
        self.wait.until(lambda d: len(Select(restaurant_select).options) > 1)
        Select(restaurant_select).select_by_index(1)

        # Fill in rating
        rating_select = self.driver.find_element(By.CSS_SELECTOR, 'select[name="rating"]')
        Select(rating_select).select_by_value("5")

        # Fill in title
        title_input = self.driver.find_element(By.CSS_SELECTOR, 'input[name="title"]')
        unique_title = f"Selenium Test Review {uuid.uuid4().hex[:8]}"
        title_input.send_keys(unique_title)

        # Fill in content
        content_input = self.driver.find_element(By.CSS_SELECTOR, 'textarea[name="content"]')
        content_input.send_keys("This is an automated test review submitted via Selenium.")

        # Submit
        self.driver.find_element(By.CSS_SELECTOR, '#writeReviewForm button[type="submit"]').click()

        # Wait for success message
        msg = self.wait.until(
            EC.visibility_of_element_located((By.ID, "writeReviewMessage"))
        )
        self.assertTrue(len(msg.text) > 0)


if __name__ == "__main__":
    unittest.main()
