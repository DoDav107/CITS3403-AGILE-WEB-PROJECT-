from selenium import webdriver
from selenium.webdriver.common.by import By
import unittest
import time


class SeleniumTests(unittest.TestCase):

    def setUp(self):
        self.driver = webdriver.Chrome()  # 要先装好 chromedriver
        self.driver.get("http://127.0.0.1:5000")

    def tearDown(self):
        self.driver.quit()

    def test_homepage_loads(self):
        self.assertIn("BiteScout", self.driver.page_source)

    def test_browse_page_loads(self):
        self.driver.get("http://127.0.0.1:5000/browse.html")
        self.assertIn("Find restaurants", self.driver.page_source)

    def test_login_page_loads(self):
        self.driver.get("http://127.0.0.1:5000/login.html")
        self.assertIn("Login", self.driver.page_source)

    def test_signup_page_loads(self):
        self.driver.get("http://127.0.0.1:5000/signup.html")
        self.assertIn("Sign Up", self.driver.page_source)

    def test_search_input_exists(self):
        self.driver.get("http://127.0.0.1:5000/browse.html")
        search = self.driver.find_element(By.TAG_NAME, "input")
        self.assertIsNotNone(search)


if __name__ == "__main__":
    unittest.main()