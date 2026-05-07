# Google Places Browse And Preference Recommendations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build live Google Places Browse, preference-based Recommendations, star-only ratings, tag filters, and Google-place mirroring for reviews/favourites.

**Architecture:** Keep existing Flask and static JavaScript architecture. Add a backend endpoint that mirrors Google Places payloads into `Restaurant` rows, then reuse existing detail/review/favourite routes. Keep frontend state local to `App` and add small pure helpers for ranking, rating display, and filter derivation.

**Tech Stack:** Flask, SQLAlchemy, vanilla JavaScript, Bootstrap, Node `node:test`, Python `unittest`.

---

### Task 1: Frontend Helper Tests

**Files:**
- Modify: `bitescout_frontend/tests/render-sanitization.test.js`
- Modify: `bitescout_frontend/js/app.js`

**Steps:**
1. Add failing Node tests for star-only rating rendering, preference recommendation ranking, Google place filter metadata, and restaurant tag links.
2. Run `node bitescout_frontend/tests/render-sanitization.test.js` and verify the new tests fail because helpers/rendering are missing.
3. Implement minimal helpers in `app.js`.
4. Re-run the Node test file and verify it passes.

### Task 2: Backend Google Place Mirroring

**Files:**
- Modify: `bitescout_backend/tests/test_integration.py`
- Modify: `bitescout_backend/app/routes.py`
- Modify: `bitescout_backend/app/seed.py`

**Steps:**
1. Add failing integration tests for `POST /api/restaurants/from-google` and tag filtering through `/api/restaurants?tag=...`.
2. Run `python -m unittest bitescout_backend.tests.test_integration` and verify the new tests fail.
3. Implement the mirror endpoint and tag filter.
4. Re-run the integration tests and verify they pass.

### Task 3: Recommendations Page

**Files:**
- Modify: `bitescout_frontend/recommendations.html`
- Modify: `bitescout_frontend/js/app.js`

**Steps:**
1. Remove manual location UI.
2. Render preference-based recommendations with 80/20 local ranking.
3. Add softer logged-out and no-preference copy.
4. Run frontend tests.

### Task 4: Browse Page

**Files:**
- Modify: `bitescout_frontend/browse.html`
- Modify: `bitescout_frontend/js/app.js`

**Steps:**
1. Replace local restaurant default render with immediate geolocation request.
2. Fetch `/api/google/nearby` after location succeeds.
3. Show retry control after permission or location failure.
4. Add type/tag filters derived from Google Places results.
5. Mirror a Google place before navigating to restaurant detail.
6. Run frontend tests.

### Task 5: Global Rating And Review UI

**Files:**
- Modify: `bitescout_frontend/write-review.html`
- Modify: `bitescout_frontend/edit-review.html`
- Modify: `bitescout_frontend/js/app.js`

**Steps:**
1. Replace numeric rating labels with star labels.
2. Replace numeric rating display in cards and detail surfaces with stars.
3. Run frontend and backend tests.
