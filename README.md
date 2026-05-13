# BiteScout

BiteScout is a restaurant discovery and review web application created for our **CITS3403 Agile Web Development** group project. It is designed to help users find places to eat through restaurant browsing, reviews, favourites, and location-based discovery features.

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


## How to use

Run locally:

```bash
cd bitescout_backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```

Open in your browser:

- http://127.0.0.1:5000/
- http://127.0.0.1:5000/login.html
- http://127.0.0.1:5000/signup.html
- http://127.0.0.1:5000/browse.html
- http://127.0.0.1:5000/recommendations.html
- http://127.0.0.1:5000/places-request.html

## Configuration

Create `bitescout_backend/.env` from `bitescout_backend/.env.example`.

- `SECRET_KEY` secures Flask sessions and CSRF tokens.
- `GOOGLE_MAPS_API_KEY` enables Google Places location search and place photos.
- `GEMINI_API_KEY` enables the BiteScout assistant.

The Flask app serves the frontend through Jinja rendering while keeping CSS, JavaScript, and images as static assets.

## How to run the tests

Integration tests:

```bash
cd bitescout_backend
source .venv/bin/activate
python -m unittest tests/test_integration.py
```

Frontend JavaScript tests:

```bash
node --test bitescout_frontend/tests/render-sanitization.test.js
```

Selenium tests require the Flask server to be running:

```bash
cd bitescout_backend
source .venv/bin/activate
python run.py
```

In another terminal:

```bash
cd bitescout_backend
source .venv/bin/activate
python -m unittest tests/test_selenium.py
```
