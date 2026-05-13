# BiteScout Backend Starter

This is a Flask + SQLite backend starter for the BiteScout frontend.

## What it includes
- Flask app factory structure
- SQLite database with SQLAlchemy
- Seed data for users, restaurants, and place reviews
- JSON API routes for restaurants, users, auth, reviews, favourites, and Google Places
- Session-based login/logout
- Password hashing with Werkzeug
- CSRF token protection for mutating API requests
- Environment-based configuration for secrets and API keys

## Quick start
```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```

The server will run on `http://127.0.0.1:5000`.

## Main routes
- `GET /health`
- `GET /api/csrf-token`
- `GET /api/restaurants`
- `GET /api/restaurants/<id>`
- `GET /api/restaurants/<id>/reviews`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/reviews`
- `POST /api/reviews`
- `PUT /api/reviews/<id>`
- `DELETE /api/reviews/<id>`
- `GET /api/users/<id>`
- `GET /api/favourites`

## Demo login
- email: `demo@bitescout.app`
- password: `password123`

## Configuration
- `SECRET_KEY` secures Flask sessions and CSRF tokens.
- `GOOGLE_MAPS_API_KEY` enables Google Places search and photos.
- `GEMINI_API_KEY` enables the assistant.
