# Google Places Browse And Preference Recommendations Design

## Goal

Update BiteScout so Browse uses live Google Places results near the user's current location, while Recommendations uses the logged-in user's cuisine preference instead of manual location input.

## Design

Recommendations becomes a preference-first page. It reads `currentUser.preferredCuisine`, ranks local restaurants so roughly 80 percent match that cuisine and 20 percent come from other cuisines, and uses friendlier empty-state copy when a user is logged out or has no cuisine set. Location search controls are removed from this page.

Browse becomes a location-first page. It asks for browser location as soon as the page initializes. If permission succeeds, it calls `/api/google/nearby` and renders Google Places cards. If permission fails or is blocked, it shows a clear retry button. Browse filtering uses Google `primaryType` and `types` values as cuisine/type and tag filters.

Because Google Places results are not initially local `Restaurant` rows, selecting a live place will send the place payload to the backend and mirror it into the local restaurant table. Once mirrored, it can reuse existing restaurant detail, review, and favourite flows.

## UI And Copy

Ratings render as stars throughout the app instead of numeric score pills. Review forms still submit `1` to `5`, but options use natural labels such as `★★★★★ Loved it`.

Restaurant tags become actionable filter entry points: local detail tags link to Browse with `?tag=...`, and Browse reads that tag into its filter state.

## Testing

Backend tests cover mirroring Google Places into local restaurants and filtering restaurants by tag. Frontend tests cover star-only rating rendering, recommendation ranking, Google Places filtering, and escaped tag links.
