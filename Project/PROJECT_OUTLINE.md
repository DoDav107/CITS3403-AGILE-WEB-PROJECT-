# Food Recommendation & Review Website - Project Outline

## 1. Project Goal
Build a restaurant discovery web app where users can:
- Browse restaurants and dishes
- Leave reviews and ratings
- View other users' reviews
- Get simple recommendations based on cuisine preference and community ratings

The app must be engaging, effective, and intuitive while meeting all technical constraints.

## 2. Core Requirements Mapping

### 2.1 Client-Server Architecture
- Client: HTML/CSS/JavaScript + Bootstrap/Tailwind + jQuery
- Server: Flask application
- Data exchange: Flask routes + AJAX (JSON endpoints where needed)

### 2.2 Authentication (Login/Logout)
- Flask-Login for user session management
- Pages: Register, Login, Logout
- Protected routes for writing reviews/ratings

### 2.3 Data Persistence
- SQLite database
- SQLAlchemy ORM models
- Persistent user, restaurant, dish, review, and rating data

### 2.4 View Data from Other Users
- Public restaurant pages showing community reviews
- User profile pages showing submitted reviews
- Optional review feed (latest community activity)

## 3. Tech Stack (Allowed)
- HTML, CSS, JavaScript
- CSS framework: Bootstrap or Tailwind (pick one for consistency)
- jQuery
- Flask (+ Flask-Login, Flask-WTF, etc. used in lectures)
- AJAX/WebSockets (AJAX recommended for dynamic updates)
- SQLite + SQLAlchemy

## 4. Suggested Information Architecture

### 4.1 Public Pages
- Home (`/`): featured restaurants, cuisines, top-rated picks
- Restaurants list (`/restaurants`): searchable/filterable list
- Restaurant details (`/restaurants/<id>`):
  - Basic info
  - Dishes list
  - Average ratings
  - Community reviews

### 4.2 Auth Pages
- Register (`/register`)
- Login (`/login`)
- Logout (`/logout`)

### 4.3 Logged-in User Pages
- Profile (`/profile/<username>`): user reviews and basic stats
- Add review (`/restaurants/<id>/review`)
- Rate dish (`/dishes/<id>/rate`)
- My activity (`/me`): user's own reviews/ratings

### 4.4 Recommendation Page
- Recommendations (`/recommendations`):
  - Based on user's preferred cuisines (from review history)
  - Weighted by community average ratings

## 5. Database Design (Draft)

### 5.1 `users`
- id (PK)
- uwa_id (string, optional if needed)
- username (unique)
- email (unique)
- password_hash
- created_at

### 5.2 `restaurants`
- id (PK)
- name
- cuisine_type
- suburb/location
- description
- created_at

### 5.3 `dishes`
- id (PK)
- restaurant_id (FK -> restaurants.id)
- name
- description

### 5.4 `reviews`
- id (PK)
- user_id (FK -> users.id)
- restaurant_id (FK -> restaurants.id)
- rating (1-5)
- content
- created_at

### 5.5 `dish_ratings`
- id (PK)
- user_id (FK -> users.id)
- dish_id (FK -> dishes.id)
- rating (1-5)
- comment (optional)
- created_at

## 6. Recommendation Logic (Simple + Explainable)
For each candidate restaurant:
1. Cuisine match score: +weight if cuisine appears in user's past positive reviews
2. Community score: average restaurant rating
3. Final score: `0.6 * cuisine_match + 0.4 * community_rating`

Return top N restaurants with a short reason:
- "Recommended because you liked Japanese cuisine and this place has a high community rating."

## 7. UX/UI Direction
- Clean, mobile-friendly layout
- Strong visual hierarchy:
  - clear CTA buttons (Login, Write Review)
  - readable cards for restaurants/reviews
- Consistent spacing, typography, and color palette
- Feedback states:
  - loading states for AJAX actions
  - empty states ("No reviews yet")
  - form validation messages

## 8. Suggested Folder Structure
```text
Project/
  app.py
  config.py
  requirements.txt
  README.md
  /instance
    app.db
  /app
    __init__.py
    models.py
    forms.py
    routes.py
    recommender.py
    /templates
      base.html
      home.html
      restaurants.html
      restaurant_detail.html
      login.html
      register.html
      profile.html
      recommendations.html
    /static
      /css
        style.css
      /js
        main.js
        reviews.js
  /tests
    test_auth.py
    test_models.py
    test_routes.py
```

## 9. MVP Feature Checklist
- [ ] User register/login/logout
- [ ] Add/list restaurants
- [ ] Restaurant detail with reviews from all users
- [ ] Submit review and rating (authenticated)
- [ ] Dish rating feature
- [ ] Recommendation page
- [ ] Persistent SQLite storage
- [ ] Basic tests for auth + core routes

## 10. README Checklist (For Submission)
- [ ] App purpose + design rationale
- [ ] Group member table (UWA ID, Name, GitHub username)
- [ ] Setup and launch steps
- [ ] Test running steps
- [ ] Tech stack and architecture summary

## 11. Development Milestones
### Milestone 1: Foundation
- Flask project setup
- DB models + migrations/init scripts
- Base templates + navigation

### Milestone 2: Auth + Core Data
- Register/login/logout flow
- Restaurant list/detail pages

### Milestone 3: Community Features
- Review create/view
- User profile with activity

### Milestone 4: Recommendation + Polish
- Recommendation engine
- AJAX enhancements
- UI polish + responsiveness

### Milestone 5: Testing + Submission Prep
- Route/model/auth tests
- README completion
- Final QA pass

---
If you want, next step I can generate the actual project scaffold files/folders from this outline (including starter Flask code and README template).
