"""
Browser tests against a live Flask server (separate subprocess).

Requires Google Chrome installed (Selenium 4 manages chromedriver).
Run from repository backend folder, e.g.:

  python -m unittest tests.test_selenium -v
"""

import os
import socket
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen

from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


def _pick_free_port() -> int:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


def _wait_for_http(url: str, timeout_s: float = 30.0) -> None:
    deadline = time.monotonic() + timeout_s
    last_err = None
    while time.monotonic() < deadline:
        try:
            with urlopen(url, timeout=2) as response:
                if response.status == 200:
                    return
        except (URLError, OSError) as exc:
            last_err = exc
        time.sleep(0.15)
    raise RuntimeError(f"Server did not become ready at {url!r}: {last_err}")


@unittest.skipUnless(
    os.environ.get("SKIP_SELENIUM", "").lower() not in ("1", "true", "yes"),
    "Set SKIP_SELENIUM=1 to skip browser tests",
)
class SeleniumLiveServerTests(unittest.TestCase):
    """Selenium scenarios against a real http://127.0.0.1:<port> server process."""

    driver = None
    server_process = None
    base_url = None
    temp_dir = None

    DEMO_EMAIL = "demo@bitescout.app"
    DEMO_PASSWORD = "password123"

    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()
        db_path = Path(cls.temp_dir.name) / "selenium_e2e.db"
        port = _pick_free_port()
        cls.base_url = f"http://127.0.0.1:{port}"

        env = os.environ.copy()
        env["BITESCOUT_E2E_PORT"] = str(port)
        env["BITESCOUT_E2E_DB_URI"] = f"sqlite:///{db_path.as_posix()}"
        env["PYTHONUNBUFFERED"] = "1"

        server_script = Path(__file__).resolve().parent / "e2e_server.py"
        cls.server_process = subprocess.Popen(
            [sys.executable, str(server_script)],
            cwd=str(Path(__file__).resolve().parents[1]),
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )
        try:
            _wait_for_http(f"{cls.base_url}/health", timeout_s=45.0)
        except Exception:
            cls._terminate_server()
            stderr = ""
            if cls.server_process.stderr:
                stderr = cls.server_process.stderr.read().decode("utf-8", errors="replace")[:4000]
            raise RuntimeError(f"E2E server failed to start. stderr tail:\n{stderr}") from None

        options = webdriver.ChromeOptions()
        options.add_argument("--headless=new")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1280,900")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        # DOM ready only; external fonts/CDN must not block tests on slow networks.
        options.page_load_strategy = "eager"
        cls.driver = webdriver.Chrome(options=options)
        cls.driver.set_page_load_timeout(30)

    @classmethod
    def tearDownClass(cls):
        if cls.driver is not None:
            cls.driver.quit()
            cls.driver = None
        cls._terminate_server()
        if cls.temp_dir is not None:
            cls.temp_dir.cleanup()
            cls.temp_dir = None

    @classmethod
    def _terminate_server(cls):
        proc = cls.server_process
        if proc is None:
            return
        proc.terminate()
        try:
            proc.wait(timeout=15)
        except subprocess.TimeoutExpired:
            proc.kill()
        cls.server_process = None

    def setUp(self):
        self.driver.delete_all_cookies()

    def _open(self, path: str):
        if not path.startswith("/"):
            path = "/" + path
        url = f"{self.base_url}{path}"
        try:
            self.driver.get(url)
        except TimeoutException:
            self.driver.execute_script("window.stop();")

        WebDriverWait(self.driver, 15).until(
            lambda d: d.execute_script("return document.readyState") in ("interactive", "complete")
        )

    def test_homepage_loads(self):
        self._open("/")
        self.assertIn("BiteScout", self.driver.page_source)
        self.assertIn("Find your next favorite bite", self.driver.page_source)

    def test_browse_page_loads(self):
        self._open("/browse.html")
        self.assertIn("Restaurants near you", self.driver.page_source)
        location = self.driver.find_element(By.ID, "locationInput")
        self.assertTrue(location.is_displayed())

    def test_login_flow_redirects_to_profile(self):
        self._open("/login.html")
        wait = WebDriverWait(self.driver, 15)
        self.driver.find_element(By.NAME, "email").send_keys(self.DEMO_EMAIL)
        self.driver.find_element(By.NAME, "password").send_keys(self.DEMO_PASSWORD)
        self.driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
        wait.until(EC.url_contains("profile.html"))
        self.assertIn("profile", self.driver.current_url.lower())

    def test_signup_page_loads(self):
        self._open("/signup.html")
        self.assertIn("Join BiteScout", self.driver.page_source)

    def test_places_request_page_loads(self):
        self._open("/places-request.html")
        self.assertIn("Missing Place Requests", self.driver.page_source)

    def test_health_endpoint_returns_ok(self):
        self._open("/health")
        body = self.driver.find_element(By.TAG_NAME, "body").text.lower()
        self.assertTrue("ok" in body or "healthy" in body or "{" in body)

    def test_browse_filter_controls_exist(self):
        self._open("/browse.html")
        wait = WebDriverWait(self.driver, 10)
        rating_select = wait.until(EC.presence_of_element_located((By.ID, "ratingFilter")))
        self.assertTrue(rating_select.is_displayed())


if __name__ == "__main__":
    unittest.main()
