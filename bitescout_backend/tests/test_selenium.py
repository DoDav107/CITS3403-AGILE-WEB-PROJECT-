from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
import os
import unittest


BASE_URL = os.getenv("BITESCOUT_BASE_URL", "http://127.0.0.1:5000")
TEST_EMAIL = os.getenv("BITESCOUT_TEST_EMAIL", "demo@bitescout.app")
TEST_PASSWORD = os.getenv("BITESCOUT_TEST_PASSWORD", "password123")


class SeleniumTests(unittest.TestCase):

    def setUp(self):
        self.driver = webdriver.Chrome()
        self.wait = WebDriverWait(self.driver, 5)
        self.driver.get(BASE_URL)

    def tearDown(self):
        self.driver.quit()

    def test_homepage_loads(self):
        self.assertIn("BiteScout", self.driver.page_source)

    def test_browse_page_loads(self):
        self.driver.get(f"{BASE_URL}/browse.html")
        self.assertIn("Restaurants near you", self.driver.page_source)

    def test_login_flow(self):
        self.driver.get(f"{BASE_URL}/login.html")

        email_input = self.driver.find_element(By.NAME, "email")
        password_input = self.driver.find_element(By.NAME, "password")

        email_input.send_keys(TEST_EMAIL)
        password_input.send_keys(TEST_PASSWORD)

        login_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        login_button.click()

        self.wait.until(EC.url_contains("profile.html"))
        self.assertIn("profile.html", self.driver.current_url)

    def test_signup_page_loads(self):
        self.driver.get(f"{BASE_URL}/signup.html")
        self.assertIn("Join BiteScout", self.driver.page_source)

    def test_search_input_exists(self):
        self.driver.get(f"{BASE_URL}/browse.html")
        search = self.driver.find_element(By.TAG_NAME, "input")
        self.assertIsNotNone(search)


if __name__ == "__main__":
    unittest.main()
