# Fork & Frame Backend (Issue 13 Scaffold)

This folder now contains a minimal Flask backend with core SQLAlchemy models.

## Implemented in Issue 13

- Flask app factory and entry point
- SQLite database setup
- Core models:
  - `User`
  - `Restaurant`
  - `Dish`
  - `Review`
  - `DishRating`
  - `Favorite`
- Minimal routes:
  - `GET /`
  - `GET /health`
  - `GET /api/restaurants`

## Quick start

1. Create/activate a Python virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Seed demo data:

```bash
python seed.py
```

4. Run the app:

```bash
python app.py
```

5. Open:

- `http://127.0.0.1:5000/health`
- `http://127.0.0.1:5000/api/restaurants`

## One-shot local setup (PowerShell)

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r requirements.txt; python seed.py; python app.py
```

## Notes

- Database file is created at `Project/instance/app.db`.
- For now, tables are created automatically on startup (`db.create_all()`).
- Auth and route protection will be added in Issue 14.
- Frontend-to-backend integration will be added in Issue 15.
