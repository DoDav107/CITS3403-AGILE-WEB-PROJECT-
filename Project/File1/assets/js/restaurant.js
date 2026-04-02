(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const app = window.ForkFrame;
    const nameEl = app && app.$("#detailName");
    if (!nameEl) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const restaurant = app.getRestaurantById(params.get("id")) || app.RESTAURANTS[0];

    document.title = restaurant.name + " | Fork & Frame";
    app.$("#detailCover").className = "detail-cover " + restaurant.coverClass;
    app.$("#detailCover").textContent = restaurant.heroLabel;
    nameEl.textContent = restaurant.name;
    app.$("#detailCuisine").textContent = restaurant.cuisine;
    app.$("#detailSuburb").textContent = restaurant.suburb;
    app.$("#detailPrice").textContent = restaurant.price;
    app.$("#detailRating").textContent = restaurant.rating.toFixed(1) + " / 5";
    app.$("#detailDistance").textContent = restaurant.distance;
    app.$("#detailCopy").textContent = restaurant.blurb;
    app.$("#detailReviewLink").href = "review.html?id=" + restaurant.id;
    app.$("#detailFacts").innerHTML = restaurant.facts
      .map(function (fact) {
        return "<li>" + fact + "</li>";
      })
      .join("");
    app.$("#detailTags").innerHTML = restaurant.tags
      .map(function (tag) {
        return '<span class="tag-pill">' + tag + "</span>";
      })
      .join("");
    app.$("#detailMenu").innerHTML = restaurant.menu
      .map(function (item) {
        return [
          '<article class="menu-highlight">',
          '  <div class="menu-meta">',
          '    <strong>' + item.name + "</strong>",
          '    <span class="chip">Signature</span>',
          "  </div>",
          '  <p class="muted-copy mb-0">' + item.note + "</p>",
          "</article>"
        ].join("");
      })
      .join("");
    app.$("#detailReviews").innerHTML = app
      .getRestaurantReviews(restaurant.id)
      .map(app.reviewTile)
      .join("");

    const favoriteButton = app.$("#detailFavoriteButton");
    favoriteButton.dataset.restaurantId = restaurant.id;
    app.initFavoriteActions();
    app.syncFavoriteButtons(document);
  });
})();
