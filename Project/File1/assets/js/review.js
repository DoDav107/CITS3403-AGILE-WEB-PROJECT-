(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const app = window.ForkFrame;
    const form = app && app.$("#reviewForm");
    if (!form) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const restaurant = app.getRestaurantById(params.get("id")) || app.RESTAURANTS[0];
    const ratingInput = app.$("#reviewRating");
    const textarea = app.$("#reviewText");
    const charCount = app.$("#reviewCharCount");
    const status = app.$("#reviewStatus");

    app.$("#reviewRestaurantName").textContent = restaurant.name;
    app.$("#reviewRestaurantMeta").textContent =
      restaurant.cuisine + " · " + restaurant.suburb + " · " + restaurant.price;
    app.$("#reviewBackLink").href = "restaurant.html?id=" + restaurant.id;

    app.$$(".star-button").forEach(function (button) {
      button.addEventListener("click", function () {
        const value = Number(button.dataset.value);
        ratingInput.value = String(value);
        app.$$(".star-button").forEach(function (star) {
          star.classList.toggle("is-active", Number(star.dataset.value) <= value);
        });
      });
    });

    textarea.addEventListener("input", function () {
      charCount.textContent = textarea.value.length + " / 280";
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const rating = Number(ratingInput.value);
      const text = textarea.value.trim();
      if (!rating || !text) {
        app.showStatus(
          status,
          "Choose a rating and write a short review before saving.",
          "error"
        );
        return;
      }

      const profile = app.getProfile();
      const reviews = app.getSavedReviews();
      reviews.unshift({
        id: "review-" + Date.now(),
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        author: profile.name,
        rating: rating,
        text: text,
        visit: app.$("#visitMoment").value,
        date: app.todayLabel()
      });
      window.localStorage.setItem(
        app.STORAGE_KEYS.reviews,
        JSON.stringify(reviews)
      );

      app.showStatus(
        status,
        "Review saved locally. Open your profile or the restaurant page to see it appear.",
        "success"
      );
      form.reset();
      ratingInput.value = "";
      charCount.textContent = "0 / 280";
      app.$$(".star-button").forEach(function (button) {
        button.classList.remove("is-active");
      });
    });
  });
})();
