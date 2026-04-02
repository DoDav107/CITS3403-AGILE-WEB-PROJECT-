# Food Discovery Prototype Design

**Goal:** Create a local multi-page HTML/CSS prototype for a restaurant discovery and review website that demonstrates the MVP flow to a prospective client.

## Product Scope

The prototype will cover the main MVP pages listed in `Project.md`:

- Home page
- Sign up page
- Login page
- Browse/Search restaurants page
- Restaurant details page
- Write/Edit review page
- User profile page

The prototype will remain frontend-only. It will not connect to a backend, but it will simulate key behaviors with local JavaScript and `localStorage`.

## Experience Direction

The visual direction is editorial and food-first rather than generic app UI. The interface will use warm neutrals, terracotta accents, olive secondary tones, and large serif display typography to make the site feel like a curated dining guide instead of a dashboard.

## Technical Approach

- Plain HTML for each page
- Bootstrap via CDN for layout primitives and responsive utilities
- Shared custom stylesheet for branding and layout refinement
- Shared JavaScript for interactive behaviors
- Local mock restaurant data embedded in JavaScript
- `localStorage` for favorites, demo reviews, and mock profile state

## Interaction Scope

The prototype will include lightweight interactions that help a client understand how the real product would work:

- Browse page search and filter controls
- Favorite toggles for restaurants
- Restaurant page data loaded from query parameters
- Review form with star selection and live character count
- Review submission saved to `localStorage`
- Profile page showing saved favorites and submitted reviews
- Login and sign-up forms with client-side demo submission feedback

## Information Architecture

### Home

Communicates the product value, featured restaurants, cuisine exploration, and the main navigation paths into sign-up and browsing.

### Login / Sign Up

Show the account entry points and communicate what value users get from creating an account.

### Browse

Acts as the main discovery surface with filters for cuisine, price, and rating, plus search by name or suburb.

### Restaurant Details

Shows restaurant identity, tags, menu highlights, ratings, and user reviews. This page links into writing a review.

### Write Review

Lets the user score the restaurant, add review text, and choose whether the review should be public-facing in the prototype.

### Profile

Summarizes the mock user, stored favorites, and stored reviews to demonstrate persistence between sessions.

## Verification

Because this is a static prototype, verification will focus on:

- Confirming all pages exist and cross-link correctly
- Checking HTML structure and shared asset references
- Verifying JavaScript-driven interactions by loading pages locally
- Inspecting for obvious broken links or missing files
