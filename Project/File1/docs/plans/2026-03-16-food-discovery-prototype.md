# Food Discovery Prototype Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local multi-page restaurant discovery prototype with HTML, CSS, Bootstrap, and lightweight JavaScript interactions.

**Architecture:** Each page is a standalone HTML document sharing one stylesheet and one JavaScript bundle. Mock restaurant data and browser `localStorage` power search, favorites, reviews, and profile state without a backend.

**Tech Stack:** HTML, CSS, Bootstrap CDN, vanilla JavaScript, browser `localStorage`

---

### Task 1: Create the shared static site structure

**Files:**
- Create: `index.html`
- Create: `login.html`
- Create: `signup.html`
- Create: `browse.html`
- Create: `restaurant.html`
- Create: `review.html`
- Create: `profile.html`
- Create: `assets/css/styles.css`
- Create: `assets/js/app.js`

**Steps:**
1. Create the shared folder structure for CSS and JavaScript assets.
2. Add a consistent site shell to each HTML file with navigation, footer, and CDN references.
3. Add page-specific semantic sections for hero, forms, listings, details, review entry, and profile summary.

### Task 2: Implement shared branding and responsive layout

**Files:**
- Modify: `assets/css/styles.css`

**Steps:**
1. Define CSS custom properties for colors, typography, shadows, borders, and spacing.
2. Build the editorial visual language for hero areas, cards, chips, buttons, forms, and panels.
3. Add responsive rules for navigation, grids, filters, and page sections.

### Task 3: Implement mock data and cross-page interactivity

**Files:**
- Modify: `assets/js/app.js`

**Steps:**
1. Add restaurant seed data and helpers for reading and writing `localStorage`.
2. Render filtered restaurant cards on the browse page.
3. Read a restaurant ID from query parameters and populate the detail and review pages.
4. Implement favorite toggles, review submission, character count, and demo auth form feedback.
5. Render stored favorites and reviews on the profile page.

### Task 4: Verify local prototype behavior

**Files:**
- Verify: `index.html`
- Verify: `browse.html`
- Verify: `restaurant.html`
- Verify: `review.html`
- Verify: `profile.html`

**Steps:**
1. List the created files to confirm the expected structure exists.
2. Run a lightweight HTML reference check across the created pages.
3. Inspect core JavaScript references and page hooks for obvious errors.
4. Report any remaining limitations honestly, especially around offline CDN dependencies and backend absence.
