# BiteScout Backend Starter

This is a Flask + SQLite backend starter for the BiteScout frontend.

## What it includes
- Flask app factory structure
- SQLite database with SQLAlchemy
- Seed data for users, restaurants, dishes, and reviews
- JSON API routes for restaurants, dishes, users, auth, reviews, and favourites
- Session-based login/logout
- Password hashing with Werkzeug

## Quick start
```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

The server will run on `http://127.0.0.1:5000`.

## Main routes
- `GET /health`
- `GET /api/restaurants`
- `GET /api/restaurants/<id>`
- `GET /api/restaurants/<id>/reviews`
- `GET /api/dishes/<restaurant_id>/<dish_id>`
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

## Next step
Hook your existing `app.js` frontend actions to these API endpoints using `fetch()`.
