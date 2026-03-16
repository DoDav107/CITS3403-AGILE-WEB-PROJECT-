(function () {
  const STORAGE_KEYS = {
    favorites: "fork-frame-favorites",
    reviews: "fork-frame-reviews",
    profile: "fork-frame-profile"
  };

  const RESTAURANTS = [
    {
      id: "ember-lane",
      name: "Ember Lane",
      cuisine: "Modern Australian",
      suburb: "Northbridge",
      price: "$$$",
      rating: 4.8,
      distance: "8 min away",
      imageClass: "media-ember",
      coverClass: "media-ember",
      heroLabel: "Woodfire nights",
      blurb: "A warm, open-kitchen dining room built around smoke, citrus, and small plates made for sharing.",
      tags: ["Woodfire", "Date night", "Cocktails"],
      mood: "Long dinner",
      menu: [
        { name: "Coal-grilled prawns", note: "Preserved lemon butter and dill oil" },
        { name: "Roasted carrots", note: "Whipped feta, cumin crunch, mint" },
        { name: "Half chicken over embers", note: "Burnt honey glaze and pickled shallots" }
      ],
      facts: ["Best after 7 pm", "Strong cocktail program", "Indoor + courtyard seating"],
      reviews: [
        { author: "Maya", rating: 5, date: "12 Mar 2026", text: "Confident flavours without feeling heavy. The prawns were the table favourite." },
        { author: "Jordan", rating: 4, date: "9 Mar 2026", text: "Great for a celebration dinner. Music was lively but service stayed sharp." }
      ]
    },
    {
      id: "harbor-leaf",
      name: "Harbor Leaf",
      cuisine: "Thai",
      suburb: "Fremantle",
      price: "$$",
      rating: 4.6,
      distance: "18 min away",
      imageClass: "media-harbor",
      coverClass: "media-harbor",
      heroLabel: "Fresh, bright, fast",
      blurb: "A coastal Thai spot that leans into herbs, grilled seafood, and quick lunches that still feel memorable.",
      tags: ["Seafood", "Lunch", "Group friendly"],
      mood: "Fresh catch",
      menu: [
        { name: "Green papaya salad", note: "Peanuts, lime, crisp herbs" },
        { name: "Charcoal squid skewers", note: "Nam jim and charred spring onion" },
        { name: "Coconut turmeric curry", note: "Soft shell crab option available" }
      ],
      facts: ["Excellent at lunch", "Easy group ordering", "Walk-ins move fast"],
      reviews: [
        { author: "Sophie", rating: 5, date: "15 Mar 2026", text: "The balance of heat and acidity is spot on. Easy recommendation." }
      ]
    },
    {
      id: "noodle-theory",
      name: "Noodle Theory",
      cuisine: "Japanese",
      suburb: "Perth CBD",
      price: "$$",
      rating: 4.7,
      distance: "11 min away",
      imageClass: "media-noodle",
      coverClass: "media-noodle",
      heroLabel: "Broth with depth",
      blurb: "A compact ramen and hand-roll bar designed for quick cravings, solo dinners, and late-night comfort.",
      tags: ["Ramen", "Late night", "Solo dining"],
      mood: "Comfort bowl",
      menu: [
        { name: "Black garlic tonkotsu", note: "Rich broth, spring onion, ajitama" },
        { name: "Yuzu shio ramen", note: "Clear broth, chicken oil, bamboo shoots" },
        { name: "Salmon hand roll set", note: "Three rolls with cucumber sesame salad" }
      ],
      facts: ["Best for solo dining", "Fast turnover", "Open late on weekends"],
      reviews: [
        { author: "Leo", rating: 4, date: "10 Mar 2026", text: "Fast service and properly hot broth. I would come back for the black garlic bowl." }
      ]
    },
    {
      id: "copper-fig",
      name: "Copper Fig",
      cuisine: "Mediterranean",
      suburb: "Mount Lawley",
      price: "$$$",
      rating: 4.5,
      distance: "14 min away",
      imageClass: "media-copper",
      coverClass: "media-copper",
      heroLabel: "Shared table energy",
      blurb: "A polished Mediterranean dining room serving generous mezze, grilled proteins, and excellent late-evening desserts.",
      tags: ["Sharing plates", "Wine", "Celebration"],
      mood: "Big group",
      menu: [
        { name: "Whipped hummus trio", note: "Chilli crisp, herbs, smoked olive oil" },
        { name: "Lamb shoulder", note: "Slow roasted, pomegranate, dill yogurt" },
        { name: "Orange blossom cake", note: "Pistachio crumble and mascarpone" }
      ],
      facts: ["Good for shared feasts", "Strong dessert finish", "Reservations recommended"],
      reviews: [
        { author: "Aisha", rating: 5, date: "8 Mar 2026", text: "Generous, warm and polished. The lamb shoulder alone is worth the booking." }
      ]
    },
    {
      id: "orbit-taco-club",
      name: "Orbit Taco Club",
      cuisine: "Mexican",
      suburb: "Leederville",
      price: "$",
      rating: 4.4,
      distance: "9 min away",
      imageClass: "media-orbit",
      coverClass: "media-orbit",
      heroLabel: "Fast, loud, fun",
      blurb: "A compact taqueria with bright sauces, vinyl nights, and the kind of menu built for casual repeat visits.",
      tags: ["Casual", "Quick bite", "Budget"],
      mood: "After work",
      menu: [
        { name: "Birria tacos", note: "Double dipped tortillas and consomme" },
        { name: "Grilled corn ribs", note: "Chipotle mayo and lime salt" },
        { name: "Frozen tamarind margarita", note: "Sharp, salty, refreshing" }
      ],
      facts: ["Budget friendly", "Best with friends", "Quick weeknight stop"],
      reviews: [
        { author: "Tariq", rating: 4, date: "11 Mar 2026", text: "Not precious, just fun. Great place when you want flavour quickly." }
      ]
    },
    {
      id: "market-table",
      name: "Market Table",
      cuisine: "Cafe",
      suburb: "Subiaco",
      price: "$$",
      rating: 4.3,
      distance: "22 min away",
      imageClass: "media-market",
      coverClass: "media-market",
      heroLabel: "Slow brunch energy",
      blurb: "A bright all-day cafe for market mornings, polished brunch plates, and coffee that keeps regulars returning.",
      tags: ["Brunch", "Coffee", "Vegetarian friendly"],
      mood: "Weekend brunch",
      menu: [
        { name: "Whipped ricotta toast", note: "Roasted grapes, thyme honey, seeds" },
        { name: "Green shakshuka", note: "Herb stew, feta, sourdough" },
        { name: "Cold brew flight", note: "Three rotating beans and tasting notes" }
      ],
      facts: ["Best before noon", "Great coffee", "Vegetarian options"],
      reviews: [
        { author: "Nina", rating: 4, date: "13 Mar 2026", text: "Reliable brunch with a genuinely thoughtful drinks menu." }
      ]
    }
  ];

  const DEFAULT_PROFILE = {
    name: "Avery Tan",
    email: "avery@example.com",
    city: "Perth",
    tagline: "Chasing warm bowls, sharp cocktails, and places worth recommending."
  };

  const $ = function (selector, root) {
    return (root || document).querySelector(selector);
  };

  const $$ = function (selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  };

  const readJson = function (key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  };

  const writeJson = function (key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  const getFavorites = function () {
    return readJson(STORAGE_KEYS.favorites, []);
  };

  const getSavedReviews = function () {
    return readJson(STORAGE_KEYS.reviews, []);
  };

  const getProfile = function () {
    return Object.assign({}, DEFAULT_PROFILE, readJson(STORAGE_KEYS.profile, {}));
  };

  const getRestaurantById = function (id) {
    return RESTAURANTS.find(function (restaurant) {
      return restaurant.id === id;
    });
  };

  const getRestaurantReviews = function (restaurantId) {
    const restaurant = getRestaurantById(restaurantId);
    const seeded = restaurant ? restaurant.reviews : [];
    const saved = getSavedReviews()
      .filter(function (review) {
        return review.restaurantId === restaurantId;
      })
      .map(function (review) {
        return {
          author: review.author,
          rating: review.rating,
          date: review.date,
          text: review.text
        };
      });

    return saved.concat(seeded);
  };

  const formatStars = function (rating) {
    const fullStars = Math.max(1, Math.min(5, Math.round(rating)));
    return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
  };

  const todayLabel = function () {
    return new Date().toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const showStatus = function (element, message, tone) {
    if (!element) {
      return;
    }

    element.textContent = message;
    element.classList.remove("is-hidden");
    element.style.background =
      tone === "success"
        ? "color-mix(in oklab, var(--accent-soft) 70%, white)"
        : "color-mix(in oklab, oklch(0.91 0.05 40) 70%, white)";
  };

  const syncFavoriteButtons = function (root) {
    const favorites = new Set(getFavorites());
    $$("[data-action='toggle-favorite']", root).forEach(function (button) {
      const id = button.dataset.restaurantId;
      const isFavorite = favorites.has(id);
      button.classList.toggle("is-favorite", isFavorite);
      button.setAttribute("aria-pressed", String(isFavorite));
      button.textContent = isFavorite ? "Saved" : "Save";
    });
  };

  const toggleFavorite = function (restaurantId) {
    const current = getFavorites();
    const exists = current.includes(restaurantId);
    const next = exists
      ? current.filter(function (id) {
          return id !== restaurantId;
        })
      : current.concat(restaurantId);

    writeJson(STORAGE_KEYS.favorites, next);
    syncFavoriteButtons(document);
    document.dispatchEvent(new CustomEvent("app:favorites-changed"));
  };

  const restaurantCard = function (restaurant) {
    return [
      '<article class="restaurant-card fade-up">',
      '  <div class="card-media ' + restaurant.imageClass + '">' + restaurant.heroLabel + "</div>",
      '  <div class="card-body">',
      '    <div class="card-topline">',
      '      <span class="chip">' + restaurant.cuisine + "</span>",
      '      <span class="price-pill">' + restaurant.price + "</span>",
      "    </div>",
      '    <h3 class="restaurant-name">' + restaurant.name + "</h3>",
      '    <p class="card-copy">' + restaurant.blurb + "</p>",
      '    <div class="chip-row">',
      restaurant.tags
        .map(function (tag) {
          return '<span class="tag-pill">' + tag + "</span>";
        })
        .join(""),
      "    </div>",
      '    <div class="card-actions">',
      '      <div class="muted-copy">' + formatStars(restaurant.rating) + " · " + restaurant.suburb + "</div>",
      "      <div class=\"inline-actions\">",
      '        <button type="button" class="btn-ghost favorite-button" data-action="toggle-favorite" data-restaurant-id="' + restaurant.id + '">Save</button>',
      '        <a class="btn-brand" href="restaurant.html?id=' + restaurant.id + '">View</a>',
      "      </div>",
      "    </div>",
      "  </div>",
      "</article>"
    ].join("");
  };

  const reviewTile = function (review) {
    return [
      '<article class="review-tile fade-up">',
      '  <div class="review-meta">',
      '    <strong>' + review.author + "</strong>",
      '    <span class="muted-copy">' + review.date + "</span>",
      "  </div>",
      '  <div class="muted-copy">' + formatStars(review.rating) + "</div>",
      '  <p class="review-copy mb-0">' + review.text + "</p>",
      "</article>"
    ].join("");
  };

  const initHomePage = function () {
    const featuredDeck = $("#featuredDeck");
    if (!featuredDeck) {
      return;
    }

    const featured = RESTAURANTS.slice(0, 3);
    featuredDeck.innerHTML = featured.map(restaurantCard).join("");
    syncFavoriteButtons(featuredDeck);
  };

  const initBrowsePage = function () {
    const results = $("#browseResults");
    if (!results) {
      return;
    }

    const searchInput = $("#searchInput");
    const cuisineFilter = $("#cuisineFilter");
    const priceFilter = $("#priceFilter");
    const ratingFilter = $("#ratingFilter");
    const count = $("#resultsCount");

    const render = function () {
      const term = searchInput.value.trim().toLowerCase();
      const cuisine = cuisineFilter.value;
      const price = priceFilter.value;
      const rating = Number(ratingFilter.value || 0);

      const filtered = RESTAURANTS.filter(function (restaurant) {
        const matchesSearch =
          restaurant.name.toLowerCase().includes(term) ||
          restaurant.suburb.toLowerCase().includes(term) ||
          restaurant.cuisine.toLowerCase().includes(term) ||
          restaurant.tags.join(" ").toLowerCase().includes(term);

        const matchesCuisine = cuisine ? restaurant.cuisine === cuisine : true;
        const matchesPrice = price ? restaurant.price === price : true;
        const matchesRating = restaurant.rating >= rating;

        return matchesSearch && matchesCuisine && matchesPrice && matchesRating;
      });

      count.textContent = filtered.length + " places found";
      results.innerHTML = filtered.length
        ? filtered.map(restaurantCard).join("")
        : '<div class="empty-state">No matches yet. Try a broader suburb, a lower minimum rating, or remove one filter.</div>';
      syncFavoriteButtons(results);
    };

    [searchInput, cuisineFilter, priceFilter, ratingFilter].forEach(function (element) {
      element.addEventListener("input", render);
      element.addEventListener("change", render);
    });

    document.addEventListener("app:favorites-changed", render);
    render();
  };

  const populateRestaurantPage = function () {
    const nameEl = $("#detailName");
    if (!nameEl) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const restaurant = getRestaurantById(params.get("id")) || RESTAURANTS[0];

    document.title = restaurant.name + " | Fork & Frame";
    $("#detailCover").className = "detail-cover " + restaurant.coverClass;
    $("#detailCover").textContent = restaurant.heroLabel;
    nameEl.textContent = restaurant.name;
    $("#detailCuisine").textContent = restaurant.cuisine;
    $("#detailSuburb").textContent = restaurant.suburb;
    $("#detailPrice").textContent = restaurant.price;
    $("#detailRating").textContent = restaurant.rating.toFixed(1) + " / 5";
    $("#detailDistance").textContent = restaurant.distance;
    $("#detailCopy").textContent = restaurant.blurb;
    $("#detailReviewLink").href = "review.html?id=" + restaurant.id;
    $("#detailFacts").innerHTML = restaurant.facts
      .map(function (fact) {
        return "<li>" + fact + "</li>";
      })
      .join("");
    $("#detailTags").innerHTML = restaurant.tags
      .map(function (tag) {
        return '<span class="tag-pill">' + tag + "</span>";
      })
      .join("");
    $("#detailMenu").innerHTML = restaurant.menu
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
    $("#detailReviews").innerHTML = getRestaurantReviews(restaurant.id).map(reviewTile).join("");

    const favoriteButton = $("#detailFavoriteButton");
    favoriteButton.dataset.restaurantId = restaurant.id;
    syncFavoriteButtons(document);
  };

  const initReviewPage = function () {
    const form = $("#reviewForm");
    if (!form) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const restaurant = getRestaurantById(params.get("id")) || RESTAURANTS[0];
    const ratingInput = $("#reviewRating");
    const textarea = $("#reviewText");
    const charCount = $("#reviewCharCount");
    const status = $("#reviewStatus");

    $("#reviewRestaurantName").textContent = restaurant.name;
    $("#reviewRestaurantMeta").textContent = restaurant.cuisine + " · " + restaurant.suburb + " · " + restaurant.price;
    $("#reviewBackLink").href = "restaurant.html?id=" + restaurant.id;

    $$(".star-button").forEach(function (button) {
      button.addEventListener("click", function () {
        const value = Number(button.dataset.value);
        ratingInput.value = String(value);
        $$(".star-button").forEach(function (star) {
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
        showStatus(status, "Choose a rating and write a short review before saving.", "error");
        return;
      }

      const profile = getProfile();
      const reviews = getSavedReviews();
      reviews.unshift({
        id: "review-" + Date.now(),
        restaurantId: restaurant.id,
        restaurantName: restaurant.name,
        author: profile.name,
        rating: rating,
        text: text,
        visit: $("#visitMoment").value,
        date: todayLabel()
      });
      writeJson(STORAGE_KEYS.reviews, reviews);

      showStatus(status, "Review saved locally. Open your profile or the restaurant page to see it appear.", "success");
      form.reset();
      ratingInput.value = "";
      charCount.textContent = "0 / 280";
      $$(".star-button").forEach(function (button) {
        button.classList.remove("is-active");
      });
    });
  };

  const initProfilePage = function () {
    const nameEl = $("#profileName");
    if (!nameEl) {
      return;
    }

    const profile = getProfile();
    const favorites = getFavorites()
      .map(getRestaurantById)
      .filter(Boolean);
    const reviews = getSavedReviews();

    nameEl.textContent = profile.name;
    $("#profileMeta").textContent = profile.city + " · " + profile.email;
    $("#profileTagline").textContent = profile.tagline;
    $("#profileFavoritesCount").textContent = String(favorites.length);
    $("#profileReviewsCount").textContent = String(reviews.length);
    $("#profileCuisineCount").textContent = String(new Set(favorites.map(function (restaurant) {
      return restaurant.cuisine;
    })).size);

    $("#profileFavorites").innerHTML = favorites.length
      ? favorites.map(restaurantCard).join("")
      : '<div class="empty-state">No saved restaurants yet. Browse the directory and tap Save to start building a shortlist.</div>';

    $("#profileReviews").innerHTML = reviews.length
      ? reviews
          .map(function (review) {
            return reviewTile({
              author: review.restaurantName,
              date: review.date,
              rating: review.rating,
              text: review.text
            });
          })
          .join("")
      : '<div class="empty-state">No personal reviews yet. Write one to demonstrate how feedback would persist between sessions.</div>';

    syncFavoriteButtons(document);
  };

  const initAuthPages = function () {
    const form = $("#demoAuthForm");
    if (!form) {
      return;
    }

    const status = $("#authStatus");
    const page = document.body.dataset.page;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (page === "signup") {
        const profile = {
          name: $("#signupName").value || DEFAULT_PROFILE.name,
          email: $("#signupEmail").value || DEFAULT_PROFILE.email,
          city: $("#signupCity").value || DEFAULT_PROFILE.city,
          tagline: DEFAULT_PROFILE.tagline
        };
        writeJson(STORAGE_KEYS.profile, profile);
        showStatus(status, "Account details saved locally. Open the profile page to see the demo user state.", "success");
      } else {
        showStatus(status, "Signed in for the demo. This prototype keeps account behavior on the front end only.", "success");
      }
    });
  };

  const initGlobalActions = function () {
    document.addEventListener("click", function (event) {
      const button = event.target.closest("[data-action='toggle-favorite']");
      if (!button) {
        return;
      }

      event.preventDefault();
      toggleFavorite(button.dataset.restaurantId);
    });
  };

  document.addEventListener("DOMContentLoaded", function () {
    initGlobalActions();
    initHomePage();
    initBrowsePage();
    populateRestaurantPage();
    initReviewPage();
    initProfilePage();
    initAuthPages();
    syncFavoriteButtons(document);
  });
})();
