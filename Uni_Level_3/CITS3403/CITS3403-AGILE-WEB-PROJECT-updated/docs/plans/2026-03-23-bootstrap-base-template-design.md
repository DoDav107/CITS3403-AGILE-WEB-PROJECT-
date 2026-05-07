# Bootstrap Base Template & Page Starters Design

## Goal
Set up Bootstrap across the project and introduce a reusable base layout (navbar + footer) while keeping all existing DOM hooks that `assets/js/app.js` relies on so every main MVP page renders correctly and stays responsive.

## Constraints & Assumptions
- Pages are tested/loaded via `file://` (not a local web server). This makes “fetching partial HTML” unreliable, so the base layout must be injected without network requests.
- Existing interactive behavior is implemented in `assets/js/app.js` and keys off stable selectors (notably `body[data-page]` plus various element IDs/classes).
- `review.html` is out-of-scope for the base-template refactor (so all existing behavior on that page remains unchanged).

## Recommended Approach (Approved)
Inject the navbar + footer into each target page using a shared JS module:
- Add `assets/js/layout.js`.
- Each target page replaces its duplicated `<nav>` with `<div id="layout-nav"></div>`.
- Each target page replaces its duplicated `<footer>` with `<div id="layout-footer"></div>`.
- Each target page keeps `body data-page="..."` exactly as it is today.
- `layout.js` uses `document.body.dataset.page` to:
  - render the shared navbar/footer markup
  - apply the correct `.active` styling to the current page link

## Target Pages (6)
- `index.html`
- `login.html`
- `signup.html`
- `browse.html`
- `restaurant.html`
- `profile.html`

## Consistency Rules for Starters
- Do not change any IDs/classes used by `assets/js/app.js` (e.g. `#browseResults`, `#featuredDeck`, `#reviewForm`, `#profileFavorites`, etc.).
- Keep links to:
  - Bootstrap CSS
  - `assets/css/styles.css`
  - `assets/js/app.js`
- Add `assets/js/layout.js` (as `defer`) so injection runs after the placeholder elements exist.

## Responsiveness
Responsiveness is handled by:
- Bootstrap navbar behavior (`navbar-expand-lg` + collapse)
- Existing custom CSS media queries in `assets/css/styles.css`
- Shared layout markup that uses Bootstrap grid utilities where appropriate (and otherwise relies on existing CSS classes already present in the pages).

## Success Criteria (Definition of Done)
- Bootstrap is properly linked and visible.
- A base template exists and renders a consistent navbar + footer across the 6 target pages.
- Main frontend pages render correctly (no JS selector breakage).
- Navigation between pages works (links are valid; active state matches `data-page`).
- Styling is consistent and responsive.

