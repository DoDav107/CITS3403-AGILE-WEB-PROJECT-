(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const app = window.ForkFrame;
    const nameEl = app && app.$("#profileName");
    if (!nameEl) {
      return;
    }

    const renderProfile = function () {
      const profile = app.getProfile();
      const favorites = app.getFavorites().map(app.getRestaurantById).filter(Boolean);
      const reviews = app.getSavedReviews();

      nameEl.textContent = profile.name;
      app.$("#profileMeta").textContent = profile.city + " · " + profile.email;
      app.$("#profileTagline").textContent = profile.tagline;
      app.$("#profileFavoritesCount").textContent = String(favorites.length);
      app.$("#profileReviewsCount").textContent = String(reviews.length);
      app.$("#profileCuisineCount").textContent = String(
        new Set(
          favorites.map(function (restaurant) {
            return restaurant.cuisine;
          })
        ).size
      );

      app.$("#profileFavorites").innerHTML = favorites.length
        ? favorites.map(app.restaurantCard).join("")
        : '<div class="empty-state">No saved restaurants yet. Browse the directory and tap Save to start building a shortlist.</div>';

      app.$("#profileReviews").innerHTML = reviews.length
        ? reviews
            .map(function (review) {
              return app.reviewTile({
                author: review.restaurantName,
                date: review.date,
                rating: review.rating,
                text: review.text
              });
            })
            .join("")
        : '<div class="empty-state">No personal reviews yet. Write one to demonstrate how feedback would persist between sessions.</div>';

      app.syncFavoriteButtons(app.$("#profileFavorites"));
    };

    app.initFavoriteActions();
    document.addEventListener("app:favorites-changed", renderProfile);
    renderProfile();
  });
})();
