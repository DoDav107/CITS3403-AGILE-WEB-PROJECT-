(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const app = window.ForkFrame;
    const results = app && app.$("#browseResults");
    if (!results) {
      return;
    }

    const searchInput = app.$("#searchInput");
    const cuisineFilter = app.$("#cuisineFilter");
    const priceFilter = app.$("#priceFilter");
    const ratingFilter = app.$("#ratingFilter");
    const count = app.$("#resultsCount");

    const render = function () {
      const term = searchInput.value.trim().toLowerCase();
      const cuisine = cuisineFilter.value;
      const price = priceFilter.value;
      const rating = Number(ratingFilter.value || 0);

      const filtered = app.RESTAURANTS.filter(function (restaurant) {
        const matchesSearch =
          restaurant.name.toLowerCase().includes(term) ||
          restaurant.suburb.toLowerCase().includes(term) ||
          restaurant.cuisine.toLowerCase().includes(term) ||
          restaurant.tags.join(" ").toLowerCase().includes(term);

        return (
          matchesSearch &&
          (!cuisine || restaurant.cuisine === cuisine) &&
          (!price || restaurant.price === price) &&
          restaurant.rating >= rating
        );
      });

      count.textContent = filtered.length + " places found";
      results.innerHTML = filtered.length
        ? filtered.map(app.restaurantCard).join("")
        : '<div class="empty-state">No matches yet. Try a broader suburb, a lower minimum rating, or remove one filter.</div>';

      app.syncFavoriteButtons(results);
    };

    app.initFavoriteActions();
    searchInput.addEventListener("input", render);
    cuisineFilter.addEventListener("change", render);
    priceFilter.addEventListener("change", render);
    ratingFilter.addEventListener("change", render);
    render();
  });
})();
