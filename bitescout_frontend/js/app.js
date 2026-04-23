(function () {
  const STORAGE_KEYS = {
    userLocation: 'bitescout_user_location'
  };


  const data = window.BiteScoutData || { restaurants: [], sampleUsers: [], sampleReviews: [] };

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
                  ${user ? `<a class="btn btn-outline-dark btn-sm" href="profile.html">${user.name.split(' ')[0]}'s profile</a><a class="btn btn-primary btn-sm" href="logout.html">Log out</a>` : `<a class="btn btn-outline-dark btn-sm" href="login.html">Log in</a><a class="btn btn-primary btn-sm" href="signup.html">Sign up</a>`}
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

    getUserLocation() {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.userLocation) || 'null');
    },

    setUserLocation(coords) {
      localStorage.setItem(STORAGE_KEYS.userLocation, JSON.stringify(coords));
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
        ? `<img src="${imageUrl}" alt="${restaurant.name}" class="restaurant-image-img" style="width:100%;height:100%;object-fit:cover;border-radius:1rem;" />`
        : `<div class="restaurant-image mb-3">${restaurant.name}</div>`;
      return `
        <div class="col-md-6 col-xl-4">
          <div class="restaurant-card p-3">
            <div class="restaurant-image mb-3 position-relative overflow-hidden">${imageHtml}</div>
            <div class="d-flex flex-wrap mb-2">
              <span class="rating-pill">⭐ ${restaurant.rating}</span>
              <span class="price-pill">${restaurant.price}</span>
              <span class="cuisine-pill">${restaurant.cuisine}</span>
              ${distanceHtml}
            </div>
            <h3 class="h5 fw-bold">${restaurant.name}</h3>
            <p class="text-secondary mb-2">${restaurant.suburb} • ${restaurant.address}</p>
            <p class="text-secondary">${restaurant.blurb}</p>
            <div class="d-flex gap-2">
              <a class="btn btn-primary btn-sm" href="restaurant.html?id=${restaurant.id}">View details</a>
              <button class="btn btn-outline-dark btn-sm save-restaurant-trigger" data-id="${restaurant.id}">Save</button>
            </div>
          </div>
        </div>
      `;
    },

    renderDishCard(restaurant, dish) {
      return `
        <div class="col-md-6">
          <div class="dish-card p-3">
            <h3 class="h5 fw-bold mb-2">${dish.name}</h3>
            <div class="d-flex flex-wrap mb-2">
              <span class="rating-pill">⭐ ${dish.rating}</span>
              <span class="price-pill">$${dish.price}</span>
            </div>
            <p class="text-secondary">${dish.description}</p>
            <div class="d-flex gap-2">
              <a class="btn btn-primary btn-sm" href="dish.html?restaurant=${restaurant.id}&dish=${dish.id}">View dish</a>
              <button class="btn btn-outline-dark btn-sm save-dish-trigger" data-id="${dish.id}" data-restaurant="${restaurant.id}">Save</button>
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
      const manageButton = editable ? `<a class="btn btn-outline-dark btn-sm" href="edit-review.html?id=${review.id}">Edit</a>` : '';
      return `
        <div class="review-card p-3 mb-3">
          <div class="d-flex justify-content-between align-items-start gap-3 mb-2">
            <div>
              <h3 class="h5 fw-bold mb-1">${review.title}</h3>
              <div class="review-meta">By <a href="user.html?id=${user.id}">${user.name}</a> • ${this.formatDate(review.createdAt)} • ${restaurant ? restaurant.name : ''}${dish ? ' • ' + dish.name : ''}</div>
            </div>
            <div class="text-end">
              <span class="rating-pill">⭐ ${review.rating}</span>
              ${manageButton}
            </div>
          </div>
          <p class="mb-0 text-secondary">${review.content}</p>
        </div>
      `;
    },

    escapeHtml(value = '') {
      return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
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
        .map(type => `<span class="badge badge-soft">${this.escapeHtml(this.formatPlaceType(type))}</span>`)
        .join('');

      return `
        <div class="col-md-6 col-xl-4">
          <div class="restaurant-card p-3 h-100">
            <div class="restaurant-image mb-3">${this.escapeHtml(place.name || 'Nearby place')}</div>
            <div class="d-flex flex-wrap mb-2">
              <span class="rating-pill">⭐ ${place.rating ?? 'N/A'}</span>
              <span class="cuisine-pill">${this.escapeHtml(this.formatPlaceType(place.primaryType || 'place'))}</span>
            </div>
            <h3 class="h5 fw-bold">${this.escapeHtml(place.name || 'Unnamed place')}</h3>
            <p class="text-secondary mb-2">${this.escapeHtml(place.address || 'Address unavailable')}</p>
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
      return `<div class="empty-state">${message}</div>`;
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
      const cuisines = [...new Set(this.state.restaurants.map(restaurant => restaurant.cuisine))];
      cuisineSelect.innerHTML = `<option value="">Any</option>${cuisines.map(cuisine => `<option value="${cuisine}">${cuisine}</option>`).join('')}`;
      const searchInput = document.getElementById('searchInput');
      const urlSearch = new URLSearchParams(window.location.search).get('search');
      if (urlSearch && searchInput) searchInput.value = urlSearch;
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
      if (this.getUserLocation()) this.showMessage('browseLocationMessage', 'Using your saved location to sort results by distance.', 'info');
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
        document.getElementById('restaurantHero').innerHTML = `
          <p class="eyebrow mb-2">Restaurant details</p>
          <div class="row g-4 align-items-center">
            <div class="col-lg-8">
              <h1 class="fw-bold mb-3">${restaurant.name}</h1>
              <p class="text-secondary mb-3">${restaurant.suburb} • ${restaurant.address}</p>
              <div class="d-flex flex-wrap">
                <span class="rating-pill">⭐ ${average}</span>
                <span class="price-pill">${restaurant.price}</span>
                <span class="cuisine-pill">${restaurant.cuisine}</span>
              </div>
            </div>
            <div class="col-lg-4"><div class="detail-image">${restaurant.name}</div></div>
          </div>
        `;
        document.getElementById('restaurantAbout').innerHTML = `
          <h2 class="h4 fw-bold mb-3">About this place</h2>
          <p class="text-secondary">${restaurant.blurb}</p>
          <p class="mb-0 text-secondary"><strong>Popular tags:</strong> ${(restaurant.tags || []).join(', ')}</p>
        `;
        document.getElementById('restaurantDishes').innerHTML = (restaurant.dishes || []).map(dish => this.renderDishCard(restaurant, dish)).join('');
        document.getElementById('restaurantReviews').innerHTML = reviews.length ? reviews.map(review => this.renderReviewCard(review, this.getCurrentUser() && this.getCurrentUser().id === review.userId)).join('') : this.emptyState('No reviews yet. Be the first to share your experience.');
        document.getElementById('restaurantSidebar').innerHTML = `
          <h3 class="h5 fw-bold mb-3">Quick facts</h3>
          <p class="mb-2"><strong>Cuisine:</strong> ${restaurant.cuisine}</p>
          <p class="mb-2"><strong>Price range:</strong> ${restaurant.price}</p>
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
              <h1 class="fw-bold mb-3">${dish.name}</h1>
              <p class="text-secondary mb-3">From <a href="restaurant.html?id=${restaurant.id}">${restaurant.name}</a></p>
              <div class="d-flex flex-wrap">
                <span class="rating-pill">⭐ ${dish.rating}</span>
                <span class="price-pill">$${dish.price}</span>
                <span class="cuisine-pill">${restaurant.cuisine}</span>
              </div>
            </div>
            <div class="col-lg-4"><div class="detail-image">${dish.name}</div></div>
          </div>
        `;
        document.getElementById('dishDetails').innerHTML = `
          <h2 class="h4 fw-bold mb-3">About this dish</h2>
          <p class="text-secondary">${dish.description}</p>
          <p class="mb-0 text-secondary"><strong>Restaurant:</strong> ${restaurant.name} • ${restaurant.suburb}</p>
        `;
        document.getElementById('dishReviews').innerHTML = dishReviews.length ? dishReviews.map(review => this.renderReviewCard(review, this.getCurrentUser() && this.getCurrentUser().id === review.userId)).join('') : this.emptyState('No dish reviews yet.');
        document.getElementById('backToRestaurantLink').href = `restaurant.html?id=${restaurant.id}`;
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
      restaurantSelect.innerHTML = this.state.restaurants.map(restaurant => `<option value="${restaurant.id}">${restaurant.name}</option>`).join('');
      const fillDishes = restaurantId => {
        const restaurant = this.getRestaurantById(restaurantId);
        const dishes = restaurant && restaurant.dishes ? restaurant.dishes : [];
        dishSelect.innerHTML = `<option value="">Restaurant review only</option>${dishes.map(dish => `<option value="${dish.id}">${dish.name}</option>`).join('')}`;
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
        <h1 class="fw-bold mb-3">${currentUser.name}</h1>
        <p class="text-secondary mb-0">@${currentUser.username} • Preferred cuisine: ${currentUser.preferredCuisine || 'Not set'}</p>
      `;
      document.getElementById('profileSummary').innerHTML = `
        <h2 class="h4 fw-bold mb-3">Account summary</h2>
        <p class="text-secondary">${currentUser.bio || 'No bio yet.'}</p>
        <p class="mb-2"><strong>Email:</strong> ${currentUser.email}</p>
        <p class="mb-2"><strong>Reviews:</strong> ${myReviews.length}</p>
        <p class="mb-0"><strong>Favourites:</strong> ${favouriteRestaurants.length + favouriteDishes.length}</p>
      `;
      document.getElementById('myReviews').innerHTML = myReviews.length ? myReviews.map(review => this.renderReviewCard(review, true)).join('') : this.emptyState('You have not written any reviews yet.');
      const favouriteHtml = [
        ...favouriteRestaurants.map(restaurant => `<div class="favorite-card p-3 mb-3"><h3 class="h5 fw-bold mb-1">${restaurant.name}</h3><p class="text-secondary mb-2">${restaurant.suburb} • ${restaurant.cuisine}</p><a href="restaurant.html?id=${restaurant.id}" class="btn btn-sm btn-primary">Open</a></div>`),
        ...favouriteDishes.map(item => `<div class="favorite-card p-3 mb-3"><h3 class="h5 fw-bold mb-1">${item.dish.name}</h3><p class="text-secondary mb-2">${item.restaurant.name}</p><a href="dish.html?restaurant=${item.restaurant.id}&dish=${item.dish.id}" class="btn btn-sm btn-primary">Open</a></div>`)
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
          <h1 class="fw-bold mb-3">${user.name}</h1>
          <p class="text-secondary mb-0">@${user.username || 'member'}</p>
        `;
        document.getElementById('otherUserSummary').innerHTML = `
          <h2 class="h4 fw-bold mb-3">Profile summary</h2>
          <p class="text-secondary mb-0">${user.bio || 'This user has not added a bio yet.'}</p>
        `;
        document.getElementById('otherUserReviews').innerHTML = user.reviews.length ? user.reviews.map(review => this.renderReviewCard(review)).join('') : this.emptyState('This user has no reviews yet.');
      } catch (error) {
        this.showFullPageNotice(error.message, 'browse.html');
      }
    },

    ommendations() {
      const target = document.getElementById('recommendationsGrid');
      const detectBtn = document.getElementById('detectLocationBtn');
      const resetBtn = document.getElementById('resetRecommendationsBtn');
      const radiusSelect = document.getElementById('recommendationRadius');
      const typeSinitRecelect = document.getElementById('recommendationType');
      const minRatingSelect = document.getElementById('minGoogleRating');

      if (!target || !detectBtn || !resetBtn) return;

      let lastCoords = null;
      let lastResults = [];

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
          this.showMessage('recommendationStatus', `Showing ${filtered.length} nearby place${filtered.length === 1 ? '' : 's'}.`, 'info');
        }
      };

      const loadNearbyPlaces = async (coords) => {
        const radius = parseInt(radiusSelect?.value || '8000', 10);
        const includedTypes = (typeSelect?.value || 'restaurant,cafe')
          .split(',')
          .map(value => value.trim())
          .filter(Boolean);

        this.showMessage('recommendationStatus', 'Loading nearby places...', 'info');

        try {
          const results = await this.fetchNearbyGooglePlaces(coords, radius, includedTypes, 12);
          lastCoords = coords;
          lastResults = results;
          this.setUserLocation(coords);
          reRenderFromCurrentResults();
          const visibleCount = this.filterGooglePlaces(results, parseFloat(minRatingSelect?.value || '0')).length;
          this.showMessage('recommendationStatus', `Loaded ${visibleCount} nearby place${visibleCount === 1 ? '' : 's'} from Google Places.`, 'success');
        } catch (error) {
          this.showMessage('recommendationStatus', error.message, 'error');
          target.innerHTML = this.emptyState('Unable to load nearby places right now.');
        }
      };

      detectBtn.addEventListener('click', () => {
        this.requestLocation('recommendationStatus', async coords => {
          await loadNearbyPlaces(coords);
        });
      });

      resetBtn.addEventListener('click', () => {
        lastCoords = null;
        lastResults = [];
        target.innerHTML = this.emptyState('Click “Use my location” to load live nearby recommendations.');
        this.showMessage('recommendationStatus', 'Cleared nearby results.', 'info');
      });

      minRatingSelect?.addEventListener('change', () => {
        if (lastResults.length) reRenderFromCurrentResults();
      });

      radiusSelect?.addEventListener('change', async () => {
        if (lastCoords) await loadNearbyPlaces(lastCoords);
      });

      typeSelect?.addEventListener('change', async () => {
        if (lastCoords) await loadNearbyPlaces(lastCoords);
      });

      const saved = this.getUserLocation();
      if (saved) {
        this.showMessage('recommendationStatus', 'Saved location found. Click “Use my location” to refresh live nearby places.', 'info');
      } else {
        this.showMessage('recommendationStatus', 'Click “Use my location” to fetch live nearby recommendations.', 'info');
      }

      target.innerHTML = this.emptyState('Click “Use my location” to load live nearby recommendations.');
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
        restaurantContainer.innerHTML = favouriteRestaurants.length ? favouriteRestaurants.map(restaurant => `<div class="favorite-card p-3 mb-3"><h3 class="h5 fw-bold mb-1">${restaurant.name}</h3><p class="text-secondary mb-2">${restaurant.suburb} • ${restaurant.cuisine}</p><a class="btn btn-sm btn-primary" href="restaurant.html?id=${restaurant.id}">View</a></div>`).join('') : this.emptyState('No saved restaurants yet.');
        dishContainer.innerHTML = favouriteDishes.length ? favouriteDishes.map(item => `<div class="favorite-card p-3 mb-3"><h3 class="h5 fw-bold mb-1">${item.dish.name}</h3><p class="text-secondary mb-2">${item.restaurant.name}</p><a class="btn btn-sm btn-primary" href="dish.html?restaurant=${item.restaurant.id}&dish=${item.dish.id}">View</a></div>`).join('') : this.emptyState('No saved dishes yet.');
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
      if (!navigator.geolocation) {
        this.showMessage(messageTarget, 'Geolocation is not supported in this browser.', 'error');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        position => {
          onSuccess({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        () => this.showMessage(messageTarget, 'Location access was denied or unavailable. Try localhost or HTTPS.', 'error')
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
              <p class="text-secondary mb-4">${message}</p>
              <a href="${actionHref}" class="btn btn-primary">Continue</a>
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

  window.addEventListener('DOMContentLoaded', () => {
    App.init().catch(error => {
      console.error(error);
    });
  });
})();