# BiteScout

BiteScout is a restaurant discovery and review web application created for our **CITS3403 Agile Web Development** group project. It is designed to help users find places to eat through restaurant browsing, reviews, favourites, and location-based discovery features.



| UWA ID   | Name               | Github username |
| -------- | ------------------ | --------------- |
| 23988902 | Zhefeng Wang       | Elys1an-Y1san   |
| 24012326 | Xuan Truong Nguyen | xtn11           |
| 24224251 | David Do           | DoDav107        |
| 24135184 | Bryant gu          | bryantgu        |



## About the Project

The purpose of BiteScout is to provide users with a more convenient and engaging way to explore food options. Rather than relying on scattered information, users can interact with a single platform that supports searching, filtering, reviewing, and saving restaurants.

This project demonstrates both frontend and backend development in a team-based agile workflow.

## Main Features

- Browse restaurants and food venues
- Search and filter results
- View restaurant details
- Save favourite restaurants
- Write and view reviews
- User authentication flow
- Location-based discovery support
- Backend route and model setup for future expansion

# How to use:
Run Locally

```
cd bitescout_backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
Open in your browser:
```

http://127.0.0.1:5000/
http://127.0.0.1:5000/login.html
http://127.0.0.1:5000/signup.html
http://127.0.0.1:5000/browse.html
http://127.0.0.1:5000/recommendations.html
http://127.0.0.1:5000/places-request.html

## How to Run Tests

All commands below should be run from the `bitescout_backend` directory.

### Run all tests

```bash
python -m unittest discover -s tests -p "test_*.py" --buffer
```

### Test suites

The project contains three test files under `bitescout_backend/tests/`:

| File | Type | Count | Description |
|------|------|-------|-------------|
| `test_unit.py` | Unit | 7 | Fast, isolated tests for pure helper functions (no database or HTTP). Covers Google Places payload building, deduplication, and API key validation. |
| `test_integration.py` | Integration | 31 | Tests the full Flask application with a temporary SQLite database. Covers authentication, CSRF protection, reviews, favourites, restaurant CRUD, password reset, and configuration loading. |
| `test_selenium.py` | End-to-end | 7 | Browser tests against a live Flask server using Selenium + headless Chrome. Covers page loading, login flow, and UI element presence. |

### Running individual suites

```bash
# Unit tests only
python -m unittest tests.test_unit -v

# Integration tests only
python -m unittest tests.test_integration -v

# Selenium end-to-end tests only (requires Google Chrome)
python -m unittest tests.test_selenium -v
```

### Prerequisites for Selenium tests

- **Google Chrome** must be installed (Selenium 4 auto-manages chromedriver).
- To **skip** Selenium tests, set the environment variable `SKIP_SELENIUM=1`.
