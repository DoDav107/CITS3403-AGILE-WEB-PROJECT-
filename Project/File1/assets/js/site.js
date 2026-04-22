(function (window) {
  "use strict";

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
      blurb:
        "A warm, open-kitchen dining room built around smoke, citrus, and small plates made for sharing.",
      tags: ["Woodfire", "Date night", "Cocktails"],
      mood: "Long dinner",
      menu: [
        { name: "Coal-grilled prawns", note: "Preserved lemon butter and dill oil" },
        { name: "Roasted carrots", note: "Whipped feta, cumin crunch, mint" },
        { name: "Half chicken over embers", note: "Burnt honey glaze and pickled shallots" }
      ],
      facts: ["Best after 7 pm", "Strong cocktail program", "Indoor + courtyard seating"],
      reviews: [
        {
          author: "Maya",
          rating: 5,
          date: "12 Mar 2026",
          text:
            "Confident flavours without feeling heavy. The prawns were the table favourite."
        },
        {
          author: "Jordan",
          rating: 4,
          date: "9 Mar 2026",
          text: "Great for a celebration dinner. Music was lively but service stayed sharp."
        }
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
      blurb:
        "A coastal Thai spot that leans into herbs, grilled seafood, and quick lunches that still feel memorable.",
      tags: ["Seafood", "Lunch", "Group friendly"],
      mood: "Fresh catch",
      menu: [
        { name: "Green papaya salad", note: "Peanuts, lime, crisp herbs" },
        { name: "Charcoal squid skewers", note: "Nam jim and charred spring onion" },
        { name: "Coconut turmeric curry", note: "Soft shell crab option available" }
      ],
      facts: ["Excellent at lunch", "Easy group ordering", "Walk-ins move fast"],
      reviews: [
        {
          author: "Sophie",
          rating: 5,
          date: "15 Mar 2026",
          text: "The balance of heat and acidity is spot on. Easy recommendation."
        }
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
      blurb:
        "A compact ramen and hand-roll bar designed for quick cravings, solo dinners, and late-night comfort.",
      tags: ["Ramen", "Late night", "Solo dining"],
      mood: "Comfort bowl",
      menu: [
        { name: "Black garlic tonkotsu", note: "Rich broth, spring onion, ajitama" },
        { name: "Yuzu shio ramen", note: "Clear broth, chicken oil, bamboo shoots" },
        {
          name: "Salmon hand roll set",
          note: "Three rolls with cucumber sesame salad"
        }
      ],
      facts: ["Best for solo dining", "Fast turnover", "Open late on weekends"],
      reviews: [
        {
          author: "Leo",
          rating: 4,
          date: "10 Mar 2026",
          text:
            "Fast service and properly hot broth. I would come back for the black garlic bowl."
        }
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
      blurb:
        "A polished Mediterranean dining room serving generous mezze, grilled proteins, and excellent late-evening desserts.",
      tags: ["Sharing plates", "Wine", "Celebration"],
      mood: "Big group",
      menu: [
        { name: "Whipped hummus trio", note: "Chilli crisp, herbs, smoked olive oil" },
        { name: "Lamb shoulder", note: "Slow roasted, pomegranate, dill yogurt" },
        {
          name: "Orange blossom cake",
          note: "Pistachio crumble and mascarpone"
        }
      ],
      facts: ["Good for shared feasts", "Strong dessert finish", "Reservations recommended"],
      reviews: [
        {
          author: "Aisha",
          rating: 5,
          date: "8 Mar 2026",
          text: "Generous, warm and polished. The lamb shoulder alone is worth the booking."
        }
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
      blurb:
        "A compact taqueria with bright sauces, vinyl nights, and the kind of menu built for casual repeat visits.",
      tags: ["Casual", "Quick bite", "Budget"],
      mood: "After work",
      menu: [
        { name: "Birria tacos", note: "Double dipped tortillas and consomme" },
        { name: "Grilled corn ribs", note: "Chipotle mayo and lime salt" },
        {
          name: "Frozen tamarind margarita",
          note: "Sharp, salty, refreshing"
        }
      ],
      facts: ["Budget friendly", "Best with friends", "Quick weeknight stop"],
      reviews: [
        {
          author: "Tariq",
          rating: 4,
          date: "11 Mar 2026",
          text: "Not precious, just fun. Great place when you want flavour quickly."
        }
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
      blurb:
        "A bright all-day cafe for market mornings, polished brunch plates, and coffee that keeps regulars returning.",
      tags: ["Brunch", "Coffee", "Vegetarian friendly"],
      mood: "Weekend brunch",
      menu: [
        {
          name: "Whipped ricotta toast",
          note: "Roasted grapes, thyme honey, seeds"
        },
        { name: "Green shakshuka", note: "Herb stew, feta, sourdough" },
        {
          name: "Cold brew flight",
          note: "Three rotating beans and tasting notes"
        }
      ],
      facts: ["Best before noon", "Great coffee", "Vegetarian options"],
      reviews: [
        {
          author: "Nina",
          rating: 4,
          date: "13 Mar 2026",
          text: "Reliable brunch with a genuinely thoughtful drinks menu."
        }
      ]
    }
  ];

  const RESTAURANTS_BY_ID = RESTAURANTS.reduce(function (acc, restaurant) {
    acc[restaurant.id] = restaurant;
    return acc;
  }, Object.create(null));

  const DEFAULT_PROFILE = {
    name: "Avery Tan",
    email: "avery@example.com",
    city: "Perth",
    tagline: "Chasing warm bowls, sharp cocktails, and places worth recommending."
  };

  let favoriteActionsInitialized = false;

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
    return RESTAURANTS_BY_ID[id] || undefined;
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

  const setFavoriteButtonState = function (button, isFavorite) {
    button.classList.toggle("is-favorite", isFavorite);
    button.setAttribute("aria-pressed", String(isFavorite));
    button.textContent = isFavorite ? "Saved" : "Save";
  };

  const updateFavoriteButtons = function (restaurantId, root) {
    const favorites = new Set(getFavorites());
    const selector =
      "[data-action='toggle-favorite'][data-restaurant-id='" + restaurantId + "']";

    $$(selector, root).forEach(function (button) {
      setFavoriteButtonState(button, favorites.has(restaurantId));
    });
  };

  const syncFavoriteButtons = function (root) {
    const favorites = new Set(getFavorites());

    $$("[data-action='toggle-favorite']", root).forEach(function (button) {
      setFavoriteButtonState(button, favorites.has(button.dataset.restaurantId));
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
    updateFavoriteButtons(restaurantId, document);
    document.dispatchEvent(
      new CustomEvent("app:favorites-changed", {
        detail: { restaurantId: restaurantId, isFavorite: !exists }
      })
    );

    return !exists;
  };

  const initFavoriteActions = function () {
    if (favoriteActionsInitialized) {
      return;
    }

    favoriteActionsInitialized = true;
    document.addEventListener("click", function (event) {
      const button = event.target.closest("[data-action='toggle-favorite']");
      if (!button) {
        return;
      }

      event.preventDefault();
      toggleFavorite(button.dataset.restaurantId);
    });
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
      '      <div class="muted-copy">' +
        formatStars(restaurant.rating) +
        " · " +
        restaurant.suburb +
        "</div>",
      '      <div class="inline-actions">',
      '        <button type="button" class="btn-ghost favorite-button" data-action="toggle-favorite" data-restaurant-id="' +
        restaurant.id +
        '">Save</button>',
      '        <a class="btn-brand" href="restaurant.html?id=' +
        restaurant.id +
        '">View</a>',
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

  window.ForkFrame = {
    $: $,
    $$: $$,
    RESTAURANTS: RESTAURANTS,
    STORAGE_KEYS: STORAGE_KEYS,
    DEFAULT_PROFILE: DEFAULT_PROFILE,
    getFavorites: getFavorites,
    getSavedReviews: getSavedReviews,
    getProfile: getProfile,
    getRestaurantById: getRestaurantById,
    getRestaurantReviews: getRestaurantReviews,
    formatStars: formatStars,
    todayLabel: todayLabel,
    showStatus: showStatus,
    syncFavoriteButtons: syncFavoriteButtons,
    updateFavoriteButtons: updateFavoriteButtons,
    toggleFavorite: toggleFavorite,
    initFavoriteActions: initFavoriteActions,
    restaurantCard: restaurantCard,
    reviewTile: reviewTile
  };
})(window);
