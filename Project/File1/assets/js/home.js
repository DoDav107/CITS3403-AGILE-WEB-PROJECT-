(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const app = window.ForkFrame;
    const featuredDeck = app && app.$("#featuredDeck");
    if (!featuredDeck) {
      return;
    }

    app.initFavoriteActions();
    featuredDeck.innerHTML = app.RESTAURANTS.slice(0, 3).map(app.restaurantCard).join("");
    app.syncFavoriteButtons(featuredDeck);
  });
})();
