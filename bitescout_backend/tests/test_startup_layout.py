from pathlib import Path
import unittest


PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "bitescout_backend"


class StartupLayoutTestCase(unittest.TestCase):
    def test_backend_directory_supports_documented_startup_commands(self):
        self.assertTrue((BACKEND_DIR / "requirements.txt").is_file())
        self.assertTrue((BACKEND_DIR / "run.py").is_file())


if __name__ == "__main__":
    unittest.main()
