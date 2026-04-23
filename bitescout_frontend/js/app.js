(function () {
  const root = typeof window !== 'undefined' ? window : globalThis;
  const LOCAL_LOCATION_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

  function isLocalLocationHostname(hostname = '') {
    return LOCAL_LOCATION_HOSTNAMES.has(String(hostname).toLowerCase());
  }

  function isGeolocationOriginAllowed(env = {}) {
    const hostname = String(env.hostname || '').toLowerCase();
    return Boolean(env.isSecureContext) || isLocalLocationHostname(hostname);
  }

  function buildLocationErrorMessage(error = {}, env = {}) {
    if (!isGeolocationOriginAllowed(env)) {
      return 'Location access requires HTTPS. Open this site on localhost, 127.0.0.1, or HTTPS and try again.';
    }

    switch (error.code) {
      case 1:
        return 'Location permission was denied. Allow location access for this site in your browser settings, then try again.';
      case 2:
        return 'Your device could not determine a location. Check Location Services, then try again or search manually.';
      case 3:
        return 'Location request timed out. Try again, or search for a suburb or postcode manually.';
      default:
        return 'Your current location is unavailable right now. Check browser permissions or Location Services, then try again.';
    }
  }

  const LOCATION_STORAGE_MAX_AGE_MS = 1000 * 60 * 60 * 6;

  function normalizeStoredUserLocation(value, now = Date.now()) {
    if (!value || typeof value !== 'object') return null;

    const lat = Number(value.lat);
    const lng = Number(value.lng);
    const savedAt = Number(value.savedAt);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (!Number.isFinite(savedAt)) return null;
    if (now - savedAt > LOCATION_STORAGE_MAX_AGE_MS) return null;

    return { lat, lng };
  }

  function createStoredUserLocation(coords, now = Date.now()) {
    return {
      lat: Number(coords.lat),
      lng: Number(coords.lng),
      savedAt: now
    };
  }

  function escapeHtml(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function encodeRouteValue(value = '') {
    return encodeURIComponent(String(value));
  }

  const STORAGE_KEYS = {
    userLocation: 'bitescout_user_location'
  };


  const data = root.BiteScoutData || { restaurants: [], sampleUsers: [], sampleReviews: [] };

  const App = {
    state: {
      currentUser: null,
      restaurants: [],
      reviews: [],
      favourites: { restaurants: [], dishes: [] }
    },

    async init() {
      await this.bootstrap();
      this.renderLayout();
      await this.routePage();
    },

    async bootstrap() {
      await Promise.all([this.loadCurrentUser(), this.loadRestaurants()]);
    },

    async api(path, options = {}) {
      const config = {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        ...options
      };

      if (config.body && !(config.body instanceof FormData)) {
        config.headers = { 'Content-Type': 'application/json', ...config.headers };
        config.body = JSON.stringify(config.body);
      }

      const response = await fetch(path, config);
      const contentType = response.headers.get('content-type') || '';
      const payload = contentType.includes('application/json') ? await response.json() : await response.text();

      if (!response.ok) {
        const message = typeof payload === 'object' && payload && payload.error ? payload.error : 'Request failed';
        throw new Error(message);
      }

      return payload;
    },

    async loadCurrentUser() {
      try {
        const payload = await this.api('/api/auth/me');
        this.state.currentUser = payload.user;
      } catch (error) {
        this.state.currentUser = null;
      }
    },

    async loadRestaurants(force = false) {
      if (this.state.restaurants.length && !force) return this.state.restaurants;
      this.state.restaurants = await this.api('/api/restaurants');
      return this.state.restaurants;
    },

    async loadReviews(force = false) {
      if (this.state.reviews.length && !force) return this.state.reviews;
      this.state.reviews = await this.api('/api/reviews');
      return this.state.reviews;
    },

    async loadFavourites(force = false) {
      if (!this.state.currentUser) {
        this.state.favourites = { restaurants: [], dishes: [] };
        return this.state.favourites;
      }
      if ((this.state.favourites.restaurants.length || this.state.favourites.dishes.length) && !force) {
        return this.state.favourites;
      }
      this.state.favourites = await this.api('/api/favourites');
      return this.state.favourites;
    },

    initRecommendations() {
      const target = document.getElementById('recommendationsGrid');
      const detectBtn = document.getElementById('detectLocationBtn');
      const searchBtn = document.getElementById('searchLocationBtn');
      const resetBtn = document.getElementById('resetRecommendationsBtn');
      const manualInput = document.getElementById('manualLocationInput');
      const radiusSelect = document.getElementById('recommendationRadius');
      const typeSelect = document.getElementById('recommendationType');
      const minRatingSelect = document.getElementById('minGoogleRating');
    
      if (!target || !detectBtn || !searchBtn || !resetBtn) return;
    
      let lastCoords = null;
      let lastResults = [];
      let lastSearchLabel = '';
    
      const renderPlaces = (places) => {
        target.innerHTML = places.length
          ? places.map(place => this.renderGooglePlaceCard(place)).join('')
          : this.emptyState('No nearby places matched the selected filters.');
      };
    
      const reRenderFromCurrentResults = () => {
        const minRating = parseFloat(minRatingSelect?.value || '0');
        const filtered = this.filterGooglePlaces(lastResults, minRating);
        renderPlaces(filtered);
        if (lastResults.length) {
          this.showMessage(
            'recommendationStatus',
            `Showing ${filtered.length} nearby place${filtered.length === 1 ? '' : 's'}${lastSearchLabel ? ` for ${lastSearchLabel}` : ''}.`,
            'info'
          );
        }
      };
    
      const currentRadius = () => parseInt(radiusSelect?.value || '8000', 10);
      const currentTypes = () =>
        (typeSelect?.value || 'restaurant,cafe')
          .split(',')
          .map(value => value.trim())
          .filter(Boolean);
    
      const loadNearbyPlaces = async (coords, label = 'your location') => {
        this.showMessage('recommendationStatus', `Loading nearby places for ${label}...`, 'info');
    
        try {
          const results = await this.fetchNearbyGooglePlaces(coords, currentRadius(), currentTypes(), 12);
          lastCoords = coords;
          lastResults = results;
          lastSearchLabel = label;
          if (label === 'your location') this.setUserLocation(coords);
    
          reRenderFromCurrentResults();
    
          const visibleCount = this.filterGooglePlaces(results, parseFloat(minRatingSelect?.value || '0')).length;
          this.showMessage(
            'recommendationStatus',
            `Loaded ${visibleCount} nearby place${visibleCount === 1 ? '' : 's'} for ${label}.`,
            'success'
          );
        } catch (error) {
          this.showMessage('recommendationStatus', error.message, 'error');
          target.innerHTML = this.emptyState('Unable to load nearby places right now.');
        }
      };
    
      const loadManualLocation = async () => {
        const address = manualInput?.value.trim();
        if (!address) {
          this.showMessage('recommendationStatus', 'Please enter a suburb, postcode, or address first.', 'error');
          return;
        }
    
        this.showMessage('recommendationStatus', `Looking up ${address}...`, 'info');
    
        try {
          const payload = await this.searchGooglePlacesByAddress(address, currentRadius(), currentTypes(), 12);
    
          const coords = {
            lat: payload.searchLocation.lat,
            lng: payload.searchLocation.lng
          };
    
          lastCoords = coords;
          lastResults = payload.results || [];
          lastSearchLabel = payload.searchLocation.formattedAddress || address;
    
          reRenderFromCurrentResults();
    
          const visibleCount = this.filterGooglePlaces(lastResults, parseFloat(minRatingSelect?.value || '0')).length;
          this.showMessage(
            'recommendationStatus',
            `Loaded ${visibleCount} nearby place${visibleCount === 1 ? '' : 's'} for ${lastSearchLabel}.`,
            'success'
          );
        } catch (error) {
          this.showMessage('recommendationStatus', error.message, 'error');
          target.innerHTML = this.emptyState('Unable to load nearby places for that location.');
        }
      };
    
      detectBtn.addEventListener('click', () => {
        this.requestLocation('recommendationStatus', async coords => {
          await loadNearbyPlaces(coords, 'your location');
        });
      });
    
      searchBtn.addEventListener('click', async () => {
        await loadManualLocation();
      });
    
      manualInput?.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          await loadManualLocation();
        }
      });
    
      resetBtn.addEventListener('click', () => {
        lastCoords = null;
        lastResults = [];
        lastSearchLabel = '';
        if (manualInput) manualInput.value = '';
        target.innerHTML = this.emptyState('Use your current location or type another location to load live nearby recommendations.');
        this.showMessage('recommendationStatus', 'Cleared nearby results.', 'info');
      });
    
      minRatingSelect?.addEventListener('change', () => {
        if (lastResults.length) reRenderFromCurrentResults();
      });
    
      radiusSelect?.addEventListener('change', async () => {
        if (lastCoords && lastSearchLabel) {
          await loadNearbyPlaces(lastCoords, lastSearchLabel);
        }
      });
    
      typeSelect?.addEventListener('change', async () => {
        if (lastCoords && lastSearchLabel) {
          await loadNearbyPlaces(lastCoords, lastSearchLabel);
        }
      });
    
      target.innerHTML = this.emptyState('Use your current location or type another location to load live nearby recommendations.');
      this.showMessage('recommendationStatus', 'Ready to search nearby places.', 'info');
    },
    
    async routePage() {
      const page = document.body.dataset.page;
      const routes = {
        home: () => this.initHome(),
        signup: () => this.initSignup(),
        login: () => this.initLogin(),
        browse: () => this.initBrowse(),
        restaurant: () => this.initRestaurantPage(),
        dish: () => this.initDishPage(),
        'write-review': () => this.initWriteReview(),
        'edit-review': () => this.initEditReview(),
        profile: () => this.initProfile(),
        user: () => this.initOtherUser(),
        recommendations: () => this.initRecommendations(),
        favourites: () => this.initFavourites(),
        about: () => this.initAbout(),
        logout: () => this.initLogout()
      };
      if (routes[page]) await routes[page]();
    },

    renderLayout() {
      const user = this.getCurrentUser();
      const header = document.getElementById('site-header');
      const footer = document.getElementById('site-footer');
      const firstName = user ? escapeHtml((user.name || 'User').split(' ')[0]) : '';
      if (header) {
        header.innerHTML = `
          <nav class="navbar navbar-expand-lg bg-white border-bottom sticky-top">
            <div class="container py-2">
              <a class="navbar-brand d-flex align-items-center gap-2" href="index.html">
                <span class="badge rounded-pill text-bg-dark">BS</span>
                <strong>BiteScout</strong>
              </a>
              <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
                <span class="navbar-toggler-icon"></span>
              </button>
              <div class="collapse navbar-collapse" id="navMenu">
                <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                  ${this.navLink('browse.html', 'Browse')}
                  ${this.navLink('recommendations.html', 'Recommendations')}
                  ${this.navLink('favourites.html', 'Favourites')}
                  ${this.navLink('about.html', 'About')}
                </ul>
                <div class="d-flex align-items-center gap-2">
                  ${user ? `<a class="btn btn-outline-dark btn-sm" href="profile.html">${firstName}'s profile</a><a class="btn btn-primary btn-sm" href="logout.html">Log out</a>` : `<a class="btn btn-outline-dark btn-sm" href="login.html">Log in</a><a class="btn btn-primary btn-sm" href="signup.html">Sign up</a>`}
                </div>
              </div>
            </div>
          </nav>
        `;
      }
      if (footer) {
        footer.innerHTML = `
          <footer class="site-footer py-4 mt-5">
            <div class="container d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-center">
              <div>
                <strong>BiteScout</strong>
                <p class="footer-note mb-0">Food discovery and review website starter built with HTML, CSS, JavaScript and Bootstrap.</p>
              </div>
              <div class="d-flex gap-3">
                <a href="browse.html" class="text-decoration-none">Browse</a>
                <a href="recommendations.html" class="text-decoration-none">Nearby</a>
                <a href="about.html" class="text-decoration-none">Help</a>
              </div>
            </div>
          </footer>
        `;
      }
      this.highlightActiveNav();
    },

    navLink(href, label) {
      return `<li class="nav-item"><a class="nav-link" href="${href}">${label}</a></li>`;
    },

    highlightActiveNav() {
      const current = window.location.pathname.split('/').pop() || 'index.html';
      document.querySelectorAll('.nav-link').forEach(link => {
        if (link.getAttribute('href') === current) link.classList.add('active');
      });
    },

    getCurrentUser() {
      return this.state.currentUser;
    },

    getRestaurantById(id) {
      return this.state.restaurants.find(r => r.id === id) || data.restaurants.find(r => r.id === id) || null;
    },

    getDish(restaurantId, dishId) {
      const restaurant = this.getRestaurantById(restaurantId);
      if (!restaurant || !restaurant.dishes) return null;
      return restaurant.dishes.find(dish => dish.id === dishId) || null;
    },

    getAllReviews() {
      return [...this.state.reviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    getStoredUserLocationRecord() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.userLocation) || 'null');
      } catch (error) {
        return null;
      }
    },

    getUserLocation() {
      const location = normalizeStoredUserLocation(this.getStoredUserLocationRecord());
      if (!location) this.clearUserLocation();
      return location;
    },

    setUserLocation(coords) {
      localStorage.setItem(STORAGE_KEYS.userLocation, JSON.stringify(createStoredUserLocation(coords)));
    },

    clearUserLocation() {
      localStorage.removeItem(STORAGE_KEYS.userLocation);
    },

    formatDate(dateStr) {
      return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    },

    getDisplayUser(userId, inlineUser = null) {
      if (inlineUser) return inlineUser;
      if (this.state.currentUser && this.state.currentUser.id === userId) return this.state.currentUser;
      return data.sampleUsers.find(user => user.id === userId) || { id: userId, name: 'Unknown User', username: 'unknown' };
    },

    haversine(lat1, lon1, lat2, lon2) {
      const toRad = value => (value * Math.PI) / 180;
      const earthRadiusKm = 6371;
      const deltaLat = toRad(lat2 - lat1);
      const deltaLng = toRad(lon2 - lon1);
      const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(deltaLng / 2) ** 2;
      return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    },

    attachDistance(restaurants, coords) {
      return restaurants.map(restaurant => ({
        ...restaurant,
        distanceKm: coords ? this.haversine(coords.lat, coords.lng, restaurant.lat, restaurant.lng) : null
      }));
    },

    renderRestaurantCard(restaurant) {
      const distanceHtml = restaurant.distanceKm != null ? `<span class="distance-pill">📍 ${restaurant.distanceKm.toFixed(1)} km</span>` : '';
      const restaurantImages = {
        'Harbour Roast': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1000',
        'Saigon Alley': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&q=80&w=1000',
        'Sora Sushi Bar': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=1000'
      };
      const imageUrl = restaurantImages[restaurant.name] || '';
      const imageHtml = imageUrl
        ? `<img src="${imageUrl}" alt="${this.escapeHtml(restaurant.name)}" class="restaurant-image-img" style="width:100%;height:100%;object-fit:cover;border-radius:1rem;" />`
        : `<div class="restaurant-image mb-3">${this.escapeHtml(restaurant.name)}</div>`;
      const restaurantId = encodeRouteValue(restaurant.id);
      return `
        <div class="col-md-6 col-xl-4">
          <div class="restaurant-card p-3 d-flex flex-column">
            <div class="restaurant-image mb-3 position-relative overflow-hidden">${imageHtml}</div>
            <div class="d-flex flex-wrap mb-2">
              <span class="rating-pill">⭐ ${restaurant.rating}</span>
              <span class="price-pill">${escapeHtml(restaurant.price)}</span>
              <span class="cuisine-pill">${escapeHtml(restaurant.cuisine)}</span>
              ${distanceHtml}
            </div>
            <h3 class="h5 fw-bold">${escapeHtml(restaurant.name)}</h3>
            <p class="text-secondary mb-2">${escapeHtml(restaurant.suburb)} • ${escapeHtml(restaurant.address)}</p>
            <p class="text-secondary">${escapeHtml(restaurant.blurb)}</p>
            <div class="d-flex gap-2 mt-auto pt-2">
              <a class="btn btn-primary btn-sm" href="restaurant.html?id=${restaurantId}">View details</a>
              <button class="btn btn-outline-dark btn-sm save-restaurant-trigger" data-id="${restaurantId}">Save</button>
            </div>
          </div>
        </div>
      `;
    },

    renderDishCard(restaurant, dish) {
      const restaurantId = encodeRouteValue(restaurant.id);
      const dishId = encodeRouteValue(dish.id);
      return `
        <div class="col-md-6">
          <div class="dish-card p-3">
            <h3 class="h5 fw-bold mb-2">${escapeHtml(dish.name)}</h3>
            <div class="d-flex flex-wrap mb-2">
              <span class="rating-pill">⭐ ${dish.rating}</span>
              <span class="price-pill">$${dish.price}</span>
            </div>
            <p class="text-secondary">${escapeHtml(dish.description)}</p>
            <div class="d-flex gap-2">
              <a class="btn btn-primary btn-sm" href="dish.html?restaurant=${restaurantId}&dish=${dishId}">View dish</a>
              <button class="btn btn-outline-dark btn-sm save-dish-trigger" data-id="${dishId}" data-restaurant="${restaurantId}">Save</button>
            </div>
          </div>
        </div>
      `;
    },

    renderReviewCard(review, own = false) {
      const user = this.getDisplayUser(review.userId, review.user);
      const restaurant = this.getRestaurantById(review.restaurantId);
      const dish = review.dishId ? this.getDish(review.restaurantId, review.dishId) : null;
      const editable = own && !String(review.id).startsWith('sr');
      const manageButton = editable ? `<a class="btn btn-outline-dark btn-sm" href="edit-review.html?id=${encodeRouteValue(review.id)}">Edit</a>` : '';
      const reviewMeta = [
        `By <a href="user.html?id=${encodeRouteValue(user.id)}">${escapeHtml(user.name)}</a>`,
        escapeHtml(this.formatDate(review.createdAt))
      ];
      if (restaurant) reviewMeta.push(escapeHtml(restaurant.name));
      if (dish) reviewMeta.push(escapeHtml(dish.name));
      return `
        <div class="review-card p-3 mb-3">
          <div class="d-flex justify-content-between align-items-start gap-3 mb-2">
            <div>
              <h3 class="h5 fw-bold mb-1">${escapeHtml(review.title)}</h3>
              <div class="review-meta">${reviewMeta.join(' • ')}</div>
            </div>
            <div class="text-end">
              <span class="rating-pill">⭐ ${review.rating}</span>
              ${manageButton}
            </div>
          </div>
          <p class="mb-0 text-secondary">${escapeHtml(review.content)}</p>
        </div>
      `;
    },

    escapeHtml(value = '') {
      return escapeHtml(value);
    },

    formatPlaceType(type = '') {
      return type
        .replaceAll('_', ' ')
        .replace(/\b\w/g, char => char.toUpperCase());
    },

    googleMapsUrl(place) {
      if (place.lat == null || place.lng == null) return '#';
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.lat},${place.lng}`)}`;
    },

    async searchGooglePlacesByAddress(address, radius = 8000, includedTypes = ['restaurant', 'cafe'], maxResultCount = 12) {
      const payload = await this.api('/api/google/search-location', {
        method: 'POST',
        body: {
          address,
          radius,
          includedTypes,
          maxResultCount
        }
      });
    
      return payload;
    },

    renderGooglePlaceCard(place) {
      const tagHtml = (place.types || [])
        .filter(type => !['point_of_interest', 'establishment', 'food', 'store'].includes(type))
        .slice(0, 3)
        .map(type => `<span class="badge badge-soft">${escapeHtml(this.formatPlaceType(type))}</span>`)
        .join('');

      return `
        <div class="col-md-6 col-xl-4">
          <div class="restaurant-card p-3 h-100">
            <div class="restaurant-image mb-3">${escapeHtml(place.name || 'Nearby place')}</div>
            <div class="d-flex flex-wrap mb-2">
              <span class="rating-pill">⭐ ${place.rating ?? 'N/A'}</span>
              <span class="cuisine-pill">${escapeHtml(this.formatPlaceType(place.primaryType || 'place'))}</span>
            </div>
            <h3 class="h5 fw-bold">${escapeHtml(place.name || 'Unnamed place')}</h3>
            <p class="text-secondary mb-2">${escapeHtml(place.address || 'Address unavailable')}</p>
            <div class="d-flex flex-wrap gap-2 mb-3">${tagHtml}</div>
            <div class="d-flex gap-2">
              <a class="btn btn-primary btn-sm" href="${this.googleMapsUrl(place)}" target="_blank" rel="noopener noreferrer">Open map</a>
            </div>
          </div>
        </div>
      `;
    },

    async fetchNearbyGooglePlaces(coords, radius = 8000, includedTypes = ['restaurant', 'cafe'], maxResultCount = 12) {
      const payload = await this.api('/api/google/nearby', {
        method: 'POST',
        body: {
          lat: coords.lat,
          lng: coords.lng,
          radius,
          includedTypes,
          maxResultCount
        }
      });

      return payload.results || [];
    },

    filterGooglePlaces(places, minRating = 0) {
      const blockedPrimaryTypes = new Set([
        'gas_station',
        'indoor_playground',
        'playground',
        'amusement_center'
      ]);

      return places.filter(place => {
        const primaryType = (place.primaryType || '').toLowerCase();
        const rating = Number(place.rating || 0);

        if (blockedPrimaryTypes.has(primaryType)) return false;
        if (rating < minRating) return false;

        return true;
      });
    },

    emptyState(message) {
      return `<div class="empty-state">${escapeHtml(message)}</div>`;
    },

    showMessage(targetId, message, type = 'info') {
      const element = document.getElementById(targetId);
      if (!element) return;
      const classes = {
        info: 'text-secondary',
        success: 'text-success',
        error: 'text-danger'
      };
      element.className = classes[type] || 'text-secondary';
      element.textContent = message;
    },

    async initHome() {
      const target = document.getElementById('homeTrending');
      if (target) {
        const cards = [...this.state.restaurants]
          .sort((left, right) => right.rating - left.rating)
          .slice(0, 3)
          .map(restaurant => this.renderRestaurantCard(restaurant))
          .join('');
        target.innerHTML = cards;
        this.bindSaveButtons();
      }

      const heroSearchInput = document.getElementById('heroSearchInput');
      const heroSearchBtn = document.getElementById('heroSearchBtn');
      if (heroSearchInput && heroSearchBtn) {
        const doSearch = () => {
          const query = heroSearchInput.value.trim();
          if (query) window.location.href = `browse.html?search=${encodeURIComponent(query)}`;
        };
        heroSearchBtn.addEventListener('click', doSearch);
        heroSearchInput.addEventListener('keydown', event => {
          if (event.key === 'Enter') { event.preventDefault(); doSearch(); }
        });
      }
    },

    initSignup() {
      const form = document.getElementById('signupForm');
      if (!form) return;
      form.addEventListener('submit', async event => {
        event.preventDefault();
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        try {
          await this.api('/api/auth/signup', { method: 'POST', body: payload });
          await this.loadCurrentUser();
          this.renderLayout();
          this.showMessage('signupMessage', 'Account created. Redirecting to your profile...', 'success');
          window.setTimeout(() => {
            window.location.href = 'profile.html';
          }, 900);
        } catch (error) {
          this.showMessage('signupMessage', error.message, 'error');
        }
      });
    },

    initLogin() {
      const form = document.getElementById('loginForm');
      if (!form) return;
      form.addEventListener('submit', async event => {
        event.preventDefault();
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        try {
          await this.api('/api/auth/login', { method: 'POST', body: payload });
          await this.loadCurrentUser();
          this.renderLayout();
          this.showMessage('loginMessage', 'Logged in successfully. Redirecting...', 'success');
          window.setTimeout(() => {
            window.location.href = 'profile.html';
          }, 900);
        } catch (error) {
          this.showMessage('loginMessage', error.message, 'error');
        }
      });
    },

    initBrowse() {
      const cuisineSelect = document.getElementById('cuisineFilter');
      const manualLocationInput = document.getElementById('browseManualLocationInput');
      const manualLocationBtn = document.getElementById('browseSearchLocationBtn');
      const clearLocationBtn = document.getElementById('browseClearLocationBtn');
      const cuisines = [...new Set(this.state.restaurants.map(restaurant => restaurant.cuisine))];
      const searchInput = document.getElementById('searchInput');
      const urlSearch = new URLSearchParams(window.location.search).get('search');
      if (urlSearch && searchInput) searchInput.value = urlSearch;
      cuisineSelect.innerHTML = `<option value="">Any</option>${cuisines.map(cuisine => `<option value="${escapeHtml(cuisine)}">${escapeHtml(cuisine)}</option>`).join('')}`;
      const render = () => {
        const search = searchInput.value.trim().toLowerCase();
        const cuisine = cuisineSelect.value;
        const price = document.getElementById('priceFilter').value;
        const rating = parseFloat(document.getElementById('ratingFilter').value || '0');
        const coords = this.getUserLocation();
        let restaurants = this.attachDistance(this.state.restaurants, coords);
        restaurants = restaurants.filter(restaurant => {
          const tags = Array.isArray(restaurant.tags) ? restaurant.tags.join(' ') : '';
          const haystack = `${restaurant.name} ${restaurant.suburb} ${restaurant.cuisine} ${tags}`.toLowerCase();
          return (!search || haystack.includes(search)) && (!cuisine || restaurant.cuisine === cuisine) && (!price || restaurant.price === price) && restaurant.rating >= rating;
        });
        if (coords) restaurants.sort((left, right) => (left.distanceKm ?? 999) - (right.distanceKm ?? 999));
        document.getElementById('browseResults').innerHTML = restaurants.length ? restaurants.map(restaurant => this.renderRestaurantCard(restaurant)).join('') : this.emptyState('No restaurants matched those filters.');
        document.getElementById('resultsCount').textContent = `${restaurants.length} place${restaurants.length === 1 ? '' : 's'} found`;
        this.bindSaveButtons();
      };
      ['searchInput', 'cuisineFilter', 'priceFilter', 'ratingFilter'].forEach(id => document.getElementById(id).addEventListener('input', render));
      document.getElementById('useLocationBrowse').addEventListener('click', () => {
        this.requestLocation('browseLocationMessage', coords => {
          this.setUserLocation(coords);
          this.showMessage('browseLocationMessage', 'Location saved. Results are now sorted by distance from you.', 'success');
          render();
        });
      });

      const searchBrowseLocation = async () => {
        const address = manualLocationInput?.value.trim();
        if (!address) {
          this.showMessage('browseLocationMessage', 'Enter a suburb, postcode, or address to sort results by distance.', 'error');
          return;
        }

        this.showMessage('browseLocationMessage', `Looking up ${address}...`, 'info');

        try {
          const payload = await this.searchGooglePlacesByAddress(address, 3000, ['restaurant', 'cafe'], 1);
          const coords = {
            lat: payload.searchLocation.lat,
            lng: payload.searchLocation.lng
          };

          this.setUserLocation(coords);
          this.showMessage(
            'browseLocationMessage',
            `Using ${payload.searchLocation.formattedAddress || address} to sort results by distance.`,
            'success'
          );
          render();
        } catch (error) {
          this.showMessage('browseLocationMessage', error.message, 'error');
        }
      };

      manualLocationBtn?.addEventListener('click', async () => {
        await searchBrowseLocation();
      });

      manualLocationInput?.addEventListener('keydown', async event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          await searchBrowseLocation();
        }
      });

      clearLocationBtn?.addEventListener('click', () => {
        this.clearUserLocation();
        if (manualLocationInput) manualLocationInput.value = '';
        this.showMessage('browseLocationMessage', 'Cleared saved location. Results are no longer sorted by distance.', 'info');
        render();
      });

      if (this.getUserLocation()) {
        this.showMessage('browseLocationMessage', 'Using your saved location to sort results by distance.', 'info');
      }
      render();
    },

    async initRestaurantPage() {
      const id = new URLSearchParams(window.location.search).get('id');
      if (!id) return;
      try {
        const [restaurant, reviews] = await Promise.all([
          this.api(`/api/restaurants/${id}`),
          this.api(`/api/restaurants/${id}/reviews`)
        ]);
        this.upsertRestaurant(restaurant);
        const average = reviews.length ? (reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length).toFixed(1) : restaurant.rating.toFixed(1);
        const safeTags = (restaurant.tags || []).map(tag => escapeHtml(tag)).join(', ');
        document.getElementById('restaurantHero').innerHTML = `
          <p class="eyebrow mb-2">Restaurant details</p>
          <div class="row g-4 align-items-center">
            <div class="col-lg-8">
              <h1 class="fw-bold mb-3">${escapeHtml(restaurant.name)}</h1>
              <p class="text-secondary mb-3">${escapeHtml(restaurant.suburb)} • ${escapeHtml(restaurant.address)}</p>
              <div class="d-flex flex-wrap">
                <span class="rating-pill">⭐ ${average}</span>
                <span class="price-pill">${escapeHtml(restaurant.price)}</span>
                <span class="cuisine-pill">${escapeHtml(restaurant.cuisine)}</span>
              </div>
            </div>
            <div class="col-lg-4"><div class="detail-image">${escapeHtml(restaurant.name)}</div></div>
          </div>
        `;
        document.getElementById('restaurantAbout').innerHTML = `
          <h2 class="h4 fw-bold mb-3">About this place</h2>
          <p class="text-secondary">${escapeHtml(restaurant.blurb)}</p>
          <p class="mb-0 text-secondary"><strong>Popular tags:</strong> ${safeTags}</p>
        `;
        document.getElementById('restaurantDishes').innerHTML = (restaurant.dishes || []).map(dish => this.renderDishCard(restaurant, dish)).join('');
        document.getElementById('restaurantReviews').innerHTML = reviews.length ? reviews.map(review => this.renderReviewCard(review, this.getCurrentUser() && this.getCurrentUser().id === review.userId)).join('') : this.emptyState('No reviews yet. Be the first to share your experience.');
        document.getElementById('restaurantSidebar').innerHTML = `
          <h3 class="h5 fw-bold mb-3">Quick facts</h3>
          <p class="mb-2"><strong>Cuisine:</strong> ${escapeHtml(restaurant.cuisine)}</p>
          <p class="mb-2"><strong>Price range:</strong> ${escapeHtml(restaurant.price)}</p>
          <p class="mb-2"><strong>Average rating:</strong> ${average}</p>
          <p class="mb-0"><strong>Dishes listed:</strong> ${(restaurant.dishes || []).length}</p>
        `;
        document.getElementById('saveRestaurantBtn').addEventListener('click', async () => {
          await this.saveRestaurant(restaurant.id, 'saveRestaurantMessage');
        });
        this.bindSaveButtons();
      } catch (error) {
        this.showFullPageNotice(error.message, 'browse.html');
      }
    },

    async initDishPage() {
      const params = new URLSearchParams(window.location.search);
      const restaurantId = params.get('restaurant');
      const dishId = params.get('dish');
      if (!restaurantId || !dishId) return;
      try {
        const [restaurant, dish, reviews] = await Promise.all([
          this.api(`/api/restaurants/${restaurantId}`),
          this.api(`/api/dishes/${restaurantId}/${dishId}`),
          this.api(`/api/restaurants/${restaurantId}/reviews`)
        ]);
        this.upsertRestaurant(restaurant);
        const dishReviews = reviews.filter(review => review.dishId === dishId);
        document.getElementById('dishHero').innerHTML = `
          <p class="eyebrow mb-2">Dish details</p>
          <div class="row g-4 align-items-center">
            <div class="col-lg-8">
              <h1 class="fw-bold mb-3">${escapeHtml(dish.name)}</h1>
              <p class="text-secondary mb-3">From <a href="restaurant.html?id=${encodeRouteValue(restaurant.id)}">${escapeHtml(restaurant.name)}</a></p>
              <div class="d-flex flex-wrap">
                <span class="rating-pill">⭐ ${dish.rating}</span>
                <span class="price-pill">$${dish.price}</span>
                <span class="cuisine-pill">${escapeHtml(restaurant.cuisine)}</span>
              </div>
            </div>
            <div class="col-lg-4"><div class="detail-image">${escapeHtml(dish.name)}</div></div>
          </div>
        `;
        document.getElementById('dishDetails').innerHTML = `
          <h2 class="h4 fw-bold mb-3">About this dish</h2>
          <p class="text-secondary">${escapeHtml(dish.description)}</p>
          <p class="mb-0 text-secondary"><strong>Restaurant:</strong> ${escapeHtml(restaurant.name)} • ${escapeHtml(restaurant.suburb)}</p>
        `;
        document.getElementById('dishReviews').innerHTML = dishReviews.length ? dishReviews.map(review => this.renderReviewCard(review, this.getCurrentUser() && this.getCurrentUser().id === review.userId)).join('') : this.emptyState('No dish reviews yet.');
        document.getElementById('backToRestaurantLink').href = `restaurant.html?id=${encodeRouteValue(restaurant.id)}`;
        document.getElementById('saveDishBtn').addEventListener('click', async () => {
          await this.saveDish(restaurantId, dishId, 'saveDishMessage');
        });
      } catch (error) {
        this.showFullPageNotice(error.message, 'browse.html');
      }
    },

    async initWriteReview() {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        this.showFullPageNotice('Please log in before writing a review.', 'login.html');
        return;
      }
      const restaurantSelect = document.getElementById('reviewRestaurantSelect');
      const dishSelect = document.getElementById('reviewDishSelect');
      restaurantSelect.innerHTML = this.state.restaurants.map(restaurant => `<option value="${escapeHtml(restaurant.id)}">${escapeHtml(restaurant.name)}</option>`).join('');
      const fillDishes = restaurantId => {
        const restaurant = this.getRestaurantById(restaurantId);
        const dishes = restaurant && restaurant.dishes ? restaurant.dishes : [];
        dishSelect.innerHTML = `<option value="">Restaurant review only</option>${dishes.map(dish => `<option value="${escapeHtml(dish.id)}">${escapeHtml(dish.name)}</option>`).join('')}`;
      };
      restaurantSelect.addEventListener('change', async () => {
        if (!this.getRestaurantById(restaurantSelect.value)?.dishes) {
          this.upsertRestaurant(await this.api(`/api/restaurants/${restaurantSelect.value}`));
        }
        fillDishes(restaurantSelect.value);
      });
      const params = new URLSearchParams(window.location.search);
      const presetRestaurant = params.get('restaurantId');
      const presetDish = params.get('dishId');
      if (presetRestaurant) {
        if (!this.getRestaurantById(presetRestaurant)?.dishes) {
          this.upsertRestaurant(await this.api(`/api/restaurants/${presetRestaurant}`));
        }
        restaurantSelect.value = presetRestaurant;
      }
      fillDishes(restaurantSelect.value);
      if (presetDish) dishSelect.value = presetDish;
      document.getElementById('writeReviewForm').addEventListener('submit', async event => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const payload = Object.fromEntries(formData.entries());
        try {
          await this.api('/api/reviews', { method: 'POST', body: payload });
          this.state.reviews = [];
          this.showMessage('writeReviewMessage', 'Review posted successfully. Redirecting to your profile...', 'success');
          window.setTimeout(() => {
            window.location.href = 'profile.html';
          }, 1000);
        } catch (error) {
          this.showMessage('writeReviewMessage', error.message, 'error');
        }
      });
    },

    async initEditReview() {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        this.showFullPageNotice('Please log in before editing reviews.', 'login.html');
        return;
      }
      const reviewId = Number(new URLSearchParams(window.location.search).get('id'));
      await this.loadReviews(true);
      const review = this.getAllReviews().find(item => item.id === reviewId && item.userId === currentUser.id);
      if (!review) {
        this.showMessage('editReviewMessage', 'Review not found or not editable.', 'error');
        return;
      }
      document.getElementById('editReviewId').value = review.id;
      document.getElementById('editRating').value = review.rating;
      document.getElementById('editTitle').value = review.title;
      document.getElementById('editContent').value = review.content;
      document.getElementById('editReviewForm').addEventListener('submit', async event => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const updates = Object.fromEntries(formData.entries());
        try {
          await this.api(`/api/reviews/${review.id}`, { method: 'PUT', body: updates });
          this.state.reviews = [];
          this.showMessage('editReviewMessage', 'Review updated.', 'success');
        } catch (error) {
          this.showMessage('editReviewMessage', error.message, 'error');
        }
      });
      document.getElementById('deleteReviewBtn').addEventListener('click', async () => {
        try {
          await this.api(`/api/reviews/${review.id}`, { method: 'DELETE' });
          this.state.reviews = [];
          this.showMessage('editReviewMessage', 'Review deleted. Redirecting...', 'success');
          window.setTimeout(() => {
            window.location.href = 'profile.html';
          }, 900);
        } catch (error) {
          this.showMessage('editReviewMessage', error.message, 'error');
        }
      });
    },

    async initProfile() {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        this.showFullPageNotice('Please log in to view your profile.', 'login.html');
        return;
      }
      await Promise.all([this.loadReviews(true), this.loadFavourites(true)]);
      const myReviews = this.getAllReviews().filter(review => review.userId === currentUser.id);
      const favouriteRestaurants = this.state.favourites.restaurants;
      const favouriteDishes = this.state.favourites.dishes;
      document.getElementById('profileHeader').innerHTML = `
        <p class="eyebrow mb-2">My profile</p>
        <h1 class="fw-bold mb-3">${escapeHtml(currentUser.name)}</h1>
        <p class="text-secondary mb-0">@${escapeHtml(currentUser.username)} • Preferred cuisine: ${escapeHtml(currentUser.preferredCuisine || 'Not set')}</p>
      `;
      document.getElementById('profileSummary').innerHTML = `
        <h2 class="h4 fw-bold mb-3">Account summary</h2>
        <p class="text-secondary">${escapeHtml(currentUser.bio || 'No bio yet.')}</p>
        <p class="mb-2"><strong>Email:</strong> ${escapeHtml(currentUser.email)}</p>
        <p class="mb-2"><strong>Reviews:</strong> ${myReviews.length}</p>
        <p class="mb-0"><strong>Favourites:</strong> ${favouriteRestaurants.length + favouriteDishes.length}</p>
      `;
      document.getElementById('myReviews').innerHTML = myReviews.length ? myReviews.map(review => this.renderReviewCard(review, true)).join('') : this.emptyState('You have not written any reviews yet.');
      const favouriteHtml = [
        ...favouriteRestaurants.map(restaurant => `<div class="favorite-card p-3 mb-3"><h3 class="h5 fw-bold mb-1">${escapeHtml(restaurant.name)}</h3><p class="text-secondary mb-2">${escapeHtml(restaurant.suburb)} • ${escapeHtml(restaurant.cuisine)}</p><a href="restaurant.html?id=${encodeRouteValue(restaurant.id)}" class="btn btn-sm btn-primary">Open</a></div>`),
        ...favouriteDishes.map(item => `<div class="favorite-card p-3 mb-3"><h3 class="h5 fw-bold mb-1">${escapeHtml(item.dish.name)}</h3><p class="text-secondary mb-2">${escapeHtml(item.restaurant.name)}</p><a href="dish.html?restaurant=${encodeRouteValue(item.restaurant.id)}&dish=${encodeRouteValue(item.dish.id)}" class="btn btn-sm btn-primary">Open</a></div>`)
      ].join('');
      document.getElementById('profileFavourites').innerHTML = favouriteHtml || this.emptyState('Nothing saved yet.');
    },

    async initOtherUser() {
      const userId = new URLSearchParams(window.location.search).get('id');
      if (!userId) return;
      try {
        const user = await this.api(`/api/users/${userId}`);
        document.getElementById('otherUserHeader').innerHTML = `
          <p class="eyebrow mb-2">Community member</p>
          <h1 class="fw-bold mb-3">${escapeHtml(user.name)}</h1>
          <p class="text-secondary mb-0">@${escapeHtml(user.username || 'member')}</p>
        `;
        document.getElementById('otherUserSummary').innerHTML = `
          <h2 class="h4 fw-bold mb-3">Profile summary</h2>
          <p class="text-secondary mb-0">${escapeHtml(user.bio || 'This user has not added a bio yet.')}</p>
        `;
        document.getElementById('otherUserReviews').innerHTML = user.reviews.length ? user.reviews.map(review => this.renderReviewCard(review)).join('') : this.emptyState('This user has no reviews yet.');
      } catch (error) {
        this.showFullPageNotice(error.message, 'browse.html');
      }
    },

    async initFavourites() {
      const restaurantContainer = document.getElementById('favouriteRestaurants');
      const dishContainer = document.getElementById('favouriteDishes');
      if (!this.getCurrentUser()) {
        this.showFullPageNotice('Please log in to view your favourites.', 'login.html');
        return;
      }
      try {
        await this.loadFavourites(true);
        const favouriteRestaurants = this.state.favourites.restaurants;
        const favouriteDishes = this.state.favourites.dishes;
        restaurantContainer.innerHTML = favouriteRestaurants.length ? favouriteRestaurants.map(restaurant => `<div class="favorite-card p-3 mb-3"><h3 class="h5 fw-bold mb-1">${escapeHtml(restaurant.name)}</h3><p class="text-secondary mb-2">${escapeHtml(restaurant.suburb)} • ${escapeHtml(restaurant.cuisine)}</p><a class="btn btn-sm btn-primary" href="restaurant.html?id=${encodeRouteValue(restaurant.id)}">View</a></div>`).join('') : this.emptyState('No saved restaurants yet.');
        dishContainer.innerHTML = favouriteDishes.length ? favouriteDishes.map(item => `<div class="favorite-card p-3 mb-3"><h3 class="h5 fw-bold mb-1">${escapeHtml(item.dish.name)}</h3><p class="text-secondary mb-2">${escapeHtml(item.restaurant.name)}</p><a class="btn btn-sm btn-primary" href="dish.html?restaurant=${encodeRouteValue(item.restaurant.id)}&dish=${encodeRouteValue(item.dish.id)}">View</a></div>`).join('') : this.emptyState('No saved dishes yet.');
      } catch (error) {
        restaurantContainer.innerHTML = this.emptyState(error.message);
        dishContainer.innerHTML = this.emptyState(error.message);
      }
    },

    initAbout() {},

    async initLogout() {
      if (this.getCurrentUser()) {
        try {
          await this.api('/api/auth/logout', { method: 'POST' });
        } catch (error) {
          // Keep the logged out screen even if the session is already gone.
        }
      }
      this.state.currentUser = null;
      this.state.favourites = { restaurants: [], dishes: [] };
      this.renderLayout();
    },

    requestLocation(messageTarget, onSuccess) {
      const locationEnv = {
        hostname: root.location?.hostname || '',
        isSecureContext: root.isSecureContext
      };

      if (!isGeolocationOriginAllowed(locationEnv)) {
        this.showMessage(
          messageTarget,
          buildLocationErrorMessage({ code: 1 }, locationEnv),
          'error'
        );
        return;
      }

      if (!root.navigator?.geolocation) {
        this.showMessage(messageTarget, 'Geolocation is not supported in this browser.', 'error');
        return;
      }

      root.navigator.geolocation.getCurrentPosition(
        position => {
          onSuccess({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        error => this.showMessage(
          messageTarget,
          buildLocationErrorMessage(error, locationEnv),
          'error'
        ),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    },

    async saveRestaurant(restaurantId, targetId = '') {
      if (!this.getCurrentUser()) {
        if (targetId) this.showMessage(targetId, 'Please log in before saving favourites.', 'error');
        return;
      }
      try {
        await this.api(`/api/favourites/restaurants/${restaurantId}`, { method: 'POST' });
        this.state.favourites = { restaurants: [], dishes: [] };
        await this.loadFavourites(true);
        if (targetId) this.showMessage(targetId, 'Restaurant saved to favourites.', 'success');
      } catch (error) {
        if (targetId) this.showMessage(targetId, error.message, 'error');
      }
    },

    async saveDish(restaurantId, dishId, targetId = '') {
      if (!this.getCurrentUser()) {
        if (targetId) this.showMessage(targetId, 'Please log in before saving favourites.', 'error');
        return;
      }
      try {
        await this.api('/api/favourites/dishes', { method: 'POST', body: { restaurantId, dishId } });
        this.state.favourites = { restaurants: [], dishes: [] };
        await this.loadFavourites(true);
        if (targetId) this.showMessage(targetId, 'Dish saved to favourites.', 'success');
      } catch (error) {
        if (targetId) this.showMessage(targetId, error.message, 'error');
      }
    },

    bindSaveButtons() {
      document.querySelectorAll('.save-restaurant-trigger').forEach(button => {
        button.onclick = async () => {
          await this.saveRestaurant(button.dataset.id);
        };
      });
      document.querySelectorAll('.save-dish-trigger').forEach(button => {
        button.onclick = async () => {
          await this.saveDish(button.dataset.restaurant, button.dataset.id);
        };
      });
    },

    showFullPageNotice(message, actionHref) {
      const main = document.querySelector('main');
      main.innerHTML = `
        <section class="py-5">
          <div class="container">
            <div class="glass-card p-5 text-center">
              <h1 class="h2 fw-bold mb-3">Action required</h1>
              <p class="text-secondary mb-4">${escapeHtml(message)}</p>
              <a href="${escapeHtml(actionHref)}" class="btn btn-primary">Continue</a>
            </div>
          </div>
        </section>
      `;
    },

    upsertRestaurant(restaurant) {
      const existingIndex = this.state.restaurants.findIndex(item => item.id === restaurant.id);
      if (existingIndex >= 0) {
        this.state.restaurants.splice(existingIndex, 1, restaurant);
      } else {
        this.state.restaurants.push(restaurant);
      }
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      App,
      LOCATION_STORAGE_MAX_AGE_MS,
      buildLocationErrorMessage,
      escapeHtml,
      normalizeStoredUserLocation,
      isGeolocationOriginAllowed,
      isLocalLocationHostname
    };
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
      App.init().catch(error => {
        console.error(error);
      });

      // Navbar scroll effect
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        window.addEventListener('scroll', () => {
          if (window.scrollY > 20) {
            navbar.classList.add('scrolled');
          } else {
            navbar.classList.remove('scrolled');
          }
        });
      }

      // Intersection Observer for scroll reveal
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };

      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
          }
        });
      }, observerOptions);

      document.querySelectorAll('.section-top-rated, .section-how, .section-testimonials, .section-cta').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        revealObserver.observe(section);
      });

      // Add revealed class styles dynamically
      const style = document.createElement('style');
      style.textContent = `
        .revealed {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `;
      document.head.appendChild(style);

      // Scroll-Linked Opacity Fade: content above viewport fades out
      const fadeSections = document.querySelectorAll('.scroll-fade-section');

      function updateScrollFade() {
        const viewportHeight = window.innerHeight;

        fadeSections.forEach(section => {
          const rect = section.getBoundingClientRect();
          const sectionBottom = rect.bottom;
          const sectionHeight = rect.height;

          // Calculate how much of the section has scrolled out of the top of viewport
          // When section bottom reaches viewport top: fully faded
          const visibleHeight = Math.max(0, sectionBottom);
          const visibilityRatio = Math.min(1, visibleHeight / (sectionHeight * 0.4));

          if (visibilityRatio < 1) {
            // Section is leaving viewport from top - fade and darken
            const opacity = 0.15 + (visibilityRatio * 0.85);
            const brightness = 0.35 + (visibilityRatio * 0.65);
            section.style.opacity = opacity;
            section.style.filter = `brightness(${brightness})`;
          } else {
            // Section is fully or mostly visible
            section.style.opacity = 1;
            section.style.filter = 'brightness(1)';
          }
        });
      }

      let fadeTicking = false;
      window.addEventListener('scroll', () => {
        if (!fadeTicking) {
          requestAnimationFrame(() => {
            updateScrollFade();
            fadeTicking = false;
          });
          fadeTicking = true;
        }
      }, { passive: true });

      // Initial call
      updateScrollFade();
    });
  }
})();
