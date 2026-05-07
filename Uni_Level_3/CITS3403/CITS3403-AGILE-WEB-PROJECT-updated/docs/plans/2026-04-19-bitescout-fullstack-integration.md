# BiteScout Full-Stack Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate the existing `bitescout_frontend` prototype into `bitescout_backend` so one Flask app serves the UI and backs core flows with database-backed APIs.

**Architecture:** Keep the current HTML/CSS/JS frontend largely intact, but serve it through Flask and replace localStorage-backed auth, reviews, favourites, and restaurant data with real `/api/*` calls. Preserve recommendation and other low-risk prototype-only behaviors where the backend does not yet provide an endpoint.

**Tech Stack:** Flask, Flask-SQLAlchemy, SQLite, static HTML/CSS/JavaScript, browser `fetch`, Python `unittest`

---

### Task 1: Add failing integration tests for frontend hosting and auth

**Files:**
- Create: `bitescout_backend/tests/test_integration.py`
- Modify: `bitescout_backend/app/__init__.py`

**Step 1: Write the failing test**

```python
def test_frontend_home_page_is_served(client):
    response = client.get("/")
    assert response.status_code == 200
    assert b"BiteScout" in response.data


def test_login_round_trip_sets_session(client):
    response = client.post("/api/auth/login", json={"email": "demo@bitescout.app", "password": "password123"})
    assert response.status_code == 200
    assert response.get_json()["user"]["email"] == "demo@bitescout.app"
```

**Step 2: Run test to verify it fails**

Run: `python -m unittest bitescout_backend.tests.test_integration -v`
Expected: FAIL because `/` currently returns JSON and the tests package does not exist yet.

**Step 3: Write minimal implementation**

Create a test app/client setup and update the app factory so tests can point SQLite at a temporary database.

**Step 4: Run test to verify it passes**

Run: `python -m unittest bitescout_backend.tests.test_integration -v`
Expected: PASS for the hosting and auth smoke tests.

### Task 2: Serve the prototype frontend from Flask

**Files:**
- Modify: `bitescout_backend/app/routes.py`
- Create: `bitescout_backend/app/static/`
- Copy into `bitescout_backend/app/static/`: prototype HTML, CSS, and JS files from `bitescout_frontend/`

**Step 1: Write the failing test**

```python
def test_browse_page_is_served(client):
    response = client.get("/browse.html")
    assert response.status_code == 200
    assert b"Find restaurants and drinks spots" in response.data
```

**Step 2: Run test to verify it fails**

Run: `python -m unittest bitescout_backend.tests.test_integration -v`
Expected: FAIL with 404 until Flask serves the static prototype files.

**Step 3: Write minimal implementation**

Use Flask routes to:
- serve `index.html` for `/`
- serve other `.html` pages from the Flask static directory
- keep `/api/*` routes unchanged

**Step 4: Run test to verify it passes**

Run: `python -m unittest bitescout_backend.tests.test_integration -v`
Expected: PASS for both `/` and `/browse.html`.

### Task 3: Replace localStorage auth/session flow with backend-backed fetch calls

**Files:**
- Modify: `bitescout_backend/app/static/js/app.js`

**Step 1: Write the failing test**

```python
def test_me_returns_seeded_user_after_login(client):
    client.post("/api/auth/login", json={"email": "demo@bitescout.app", "password": "password123"})
    response = client.get("/api/auth/me")
    assert response.get_json()["user"]["email"] == "demo@bitescout.app"
```

**Step 2: Run test to verify it fails**

Run: `python -m unittest bitescout_backend.tests.test_integration -v`
Expected: FAIL if session wiring breaks during integration.

**Step 3: Write minimal implementation**

Update frontend JS to:
- fetch `/api/auth/me` on boot
- POST signup/login/logout to the backend
- remove localStorage session usage for auth state

**Step 4: Run test to verify it passes**

Run: `python -m unittest bitescout_backend.tests.test_integration -v`
Expected: PASS and browser flows work manually.

### Task 4: Replace prototype data reads with restaurant, review, and favourites APIs

**Files:**
- Modify: `bitescout_backend/app/static/js/app.js`
- Modify: `bitescout_backend/app/routes.py`

**Step 1: Write the failing test**

```python
def test_favourites_can_be_saved_and_listed(client):
    client.post("/api/auth/login", json={"email": "demo@bitescout.app", "password": "password123"})
    save_response = client.post("/api/favourites/restaurants/r1")
    list_response = client.get("/api/favourites")
    assert save_response.status_code == 201
    assert list_response.get_json()["restaurants"][0]["id"] == "r1"
```

**Step 2: Run test to verify it fails**

Run: `python -m unittest bitescout_backend.tests.test_integration -v`
Expected: FAIL if the backend contract or session flow is not stable enough for the frontend.

**Step 3: Write minimal implementation**

Update frontend JS to:
- fetch restaurants from `/api/restaurants`
- fetch restaurant details and reviews from `/api/restaurants/<id>` and `/api/restaurants/<id>/reviews`
- create/update/delete reviews through `/api/reviews`
- read and write favourites through `/api/favourites`

Keep recommendation sorting local, but base it on fetched restaurant data.

**Step 4: Run test to verify it passes**

Run: `python -m unittest bitescout_backend.tests.test_integration -v`
Expected: PASS and manual browser verification succeeds for browse/detail/profile/favourites flows.

### Task 5: Verify integrated navigation and static assets

**Files:**
- Verify: `bitescout_backend/app/static/*.html`
- Verify: `bitescout_backend/app/static/css/styles.css`
- Verify: `bitescout_backend/app/static/js/app.js`

**Step 1: Manual acceptance**

Confirm:
- `/` renders the existing BiteScout homepage
- navbar links still work when served by Flask
- login/signup/profile/favourites/review pages load without broken assets
- core pages pull backend data instead of localStorage
- recommendations still render even if they remain partially prototype-backed

**Step 2: Run verification**

Run:
- `python -m unittest bitescout_backend.tests.test_integration -v`
- start Flask locally and click through the main pages

Expected: tests pass and the app is usable from one Flask server.
