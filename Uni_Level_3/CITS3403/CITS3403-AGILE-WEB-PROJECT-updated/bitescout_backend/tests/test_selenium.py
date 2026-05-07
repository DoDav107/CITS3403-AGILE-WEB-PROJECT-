from selenium import webdriver
from selenium.webdriver.common.by import By
import unittest
import time


class SeleniumTests(unittest.TestCase):

    def setUp(self):
        self.driver = webdriver.Chrome()
        self.driver.get("http://127.0.0.1:5000")

    def tearDown(self):
        self.driver.quit()

    def test_homepage_loads(self):
        self.assertIn("BiteScout", self.driver.page_source)

    def test_browse_page_loads(self):
        self.driver.get("http://127.0.0.1:5000/browse.html")
        self.assertIn("Restaurants near you", self.driver.page_source)

    def test_login_flow(self):
        self.driver.get("http://127.0.0.1:5000/login.html")

        email_input = self.driver.find_element(By.NAME, "email")
        password_input = self.driver.find_element(By.NAME, "password")

        email_input.send_keys("bryantgu88@gmail.com")
        password_input.send_keys("123456")

        login_button = self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
        login_button.click()

        time.sleep(2)

        self.assertNotIn("Invalid", self.driver.page_source)
        self.assertIn("BiteScout", self.driver.page_source)

    def test_signup_page_loads(self):
        self.driver.get("http://127.0.0.1:5000/signup.html")
        self.assertIn("Join BiteScout", self.driver.page_source)

    def test_search_input_exists(self):
        self.driver.get("http://127.0.0.1:5000/browse.html")
        search = self.driver.find_element(By.TAG_NAME, "input")
        self.assertIsNotNone(search)


if __name__ == "__main__":
    unittest.main()
