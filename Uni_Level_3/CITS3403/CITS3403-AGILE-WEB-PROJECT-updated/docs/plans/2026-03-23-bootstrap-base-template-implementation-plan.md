# Bootstrap Base Template Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Render a consistent navbar + footer across the main MVP pages while keeping existing `assets/js/app.js` behavior working.

**Architecture:** Add a small `assets/js/layout.js` module that injects the shared navbar/footer HTML into placeholders (`#layout-nav`, `#layout-footer`) on each page. It uses `document.body.dataset.page` to set the `.active` state for the correct nav link.

**Tech Stack:** Static HTML, Bootstrap 5 (already linked), vanilla JS (no build tooling), existing `assets/css/styles.css`.

---

### Task 1: Add shared layout injector

**Files:**
- Create: `/Users/elysiany1san/Documents/Code/CITS3403-AGILE-WEB-PROJECT-/Project/File1/assets/js/layout.js`

**Step 1: Write failing test**
```text
N/A (static HTML injection). Manual verification target:
- On a target page, navbar/footer placeholders exist and injected markup appears.
```

**Step 2: Run test to verify it fails**
```text
N/A
```

**Step 3: Write minimal implementation**
```text
Implement layout.js:
- If `#layout-nav` exists, set it to the shared navbar markup.
- If `#layout-footer` exists, set it to page-specific footer text for the 6 target pages.
- Determine active nav item using `document.body.dataset.page`.
- Always keep the same link targets used in current pages.
```

**Step 4: Run test to verify it passes**
```text
Manual checks:
- Open `index.html` via file:// and confirm nav + footer render.
- Confirm correct active nav state for each target page.
```

### Task 2: Refactor starter pages to use placeholders

**Files:**
- Modify:
  - `Project/File1/index.html`
  - `Project/File1/login.html`
  - `Project/File1/signup.html`
  - `Project/File1/browse.html`
  - `Project/File1/restaurant.html`
  - `Project/File1/profile.html`

**Step 1: Write failing test**
```text
N/A (static rendering). Manual verification target:
- Duplicate navbar/footer markup is removed from pages.
- Placeholders (#layout-nav, #layout-footer) are present.
- layout.js is loaded (as `defer`) and executes.
```

**Step 2: Run test to verify it fails**
```text
N/A
```

**Step 3: Write minimal implementation**
```text
For each target page:
- Replace the existing <nav class="site-nav navbar navbar-expand-lg"> ... </nav> with `<div id="layout-nav"></div>`.
- Replace the existing <footer class="site-footer"> ... </footer> with `<div id="layout-footer"></div>`.
- Add `<script src="assets/js/layout.js" defer></script>` before `app.js` (or at least ensure both are deferred).
- Do not modify `body data-page="...">` nor any element IDs/classes used by app.js.
```

**Step 4: Run test to verify it passes**
```text
Manual checks:
- Open each target page and confirm nav works (collapse toggler on small widths).
- Confirm the existing interactive sections on browse/restaurant/review/profile still render (app.js selectors intact).
```

### Task 3: Confirm Bootstrap + shared CSS links remain correct

**Files:**
- `Project/File1/*.html` (the 6 target pages)

**Step 1: Write failing test**
```text
N/A. Manual verification target:
- Bootstrap CSS still styles the navbar/buttons.
- `assets/css/styles.css` still applies the custom theme.
```

**Step 2: Run test to verify it fails**
```text
N/A
```

**Step 3: Write minimal implementation**
```text
Do not remove existing Bootstrap/CSS links from the 6 target pages.
```

**Step 4: Run test to verify it passes**
```text
Open pages and visually confirm styling.
```

### Task 4: Definition-of-Done verification

**Files:**
- All 6 target pages

**Step 1: Manual acceptance**
```text
Confirm:
- Bootstrap is properly linked and working.
- Base template (navbar/footer) exists and renders.
- Main frontend pages render correctly.
- Navigation between pages works.
- Styling is consistent and responsive.
```

