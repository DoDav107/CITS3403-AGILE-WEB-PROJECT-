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
        return 'Your device could not determine a location. Check Location Services, then try again.';
      case 3:
        return 'Location request timed out. Try again when your device has a clearer location fix.';
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
    userLocation: 'bitescout_user_location',
    recentSearches: 'bitescout_recent_searches'
  };

  const DEFAULT_AVATAR_ID = 'avatar-scout';
  const AVATAR_PRESETS = [
    { id: 'avatar-scout', label: 'Scout', initials: 'BS', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=240&h=240' },
    { id: 'avatar-noodles', label: 'Noodles', initials: 'NO', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=240&h=240' },
    { id: 'avatar-sushi', label: 'Sushi', initials: 'SU', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=240&h=240' },
    { id: 'avatar-pizza', label: 'Pizza', initials: 'PI', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=240&h=240' },
    { id: 'avatar-taco', label: 'Taco', initials: 'TA', image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&q=80&w=240&h=240' },
    { id: 'avatar-boba', label: 'Boba', initials: 'BO', image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&q=80&w=240&h=240' },
    { id: 'avatar-tea', label: 'Tea', initials: 'TE', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=240&h=240' },
    { id: 'avatar-ramen', label: 'Ramen', initials: 'RA', image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&q=80&w=240&h=240' },
    { id: 'avatar-coffee', label: 'Coffee', initials: 'CO', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=240&h=240' },
    { id: 'avatar-cake', label: 'Cake', initials: 'CA', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=240&h=240' },
    { id: 'avatar-grill', label: 'Grill', initials: 'GR', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=240&h=240' },
    { id: 'avatar-curry', label: 'Curry', initials: 'CU', image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&q=80&w=240&h=240' }
  ];

  const RESTAURANT_IMAGE_LIBRARY = {
    vietnamese: [
      'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&q=80&w=900'
    ],
    cafe: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=900'
    ],
    bakery: [
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1517433367423-c7e5b0f35086?auto=format&fit=crop&q=80&w=900'
    ],
    sushi: [
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&q=80&w=900'
    ],
    ramen: [
      'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&q=80&w=900'
    ],
    burgers: [
      'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=900'
    ],
    italian: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=900'
    ],
    pizza: [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=900'
    ],
    chicken: [
      'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1527477396000-e27163b481c2?auto=format&fit=crop&q=80&w=900'
    ],
    drinks: [
      'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=900'
    ],
    korean: [
      'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&q=80&w=900'
    ],
    thai: [
      'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&q=80&w=900'
    ],
    mexican: [
      'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&q=80&w=900'
    ],
    dessert: [
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&q=80&w=900'
    ],
    default: [
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=900',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=900'
    ]
  };

  const RESTAURANT_IMAGE_OVERRIDES = {
    r1: RESTAURANT_IMAGE_LIBRARY.vietnamese[0],
    r2: RESTAURANT_IMAGE_LIBRARY.cafe[0],
    r3: RESTAURANT_IMAGE_LIBRARY.sushi[0],
    r4: RESTAURANT_IMAGE_LIBRARY.burgers[0],
    r5: RESTAURANT_IMAGE_LIBRARY.italian[0],
    r6: RESTAURANT_IMAGE_LIBRARY.drinks[0],
    r7: RESTAURANT_IMAGE_LIBRARY.ramen[0],
    r8: RESTAURANT_IMAGE_LIBRARY.korean[0],
    r9: RESTAURANT_IMAGE_LIBRARY.thai[0],
    r10: RESTAURANT_IMAGE_LIBRARY.mexican[0]
  };

  const PAGE_AMBIENT_PHOTOS = {
    browse: [
      RESTAURANT_IMAGE_LIBRARY.cafe[0],
      RESTAURANT_IMAGE_LIBRARY.ramen[0],
      RESTAURANT_IMAGE_LIBRARY.bakery[0],
      RESTAURANT_IMAGE_LIBRARY.sushi[0],
      RESTAURANT_IMAGE_LIBRARY.drinks[0]
    ],
    recommendations: [
      RESTAURANT_IMAGE_LIBRARY.vietnamese[0],
      RESTAURANT_IMAGE_LIBRARY.sushi[1],
      RESTAURANT_IMAGE_LIBRARY.thai[0],
      RESTAURANT_IMAGE_LIBRARY.italian[1],
      RESTAURANT_IMAGE_LIBRARY.drinks[1]
    ],
    favourites: [
      RESTAURANT_IMAGE_LIBRARY.dessert[0],
      RESTAURANT_IMAGE_LIBRARY.italian[0],
      RESTAURANT_IMAGE_LIBRARY.mexican[0],
      RESTAURANT_IMAGE_LIBRARY.cafe[1]
    ],
    profile: [
      RESTAURANT_IMAGE_LIBRARY.vietnamese[0],
      RESTAURANT_IMAGE_LIBRARY.cafe[0],
      RESTAURANT_IMAGE_LIBRARY.drinks[0],
      RESTAURANT_IMAGE_LIBRARY.sushi[0]
    ],
    'write-review': [
      RESTAURANT_IMAGE_LIBRARY.bakery[0],
      RESTAURANT_IMAGE_LIBRARY.italian[2],
      RESTAURANT_IMAGE_LIBRARY.burgers[1],
      RESTAURANT_IMAGE_LIBRARY.cafe[2]
    ],
    'edit-review': [
      RESTAURANT_IMAGE_LIBRARY.bakery[1],
      RESTAURANT_IMAGE_LIBRARY.italian[1],
      RESTAURANT_IMAGE_LIBRARY.sushi[0]
    ],
    restaurant: [
      RESTAURANT_IMAGE_LIBRARY.default[0],
      RESTAURANT_IMAGE_LIBRARY.italian[0],
      RESTAURANT_IMAGE_LIBRARY.ramen[0]
    ],
    dish: [
      RESTAURANT_IMAGE_LIBRARY.default[0],
      RESTAURANT_IMAGE_LIBRARY.dessert[0],
      RESTAURANT_IMAGE_LIBRARY.thai[1]
    ],
    about: [
      RESTAURANT_IMAGE_LIBRARY.cafe[1],
      RESTAURANT_IMAGE_LIBRARY.drinks[2],
      RESTAURANT_IMAGE_LIBRARY.default[1]
    ],
    default: [
      RESTAURANT_IMAGE_LIBRARY.default[0],
      RESTAURANT_IMAGE_LIBRARY.cafe[0],
      RESTAURANT_IMAGE_LIBRARY.italian[0]
    ]
  };


  const data = root.BiteScoutData || { restaurants: [], sampleUsers: [], sampleReviews: [] };

  const App = {
    state: {
      currentUser: null,
      csrfToken: null,
      restaurants: [],
      reviews: [],
      favourites: { restaurants: [], dishes: [] },
      recentSearches: [],
      chatHistory: []
    },

    async init() {
      await this.bootstrap();
      this.renderLayout();
      this.initChatbot();
      await this.routePage();
    },

    async bootstrap() {
      this.state.recentSearches = this.getRecentSearches();
      await Promise.all([this.loadCurrentUser(), this.loadRestaurants()]);
    },

    async ensureCsrfToken() {
      if (this.state.csrfToken) return this.state.csrfToken;

      const response = await fetch('/api/csrf-token', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' }
      });
      const payload = await response.json();
      if (!response.ok || !payload.csrfToken) {
        throw new Error('Could not prepare a secure request.');
      }

      this.state.csrfToken = payload.csrfToken;
      return this.state.csrfToken;
    },

    async api(path, options = {}) {
      const config = {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        ...options
      };
      const method = String(config.method || 'GET').toUpperCase();

      if (config.body && !(config.body instanceof FormData)) {
        config.headers = { 'Content-Type': 'application/json', ...config.headers };
        config.body = JSON.stringify(config.body);
      }
      if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        config.headers = { ...config.headers, 'X-CSRFToken': await this.ensureCsrfToken() };
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
      if (this.state.favourites.restaurants.length && !force) {
        return this.state.favourites;
      }
      this.state.favourites = await this.api('/api/favourites');
      return this.state.favourites;
    },

    async initRecommendations() {
      const target = document.getElementById('recommendationsGrid');
      const title = document.getElementById('recommendationTitle');
      const user = this.getCurrentUser();
      if (!target) return;

      if (!user) {
        const recommendations = this.buildSmartRecommendations(this.state.restaurants, {
          recentSearches: this.state.recentSearches
        }, 6);
        if (title) title.textContent = 'Trending places to start with';
        this.showMessage('recommendationStatus', 'Log in to unlock recommendations that learn from your favourites and profile cuisine.', 'info');
        target.innerHTML = recommendations.length
          ? recommendations.map(restaurant => this.renderRestaurantCard(restaurant)).join('')
          : this.emptyState('No recommendations are available yet.');
        this.bindSaveButtons();
        return;
      }

      await this.loadFavourites(true);
      const preferredCuisine = user.preferredCuisine || '';
      const recentSearches = this.state.recentSearches || [];
      const favouriteRestaurants = this.state.favourites.restaurants || [];
      const recommendations = this.buildSmartRecommendations(this.state.restaurants, {
        preferredCuisine,
        favourites: favouriteRestaurants,
        recentSearches
      }, 6);
      if (title) title.textContent = preferredCuisine ? `${preferredCuisine} first, with fresh ideas` : 'Picked from your activity';
      const signalText = [
        preferredCuisine ? `profile cuisine: ${preferredCuisine}` : '',
        favouriteRestaurants.length ? `${favouriteRestaurants.length} saved place${favouriteRestaurants.length === 1 ? '' : 's'}` : '',
        recentSearches.length ? `recent searches: ${recentSearches.slice(0, 3).join(', ')}` : ''
      ].filter(Boolean).join(' • ');
      this.showMessage(
        'recommendationStatus',
        signalText ? `Recommendations are using ${signalText}.` : 'Save places or search Browse to make this page more personal.',
        'info'
      );
      target.innerHTML = recommendations.length
        ? recommendations.map(restaurant => this.renderRestaurantCard(restaurant)).join('')
        : this.emptyState('No recommendations are available yet.');
      this.bindSaveButtons();
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
        'places-request': () => this.initPlaceRequests(),
        recommendations: () => this.initRecommendations(),
        favourites: () => this.initFavourites(),
        about: () => this.initAbout(),
        logout: () => this.initLogout(),
        'forgot-password': () => this.initForgotPassword(),
      };
      if (routes[page]) await routes[page]();
    },

    renderLayout() {
      const user = this.getCurrentUser();
      const header = document.getElementById('site-header');
      const footer = document.getElementById('site-footer');
      const firstName = user ? escapeHtml((user.name || 'User').split(' ')[0]) : '';
      const userAvatar = user ? escapeHtml(this.getUserAvatarUrl(user)) : '';
      this.renderAmbientMotion();
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
                  ${user ? `<a class="btn btn-outline-dark btn-sm profile-nav-link" href="profile.html"><img class="profile-avatar-xs" src="${userAvatar}" alt="">${firstName}'s profile</a><a class="btn btn-primary btn-sm" href="logout.html">Log out</a>` : `<a class="btn btn-outline-dark btn-sm" href="login.html">Log in</a><a class="btn btn-primary btn-sm" href="signup.html">Sign up</a>`}
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
      
      if (!document.getElementById('bitescout-chatbot')) {
        const chatbotHtml = `
          <div id="bitescout-chatbot">
            <div class="chat-widget-btn" id="chatWidgetBtn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
            </div>
            <div class="chat-window" id="chatWindow">
              <div class="chat-header">
                <h3>BiteScout AI</h3>
                <button class="chat-close" id="chatCloseBtn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <div class="chat-body" id="chatBody">
                <div class="chat-msg ai">
                  <p>Hi there! 👋 I'm your BiteScout assistant. Looking for a place to eat?</p>
                </div>
                <div class="typing-indicator" id="chatTyping">
                  <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
                </div>
              </div>
              <div class="chat-footer">
                <input type="text" id="chatInput" class="chat-input" placeholder="Ask for recommendations..." />
                <button class="chat-send" id="chatSendBtn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </div>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', chatbotHtml);
      }
      
      this.highlightActiveNav();
    },

    renderAmbientMotion() {
      if (typeof document === 'undefined') return;

      const existingLayer = document.getElementById('pageFoodMotion');
      if (existingLayer) existingLayer.remove();

      const page = document.body.dataset.page || 'default';
      if (page === 'home') return;

      const photos = PAGE_AMBIENT_PHOTOS[page] || PAGE_AMBIENT_PHOTOS.default;
      const layer = document.createElement('div');
      layer.id = 'pageFoodMotion';
      layer.className = `page-food-motion page-food-motion-${page}`;
      layer.setAttribute('aria-hidden', 'true');

      const positions = [
        { left: '4%', top: '16%', size: '12vw', delay: '-1s', duration: '18s', rotate: '-8deg' },
        { left: '76%', top: '12%', size: '10vw', delay: '-5s', duration: '21s', rotate: '7deg' },
        { left: '7%', top: '66%', size: '9vw', delay: '-8s', duration: '23s', rotate: '10deg' },
        { left: '82%', top: '62%', size: '13vw', delay: '-3s', duration: '20s', rotate: '-6deg' },
        { left: '50%', top: '78%', size: '8vw', delay: '-11s', duration: '24s', rotate: '4deg' }
      ];

      photos.slice(0, positions.length).forEach((photo, index) => {
        const item = document.createElement('span');
        const position = positions[index];
        item.className = 'food-float';
        item.style.setProperty('--float-image', `url("${photo}")`);
        item.style.setProperty('--float-left', position.left);
        item.style.setProperty('--float-top', position.top);
        item.style.setProperty('--float-size', position.size);
        item.style.setProperty('--float-delay', position.delay);
        item.style.setProperty('--float-duration', position.duration);
        item.style.setProperty('--float-rotate', position.rotate);
        layer.appendChild(item);
      });

      document.body.appendChild(layer);
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

    getAvatarPresets() {
      return AVATAR_PRESETS;
    },

    avatarPresetToDataUrl(preset = AVATAR_PRESETS[0]) {
      if (preset.image) return preset.image;
      const initials = escapeHtml(preset.initials || 'BS');
      const label = escapeHtml(preset.label || 'BiteScout avatar');
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="${label}">
          <rect width="160" height="160" rx="80" fill="${preset.background || '#d4af37'}"/>
          <circle cx="116" cy="42" r="28" fill="rgba(255,255,255,0.18)"/>
          <circle cx="42" cy="118" r="34" fill="rgba(10,10,10,0.18)"/>
          <text x="80" y="95" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="46" font-weight="800" fill="${preset.accent || '#0a0a0a'}">${initials}</text>
        </svg>
      `;
      return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
    },

    resolveAvatarUrl(avatarUrl = '', fallbackName = '') {
      const value = String(avatarUrl || '').trim();
      if (value.startsWith('preset:')) {
        const presetId = value.slice('preset:'.length);
        const preset = AVATAR_PRESETS.find(item => item.id === presetId);
        if (preset) return this.avatarPresetToDataUrl(preset);
      }
      if (value.startsWith('data:image/')) return value;

      const defaultPreset = AVATAR_PRESETS.find(item => item.id === DEFAULT_AVATAR_ID) || AVATAR_PRESETS[0];
      if (fallbackName) {
        const initials = String(fallbackName)
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map(part => part.charAt(0).toUpperCase())
          .join('') || defaultPreset.initials;
        return this.avatarPresetToDataUrl({ ...defaultPreset, initials });
      }
      return this.avatarPresetToDataUrl(defaultPreset);
    },

    getUserAvatarUrl(user = {}) {
      return this.resolveAvatarUrl(user.avatarUrl || user.avatar_url || '', user.name || user.username || 'BiteScout user');
    },

    getCuisineOptions() {
      const cuisines = new Set();
      [...(this.state.restaurants || []), ...(data.restaurants || [])].forEach(restaurant => {
        if (restaurant.cuisine) cuisines.add(restaurant.cuisine);
      });
      return Array.from(cuisines).sort((left, right) => left.localeCompare(right));
    },

    renderCuisineOptions(selectedValue = '', emptyLabel = 'Not set') {
      const selected = String(selectedValue || '');
      const emptySelected = selected ? '' : ' selected';
      const options = this.getCuisineOptions().map(cuisine => {
        const value = escapeHtml(cuisine);
        const selectedAttribute = cuisine === selected ? ' selected' : '';
        return `<option value="${value}"${selectedAttribute}>${value}</option>`;
      }).join('');
      return `<option value=""${emptySelected}>${escapeHtml(emptyLabel)}</option>${options}`;
    },

    populateCuisineSelect(select, emptyLabel = 'Not set', selectedValue = '') {
      if (!select) return;
      select.innerHTML = this.renderCuisineOptions(selectedValue || select.value || '', emptyLabel);
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

    normalizeSearchText(value = '') {
      return String(value || '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/['’]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    },

    searchAliases(query = '') {
      const normalized = this.normalizeSearchText(query);
      const aliases = new Set(normalized ? normalized.split(' ') : []);
      const aliasMap = {
        noodle: ['noodles', 'ramen', 'pho', 'vietnamese', 'asian'],
        noodles: ['noodle', 'ramen', 'pho', 'vietnamese', 'asian'],
        ramen: ['noodle', 'noodles', 'japanese', 'asian'],
        coffee: ['cafe', 'cafes', 'espresso', 'brunch'],
        cafe: ['coffee', 'espresso', 'brunch', 'bakery'],
        cafes: ['cafe', 'coffee', 'brunch'],
        nandos: ['nando', 'nandos', 'chicken', 'peri peri'],
        nando: ['nandos', 'chicken', 'peri peri'],
        restaurant: ['restaurants', 'dining', 'food'],
        restaurants: ['restaurant', 'dining', 'food'],
        pizza: ['pizzeria', 'dominos', 'domino', 'italian'],
        dominos: ['domino', 'pizza', 'pizzeria'],
        bakery: ['baker', 'cake', 'pastry', 'patisserie'],
        dessert: ['cake', 'bakery', 'sweet'],
        sushi: ['japanese', 'sashimi'],
        burger: ['burgers', 'american', 'fast food'],
        burgers: ['burger', 'american', 'fast food'],
        boba: ['bubble tea', 'milk tea', 'tea'],
        tea: ['boba', 'bubble tea', 'drinks']
      };

      normalized.split(' ').forEach(token => {
        (aliasMap[token] || []).forEach(alias => {
          this.normalizeSearchText(alias).split(' ').forEach(part => aliases.add(part));
        });
      });

      return Array.from(aliases).filter(Boolean);
    },

    getRecentSearches() {
      try {
        const items = JSON.parse(localStorage.getItem(STORAGE_KEYS.recentSearches) || '[]');
        return Array.isArray(items) ? items.filter(Boolean).slice(0, 10) : [];
      } catch (error) {
        return [];
      }
    },

    rememberSearch(query = '') {
      const value = String(query || '').trim();
      if (!value) return;
      const next = [value, ...this.getRecentSearches().filter(item => this.normalizeSearchText(item) !== this.normalizeSearchText(value))].slice(0, 10);
      this.state.recentSearches = next;
      localStorage.setItem(STORAGE_KEYS.recentSearches, JSON.stringify(next));
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

    ratingWord(value) {
      return ['zero', 'one', 'two', 'three', 'four', 'five'][value] || 'zero';
    },

    renderRatingStars(rating) {
      const numericRating = Number(rating);
      const roundedRating = Number.isFinite(numericRating)
        ? Math.max(0, Math.min(5, Math.round(numericRating)))
        : 0;
      const stars = `${'★'.repeat(roundedRating)}${'☆'.repeat(5 - roundedRating)}`;
      return `<span class="rating-pill rating-stars" aria-label="Rated ${this.ratingWord(roundedRating)} out of five stars">${stars}</span>`;
    },

    buildPreferenceRecommendations(restaurants, preferredCuisine = '', limit = 6) {
      const preferred = String(preferredCuisine || '').trim().toLowerCase();
      const sorted = [...restaurants].sort((left, right) => Number(right.rating || 0) - Number(left.rating || 0));
      if (!preferred) return sorted.slice(0, limit);

      const preferredRestaurants = sorted.filter(restaurant => String(restaurant.cuisine || '').toLowerCase() === preferred);
      const otherRestaurants = sorted.filter(restaurant => String(restaurant.cuisine || '').toLowerCase() !== preferred);
      const preferredLimit = Math.min(preferredRestaurants.length, Math.ceil(limit * 0.8));
      const chosen = preferredRestaurants.slice(0, preferredLimit);
      return [...chosen, ...otherRestaurants.slice(0, limit - chosen.length)];
    },

    buildSmartRecommendations(restaurants, options = {}, limit = 6) {
      const preferredCuisine = this.normalizeSearchText(options.preferredCuisine || '');
      const favouriteRestaurants = options.favourites || [];
      const recentSearches = options.recentSearches || [];
      const favouriteSignals = favouriteRestaurants.flatMap(restaurant => [
        restaurant.name,
        restaurant.cuisine,
        restaurant.primaryType,
        ...(restaurant.tags || [])
      ]);
      const searchSignals = recentSearches.flatMap(query => this.searchAliases(query));
      const signals = [
        ...this.searchAliases(preferredCuisine),
        ...favouriteSignals.flatMap(value => this.searchAliases(value)),
        ...searchSignals
      ].filter(Boolean);
      const favouriteIds = new Set(favouriteRestaurants.map(restaurant => restaurant.id));

      return [...restaurants]
        .map(restaurant => {
          const haystack = this.normalizeSearchText([
            restaurant.name,
            restaurant.cuisine,
            restaurant.primaryType,
            restaurant.blurb,
            restaurant.description,
            (restaurant.tags || []).join(' ')
          ].filter(Boolean).join(' '));
          const cuisine = this.normalizeSearchText(restaurant.cuisine || '');
          const signalScore = signals.reduce((score, signal) => score + (haystack.includes(this.normalizeSearchText(signal)) ? 1 : 0), 0);
          const preferredScore = preferredCuisine && cuisine.includes(preferredCuisine) ? 8 : 0;
          const favouritePenalty = favouriteIds.has(restaurant.id) ? -2 : 0;
          const ratingScore = Number(restaurant.rating || 0);
          return {
            restaurant,
            score: preferredScore + signalScore * 2 + ratingScore + favouritePenalty
          };
        })
        .sort((left, right) => right.score - left.score || Number(right.restaurant.rating || 0) - Number(left.restaurant.rating || 0))
        .slice(0, limit)
        .map(item => item.restaurant);
    },

    hashString(value = '') {
      const str = String(value || '');
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    },

    imageSignature(item) {
      if (!item || typeof item !== 'object') return String(item || '');
      const tags = Array.isArray(item.tags) ? item.tags.join(' ') : item.tags;
      const types = Array.isArray(item.types) ? item.types.join(' ') : item.types;
      return [
        item.id,
        item.name,
        item.cuisine,
        item.primaryType,
        tags,
        types,
        item.blurb,
        item.description,
        item.address
      ].filter(Boolean).join(' ');
    },

    imageCategoryFor(item) {
      const signature = this.imageSignature(item).toLowerCase();
      if (/\b(ramen|tonkotsu|gyoza)\b/.test(signature)) return 'ramen';
      if (/\b(sushi|sashimi|omakase|aburi)\b/.test(signature)) return 'sushi';
      if (/\b(cafe|coffee|brunch|cold brew|espresso|pastr|bakery|patisserie|sourdough|croissant)\b/.test(signature)) {
        return /\b(bakery|patisserie|pastr|croissant)\b/.test(signature) ? 'bakery' : 'cafe';
      }
      if (/\b(boba|bubble tea|milk tea|fruit tea|tea house|drinks|jasmine|mango)\b/.test(signature)) return 'drinks';
      if (/\b(vietnamese|pho|banh mi|saigon|noodles|lemongrass)\b/.test(signature)) return 'vietnamese';
      if (/\b(pizza|domino|domino's|woodfired)\b/.test(signature)) return 'pizza';
      if (/\b(chicken|nando|nando's|peri peri|tenders)\b/.test(signature)) return 'chicken';
      if (/\b(pasta|italian|rigatoni|truffle)\b/.test(signature)) return 'italian';
      if (/\b(burger|burgers|smash|grill)\b/.test(signature)) return 'burgers';
      if (/\b(korean|bibimbap|kimchi|gochujang|korean bbq|soy garlic)\b/.test(signature)) return 'korean';
      if (/\b(thai|pad thai|green curry|curry|wok|spicy)\b/.test(signature)) return 'thai';
      if (/\b(mexican|taco|tacos|birria|elote|quesadilla|cantina)\b/.test(signature)) return 'mexican';
      if (/\b(cake|dessert|cheesecake|sweet)\b/.test(signature)) return 'dessert';
      return 'default';
    },

    getGooglePlacePhotoUrl(place = {}) {
      const photoName = String(place.photoName || '').trim();
      if (!photoName) return '';
      return `/api/google/photo?name=${encodeURIComponent(photoName)}&maxWidthPx=900&maxHeightPx=650`;
    },

    getGooglePlaceFilterOptions(places = []) {
      const ignoredTags = new Set(['point_of_interest', 'establishment', 'food', 'store']);
      const typeSet = new Set();

      places.forEach(place => {
        const primaryType = String(place.primaryType || '').trim();
        if (primaryType) typeSet.add(primaryType);
        if (place.cuisine) typeSet.add(String(place.cuisine).trim());

        (place.types || []).forEach(type => {
          const normalizedType = String(type || '').trim();
          if (!normalizedType || ignoredTags.has(normalizedType)) return;
          typeSet.add(normalizedType);
        });
        (place.tags || []).forEach(tag => {
          const normalizedTag = String(tag || '').trim();
          if (!normalizedTag || ignoredTags.has(normalizedTag)) return;
          typeSet.add(normalizedTag);
        });
      });

      return {
        types: Array.from(typeSet).sort()
      };
    },

    renderRestaurantTagLinks(tags = []) {
      return (tags || [])
        .filter(Boolean)
        .map(tag => {
          const tagText = String(tag);
          return `<a class="badge badge-soft tag-link" href="browse.html?tag=${encodeRouteValue(tagText)}">${escapeHtml(tagText)}</a>`;
        })
        .join('');
    },

    getRestaurantImage(item) {
      const googlePhotoUrl = item && typeof item === 'object' ? this.getGooglePlacePhotoUrl(item) : '';
      if (googlePhotoUrl) return googlePhotoUrl;

      const signature = this.imageSignature(item);
      if (item && typeof item === 'object' && item.id && RESTAURANT_IMAGE_OVERRIDES[item.id]) {
        return RESTAURANT_IMAGE_OVERRIDES[item.id];
      }

      const category = this.imageCategoryFor(item);
      const images = RESTAURANT_IMAGE_LIBRARY[category] || RESTAURANT_IMAGE_LIBRARY.default;
      return images[this.hashString(signature || category) % images.length];
    },

    renderRestaurantCard(restaurant) {
      const distanceHtml = restaurant.distanceKm != null ? `<span class="distance-pill">📍 ${restaurant.distanceKm.toFixed(1)} km</span>` : '';
      const imageUrl = this.getRestaurantImage(restaurant);
      const imageHtml = `<img src="${imageUrl}" alt="${this.escapeHtml(restaurant.name)}" class="restaurant-image-img" style="width:100%;height:100%;object-fit:cover;border-radius:1rem;" loading="lazy" />`;
      const restaurantId = encodeRouteValue(restaurant.id);
      const websiteButton = restaurant.websiteUri
        ? `<a class="btn btn-outline-dark btn-sm" href="${escapeHtml(restaurant.websiteUri)}" target="_blank" rel="noopener noreferrer">Website</a>`
        : '';
      return `
        <div class="col-md-6 col-xl-4">
          <div class="restaurant-card p-3 d-flex flex-column">
            <div class="restaurant-image mb-3 position-relative overflow-hidden">${imageHtml}</div>
            <div class="d-flex flex-wrap mb-2">
              ${this.renderRatingStars(restaurant.rating)}
              <span class="price-pill">${escapeHtml(restaurant.price)}</span>
              <span class="cuisine-pill">${escapeHtml(restaurant.cuisine)}</span>
              ${distanceHtml}
            </div>
            <h3 class="h5 fw-bold">${escapeHtml(restaurant.name)}</h3>
            <p class="text-secondary mb-2">${escapeHtml(restaurant.suburb)} • ${escapeHtml(restaurant.address)}</p>
            <p class="text-secondary">${escapeHtml(restaurant.blurb)}</p>
            <div class="d-flex flex-wrap gap-2 mt-auto pt-2">
              <a class="btn btn-primary btn-sm" href="restaurant.html?id=${restaurantId}">View details</a>
              <button class="btn btn-outline-dark btn-sm save-restaurant-trigger" data-id="${restaurantId}">Save</button>
              ${websiteButton}
            </div>
          </div>
        </div>
      `;
    },

    renderDishCard(restaurant, dish) {
      return '';
    },

    renderReviewCard(review, own = false) {
      const user = this.getDisplayUser(review.userId, review.user);
      const restaurant = this.getRestaurantById(review.restaurantId);
      const editable = own && !String(review.id).startsWith('sr');
      const manageButton = editable ? `<a class="btn btn-outline-dark btn-sm" href="edit-review.html?id=${encodeRouteValue(review.id)}">Edit</a>` : '';
      const reviewMeta = [
        `By <a href="user.html?id=${encodeRouteValue(user.id)}">${escapeHtml(user.name)}</a>`,
        escapeHtml(this.formatDate(review.createdAt))
      ];
      if (restaurant) reviewMeta.push(escapeHtml(restaurant.name));
      return `
        <div class="review-card p-3 mb-3">
          <div class="d-flex justify-content-between align-items-start gap-3 mb-2">
            <div>
              <h3 class="h5 fw-bold mb-1">${escapeHtml(review.title)}</h3>
              <div class="review-meta">${reviewMeta.join(' • ')}</div>
            </div>
            <div class="text-end">
              ${this.renderRatingStars(review.rating)}
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
      if (place.googleMapsUri) return place.googleMapsUri;
      if (place.lat == null || place.lng == null) return '#';
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.lat},${place.lng}`)}`;
    },

    async searchGooglePlacesByAddress(address, radius = 8000, includedTypes = ['restaurant', 'cafe'], maxResultCount = 12, query = '') {
      const payload = await this.api('/api/google/search-location', {
        method: 'POST',
        body: {
          address,
          radius,
          includedTypes,
          maxResultCount,
          query
        }
      });
    
      return payload;
    },

    renderGooglePlaceCard(place, index = 0) {
      const tagHtml = (place.types || [])
        .filter(type => !['point_of_interest', 'establishment', 'food', 'store'].includes(type))
        .slice(0, 3)
        .map(type => `<span class="badge badge-soft">${escapeHtml(this.formatPlaceType(type))}</span>`)
        .join('');
      const websiteButton = place.websiteUri
        ? `<a class="btn btn-outline-dark btn-sm" href="${escapeHtml(place.websiteUri)}" target="_blank" rel="noopener noreferrer">Website</a>`
        : '';

      return `
        <div class="col-md-6 col-xl-4">
          <div class="restaurant-card p-3 h-100">
            <div class="restaurant-image mb-3 position-relative overflow-hidden"><img src="${this.getRestaurantImage(place)}" alt="${escapeHtml(place.name || 'Nearby place')}" class="restaurant-image-img" style="width:100%;height:100%;object-fit:cover;border-radius:1rem;" loading="lazy" /></div>
            <div class="d-flex flex-wrap mb-2">
              ${this.renderRatingStars(place.rating)}
              <span class="cuisine-pill">${escapeHtml(this.formatPlaceType(place.primaryType || 'place'))}</span>
            </div>
            <h3 class="h5 fw-bold">${escapeHtml(place.name || 'Unnamed place')}</h3>
            <p class="text-secondary mb-2">${escapeHtml(place.address || 'Address unavailable')}</p>
            <div class="d-flex flex-wrap gap-2 mb-3">${tagHtml}</div>
            <div class="d-flex flex-wrap gap-2">
              <button class="btn btn-primary btn-sm open-google-place-trigger" data-index="${index}">View details</button>
              <button class="btn btn-outline-dark btn-sm save-google-place-trigger" data-index="${index}">Save</button>
              ${websiteButton}
              <a class="btn btn-outline-dark btn-sm" href="${this.googleMapsUrl(place)}" target="_blank" rel="noopener noreferrer">Open map</a>
            </div>
          </div>
        </div>
      `;
    },

    async mirrorGooglePlace(place) {
      return this.api('/api/restaurants/from-google', {
        method: 'POST',
        body: {
          placeId: place.id,
          name: place.name,
          address: place.address,
          lat: place.lat,
          lng: place.lng,
          rating: place.rating,
          primaryType: place.primaryType,
          types: place.types || [],
          photoName: place.photoName || '',
          websiteUri: place.websiteUri || '',
          googleMapsUri: place.googleMapsUri || ''
        }
      });
    },

    bindGooglePlaceButtons(places) {
      document.querySelectorAll('.open-google-place-trigger').forEach(button => {
        button.onclick = async () => {
          const place = places[Number(button.dataset.index)];
          if (!place) return;
          button.disabled = true;
          button.textContent = 'Opening...';
          try {
            const payload = await this.mirrorGooglePlace(place);
            window.location.href = `restaurant.html?id=${encodeRouteValue(payload.restaurant.id)}`;
          } catch (error) {
            button.disabled = false;
            button.textContent = 'View details';
            this.showMessage('browseLocationMessage', error.message, 'error');
          }
        };
      });
      document.querySelectorAll('.save-google-place-trigger').forEach(button => {
        button.onclick = async () => {
          const place = places[Number(button.dataset.index)];
          if (!place) return;
          if (!this.getCurrentUser()) {
            this.showMessage('browseLocationMessage', 'Please log in before saving favourites.', 'error');
            return;
          }
          button.disabled = true;
          button.textContent = 'Saving...';
          try {
            const payload = await this.mirrorGooglePlace(place);
            await this.saveRestaurant(payload.restaurant.id, 'browseLocationMessage');
            button.textContent = 'Saved';
          } catch (error) {
            button.disabled = false;
            button.textContent = 'Save';
            this.showMessage('browseLocationMessage', error.message, 'error');
          }
        };
      });
    },

    async fetchNearbyGooglePlaces(coords, radius = 8000, includedTypes = ['restaurant', 'cafe'], maxResultCount = 12, query = '') {
      const payload = await this.api('/api/google/nearby', {
        method: 'POST',
        body: {
          lat: coords.lat,
          lng: coords.lng,
          radius,
          includedTypes,
          maxResultCount,
          query
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

    filterBrowseGooglePlaces(places, filters = {}) {
      const search = String(filters.search || '').trim().toLowerCase();
      const selectedType = String(filters.selectedType || '');
      const minRating = parseFloat(filters.minRating || '0');
      const searchTerms = this.searchAliases(search);

      return this.filterGooglePlaces(places, Number.isFinite(minRating) ? minRating : 0).filter(place => {
        const haystack = this.normalizeSearchText([
          place.name,
          place.address,
          place.primaryType,
          (place.types || []).join(' '),
          place.cuisine,
          place.blurb,
          place.description
        ].filter(Boolean).join(' '));
        if (searchTerms.length && !searchTerms.some(term => haystack.includes(this.normalizeSearchText(term)))) return false;
        if (selectedType && place.primaryType !== selectedType && place.cuisine !== selectedType && !(place.types || []).includes(selectedType) && !(place.tags || []).includes(selectedType)) return false;
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
      const messageClass = classes[type] || 'text-secondary';
      element.className = element.classList.contains('auth-message') ? `auth-message ${messageClass}` : messageClass;
      element.textContent = message;
    },

    getPasswordChecks(value) {
      return {
        length: value.length >= 8 && value.length <= 72,
        lowercase: /[a-z]/.test(value),
        uppercase: /[A-Z]/.test(value),
        number: /\d/.test(value)
      };
    },

    updatePasswordRules(input) {
      const rules = document.getElementById('signupPasswordRules');
      if (!rules || !input) return;
      const checks = this.getPasswordChecks(input.value);
      rules.querySelectorAll('[data-rule]').forEach(item => {
        item.classList.toggle('is-met', Boolean(checks[item.dataset.rule]));
      });
    },

    validateAuthField(input, mode) {
      const value = input.value.trim();
      if (input.name === 'name' && mode === 'signup') {
        if (!value) return 'Enter your full name.';
        if (value.length < 2 || value.length > 60) return 'Full name must be 2-60 characters.';
        if (!/^[A-Za-z][A-Za-z' -]*[A-Za-z]$/.test(value)) {
          return 'Use letters only. Spaces, hyphens, and apostrophes are allowed.';
        }
      }

      if (input.name === 'username' && mode === 'signup') {
        if (!value) return 'Choose a username.';
        if (value.length < 3 || value.length > 24) return 'Username must be 3-24 characters.';
        if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(value)) {
          return 'Start with a letter and use only letters, numbers, or underscores.';
        }
      }

      if (input.name === 'email') {
        if (!value) return 'Enter your email address.';
        if (value.length > 255) return 'Email must be 255 characters or fewer.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
          return 'Enter a valid email address, such as avery@example.com.';
        }
      }

      if (input.name === 'confirmEmail' && mode === 'signup') {
        if (!value) return 'Please confirm your email address.';
        const emailInput = input.form ? input.form.elements.email : null;
        if (emailInput && value.toLowerCase() !== emailInput.value.trim().toLowerCase()) {
          return 'Email addresses do not match.';
        }
      }

      if (input.name === 'password') {
        const password = input.value;
        const checks = this.getPasswordChecks(password);
        if (!password) return mode === 'signup' ? 'Create a password.' : 'Enter your password.';
        if (!checks.length) return 'Password must be 8-72 characters.';
        if (mode === 'signup' && (!checks.lowercase || !checks.uppercase || !checks.number)) {
          return 'Password needs uppercase, lowercase, and a number.';
        }
      }

      if (input.name === 'preferredCuisine' && mode === 'signup' && value) {
        const allowedValues = Array.from(input.options).map(option => option.value || option.textContent.trim());
        if (!allowedValues.includes(value)) return 'Choose a cuisine from the list.';
      }

      return '';
    },

    setAuthFieldState(input, message, shake = false) {
      const field = input.closest('.auth-field');
      const error = field ? field.querySelector('.field-error') : null;
      const hasError = Boolean(message);
      input.classList.toggle('is-invalid', hasError);
      input.setAttribute('aria-invalid', hasError ? 'true' : 'false');
      if (field) field.classList.toggle('has-error', hasError);
      if (error) error.textContent = message;

      if (hasError && shake && field) {
        field.classList.remove('is-shaking');
        void field.offsetWidth;
        field.classList.add('is-shaking');
        window.setTimeout(() => field.classList.remove('is-shaking'), 320);
      }
    },

    flashAuthCard(form) {
      const card = form.closest('.auth-card');
      if (!card) return;
      card.classList.remove('flash-error');
      void card.offsetWidth;
      card.classList.add('flash-error');
      window.setTimeout(() => card.classList.remove('flash-error'), 560);
    },

    validateAuthForm(form, mode, shake = false) {
      const fields = Array.from(form.querySelectorAll('input[name], select[name]'));
      let firstInvalid = null;
      fields.forEach(input => {
        if (input.name === 'password') this.updatePasswordRules(input);
        const message = this.validateAuthField(input, mode);
        this.setAuthFieldState(input, message, shake);
        if (message && !firstInvalid) firstInvalid = input;
      });

      if (firstInvalid) {
        if (shake) this.flashAuthCard(form);
        firstInvalid.focus();
        return false;
      }

      return true;
    },

    bindAuthValidation(form, mode) {
      const fields = Array.from(form.querySelectorAll('input[name], select[name]'));
      fields.forEach(input => {
        input.addEventListener('blur', () => {
          if (input.name === 'password') this.updatePasswordRules(input);
          this.setAuthFieldState(input, this.validateAuthField(input, mode), true);
        });

        input.addEventListener('input', () => {
          if (input.name === 'password') this.updatePasswordRules(input);
          if (input.classList.contains('is-invalid')) {
            this.setAuthFieldState(input, this.validateAuthField(input, mode));
          }
        });

        input.addEventListener('change', () => {
          if (input.classList.contains('is-invalid')) {
            this.setAuthFieldState(input, this.validateAuthField(input, mode));
          }
        });
      });
      this.updatePasswordRules(form.querySelector('input[name="password"]'));
    },

    getAuthPayload(form) {
      const payload = Object.fromEntries(new FormData(form).entries());
      ['name', 'username', 'email', 'preferredCuisine'].forEach(key => {
        if (payload[key]) payload[key] = payload[key].trim();
      });
      return payload;
    },

    applyAuthServerError(form, mode, message) {
      this.flashAuthCard(form);
      if (mode === 'login') {
        ['email', 'password'].forEach(name => {
          const input = form.elements[name];
          if (input) this.setAuthFieldState(input, 'Check your email and password, then try again.', true);
        });
        form.elements.email?.focus();
      }

      if (mode === 'signup' && /already exists/i.test(message)) {
        ['email', 'username'].forEach(name => {
          const input = form.elements[name];
          if (input) this.setAuthFieldState(input, 'This username or email may already be in use.', true);
        });
        form.elements.username?.focus();
      }
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
          if (query) {
            this.rememberSearch(query);
            window.location.href = `browse.html?search=${encodeURIComponent(query)}`;
          }
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
      this.populateCuisineSelect(form.elements.preferredCuisine, 'Choose one');
      this.bindAuthValidation(form, 'signup');
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!this.validateAuthForm(form, 'signup', true)) {
          this.showMessage('signupMessage', 'Please fix the highlighted fields before creating your account.', 'error');
          return;
        }
        const payload = this.getAuthPayload(form);
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
          this.applyAuthServerError(form, 'signup', error.message);
        }
      });
    },

    initLogin() {
      const form = document.getElementById('loginForm');
      if (!form) return;
      this.bindAuthValidation(form, 'login');
      form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!this.validateAuthForm(form, 'login', true)) {
          this.showMessage('loginMessage', 'Please fix the highlighted fields before logging in.', 'error');
          return;
        }
        const payload = this.getAuthPayload(form);
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
          this.applyAuthServerError(form, 'login', error.message);
        }
      });
    },

        initForgotPassword() {
      const form = document.getElementById('forgotPasswordForm');
      if (!form) return;

      form.addEventListener('submit', async event => {
        event.preventDefault();

        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());

        try {
          await this.api('/api/auth/reset-password', {
            method: 'POST',
            body: payload
          });

          await this.loadCurrentUser();
          this.renderLayout();

          this.showMessage(
            'forgotPasswordMessage',
            'Password reset successfully. Redirecting to your profile...',
            'success'
          );

          window.setTimeout(() => {
            window.location.href = 'profile.html';
          }, 900);
        } catch (error) {
          this.showMessage('forgotPasswordMessage', error.message, 'error');
        }
      });
    },

    initBrowse() {
      const locationForm = document.getElementById('browseLocationForm');
      const locationInput = document.getElementById('locationInput');
      const locationSearchBtn = document.getElementById('searchLocationBrowse');
      const searchInput = document.getElementById('searchInput');
      const typeSelect = document.getElementById('placeTypeFilter');
      const ratingSelect = document.getElementById('ratingFilter');
      const resultsTarget = document.getElementById('browseResults');
      const resultsCount = document.getElementById('resultsCount');
      const params = new URLSearchParams(window.location.search);
      const urlSearch = params.get('search');
      const urlTag = params.get('tag');
      let places = [...this.state.restaurants];
      let activeCoords = null;

      if (!locationForm || !locationInput || !searchInput || !typeSelect || !ratingSelect || !resultsTarget) return;
      if (urlSearch) searchInput.value = urlSearch;
      if (!urlSearch && urlTag) searchInput.value = urlTag;

      const renderFilterOptions = () => {
        const options = this.getGooglePlaceFilterOptions(places);
        const currentType = typeSelect.value;
        if (urlTag && !options.types.includes(urlTag)) options.types.unshift(urlTag);
        typeSelect.innerHTML = `<option value="">Any</option>${options.types.map(type => `<option value="${escapeHtml(type)}">${escapeHtml(this.formatPlaceType(type))}</option>`).join('')}`;
        if (options.types.includes(currentType)) typeSelect.value = currentType;
        if (urlTag && options.types.includes(urlTag) && !currentType) typeSelect.value = urlTag;
      };

      const render = () => {
        const filtered = this.filterBrowseGooglePlaces(places, {
          search: searchInput.value,
          selectedType: typeSelect.value,
          minRating: ratingSelect.value
        });

        resultsTarget.innerHTML = filtered.length
          ? filtered.map((place, index) => place.source === 'google_places' ? this.renderGooglePlaceCard(place, index) : this.renderRestaurantCard(place)).join('')
          : this.emptyState(places.length ? 'No nearby places matched those filters.' : 'Enter a location to load nearby restaurants.');
        if (resultsCount) resultsCount.textContent = `${filtered.length} place${filtered.length === 1 ? '' : 's'} found`;
        this.bindGooglePlaceButtons(filtered);
        this.bindSaveButtons();
      };

      const setLocationLoading = loading => {
        if (locationSearchBtn) {
          locationSearchBtn.disabled = loading;
          locationSearchBtn.textContent = loading ? 'Searching...' : 'Search area';
        }
      };

      const loadLocationSearch = async address => {
        const trimmedAddress = String(address || '').trim();
        if (!trimmedAddress) {
          this.showMessage('browseLocationMessage', 'Enter a suburb, postcode, or address to search.', 'error');
          locationInput.focus();
          return;
        }

        setLocationLoading(true);
        activeCoords = null;
        this.rememberSearch(searchInput.value);
        resultsTarget.innerHTML = this.emptyState(`Searching near ${trimmedAddress}...`);
        this.showMessage('browseLocationMessage', 'Loading nearby restaurants from Google Places...', 'info');

        try {
          const payload = await this.searchGooglePlacesByAddress(trimmedAddress, 12000, ['restaurant', 'cafe', 'bar', 'bakery', 'meal_takeaway', 'meal_delivery'], 60, searchInput.value);
          places = payload.results || [];
          renderFilterOptions();
          render();
          const resolvedAddress = payload.searchLocation?.formattedAddress || trimmedAddress;
          this.showMessage('browseLocationMessage', `Showing nearby places around ${resolvedAddress}.`, 'success');
        } catch (error) {
          places = [];
          renderFilterOptions();
          render();
          this.showMessage('browseLocationMessage', error.message, 'error');
        } finally {
          setLocationLoading(false);
        }
      };

      ['input', 'change'].forEach(eventName => {
        searchInput.addEventListener(eventName, render);
        typeSelect.addEventListener(eventName, render);
        ratingSelect.addEventListener(eventName, render);
      });
      searchInput.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        if (activeCoords) {
          loadLocationByCoords(activeCoords.lat, activeCoords.lng, activeCoords.label);
        } else if (locationInput.value.trim()) {
          loadLocationSearch(locationInput.value);
        }
      });
      locationForm.addEventListener('submit', event => {
        event.preventDefault();
        loadLocationSearch(locationInput.value);
      });

      const useMyLocationBtn = document.getElementById('useMyLocationBtn');

      const loadLocationByCoords = async (lat, lng, label) => {
        setLocationLoading(true);
        activeCoords = { lat, lng, label: label || 'My location' };
        this.rememberSearch(searchInput.value);
        if (useMyLocationBtn) { useMyLocationBtn.disabled = true; useMyLocationBtn.textContent = 'Locating...'; }
        locationInput.value = label || 'My location';
        resultsTarget.innerHTML = this.emptyState('Finding restaurants near you...');
        this.showMessage('browseLocationMessage', 'Loading nearby restaurants from your location...', 'info');

        try {
          const results = await this.fetchNearbyGooglePlaces(
            { lat, lng },
            12000,
            ['restaurant', 'cafe', 'bar', 'bakery', 'meal_takeaway', 'meal_delivery'],
            60,
            searchInput.value
          );
          places = results;
          renderFilterOptions();
          render();
          this.showMessage('browseLocationMessage', `Showing ${places.length} places near your location.`, 'success');
          this.setUserLocation({ lat, lng });
        } catch (error) {
          places = [];
          renderFilterOptions();
          render();
          this.showMessage('browseLocationMessage', error.message, 'error');
        } finally {
          setLocationLoading(false);
          if (useMyLocationBtn) { useMyLocationBtn.disabled = false; useMyLocationBtn.textContent = '📍 Use my location'; }
        }
      };

      const requestGeolocation = () => {
        if (!navigator.geolocation) {
          this.showMessage('browseLocationMessage', 'Geolocation is not supported by your browser.', 'error');
          return;
        }
        if (useMyLocationBtn) { useMyLocationBtn.disabled = true; useMyLocationBtn.textContent = 'Locating...'; }
        navigator.geolocation.getCurrentPosition(
          position => {
            loadLocationByCoords(position.coords.latitude, position.coords.longitude, 'My location');
          },
          () => {
            if (useMyLocationBtn) { useMyLocationBtn.disabled = false; useMyLocationBtn.textContent = '📍 Use my location'; }
            this.showMessage('browseLocationMessage', 'Location access denied. Please type a location or allow permission.', 'error');
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );
      };

      if (useMyLocationBtn) {
        useMyLocationBtn.addEventListener('click', requestGeolocation);
      }

      renderFilterOptions();
      render();

      // Auto-detect: use cached location or prompt for geolocation on first visit
      const cachedLocation = this.getUserLocation();
      if (cachedLocation) {
        loadLocationByCoords(cachedLocation.lat, cachedLocation.lng, 'My location');
      } else if (navigator.geolocation) {
        requestGeolocation();
      } else {
        this.showMessage('browseLocationMessage', 'Enter a location to search nearby restaurants.', 'info');
      }
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
        const tagLinks = this.renderRestaurantTagLinks(restaurant.tags || []);
        const reviewHref = `write-review.html?restaurantId=${encodeRouteValue(restaurant.id)}`;
        const websiteButton = restaurant.websiteUri
          ? `<a class="btn btn-outline-dark btn-sm" href="${escapeHtml(restaurant.websiteUri)}" target="_blank" rel="noopener noreferrer">Visit website</a>`
          : '';
        const mapButton = restaurant.googleMapsUri || (restaurant.lat != null && restaurant.lng != null)
          ? `<a class="btn btn-outline-dark btn-sm" href="${this.googleMapsUrl(restaurant)}" target="_blank" rel="noopener noreferrer">Open map</a>`
          : '';
        document.getElementById('restaurantHero').innerHTML = `
          <p class="eyebrow mb-2">Restaurant details</p>
          <div class="row g-4 align-items-center">
            <div class="col-lg-8">
              <h1 class="fw-bold mb-3">${escapeHtml(restaurant.name)}</h1>
              <p class="text-secondary mb-3">${escapeHtml(restaurant.suburb)} • ${escapeHtml(restaurant.address)}</p>
              <div class="d-flex flex-wrap">
                ${this.renderRatingStars(average)}
                <span class="price-pill">${escapeHtml(restaurant.price)}</span>
                <span class="cuisine-pill">${escapeHtml(restaurant.cuisine)}</span>
              </div>
            </div>
            <div class="col-lg-4"><div class="detail-image position-relative overflow-hidden"><img src="${this.getRestaurantImage(restaurant)}" alt="${escapeHtml(restaurant.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:1rem;" loading="lazy" /></div></div>
          </div>
        `;
        document.getElementById('restaurantAbout').innerHTML = `
          <h2 class="h4 fw-bold mb-3">About this place</h2>
          <p class="text-secondary">${escapeHtml(restaurant.blurb)}</p>
          <div class="d-flex flex-wrap gap-2 mb-3">${websiteButton}${mapButton}</div>
          <div class="d-flex flex-wrap gap-2 align-items-center"><strong>Popular tags:</strong> ${tagLinks || '<span class="text-secondary">No tags yet.</span>'}</div>
        `;
        document.getElementById('restaurantReviews').innerHTML = reviews.length ? reviews.map(review => this.renderReviewCard(review, this.getCurrentUser() && this.getCurrentUser().id === review.userId)).join('') : this.emptyState('No reviews yet. Be the first to share your experience.');
        document.getElementById('restaurantSidebar').innerHTML = `
          <h3 class="h5 fw-bold mb-3">Quick facts</h3>
          <p class="mb-2"><strong>Cuisine:</strong> ${escapeHtml(restaurant.cuisine)}</p>
          <p class="mb-2"><strong>Price range:</strong> ${escapeHtml(restaurant.price)}</p>
          <div class="mb-2 d-flex flex-wrap gap-2 align-items-center"><strong>Average rating:</strong> ${this.renderRatingStars(average)}</div>
          <p class="mb-0"><strong>Reviews:</strong> ${reviews.length}</p>
        `;
        document.querySelectorAll('a[href="write-review.html"]').forEach(link => {
          link.href = reviewHref;
        });
        document.getElementById('saveRestaurantBtn').addEventListener('click', async () => {
          await this.saveRestaurant(restaurant.id, 'saveRestaurantMessage');
        });
        this.bindSaveButtons();
      } catch (error) {
        this.showFullPageNotice(error.message, 'browse.html');
      }
    },

    async initDishPage() {
      this.showFullPageNotice('BiteScout now reviews places only, so dish pages have been removed.', 'browse.html');
    },

    async initWriteReview() {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        this.showFullPageNotice('Please log in before writing a review.', 'login.html');
        return;
      }
      const restaurantSelect = document.getElementById('reviewRestaurantSelect');
      restaurantSelect.innerHTML = this.state.restaurants.map(restaurant => `<option value="${escapeHtml(restaurant.id)}">${escapeHtml(restaurant.name)}</option>`).join('');
      const params = new URLSearchParams(window.location.search);
      const presetRestaurant = params.get('restaurantId');
      if (presetRestaurant) {
        if (!this.getRestaurantById(presetRestaurant)) {
          this.upsertRestaurant(await this.api(`/api/restaurants/${presetRestaurant}`));
        }
        restaurantSelect.value = presetRestaurant;
      }
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

    renderAvatarPicker(selectedValue = '') {
      const selected = selectedValue || `preset:${DEFAULT_AVATAR_ID}`;
      return this.getAvatarPresets().map(preset => {
        const value = `preset:${preset.id}`;
        const activeClass = value === selected ? ' is-selected' : '';
        return `
          <button class="avatar-choice${activeClass}" type="button" data-avatar-value="${escapeHtml(value)}" aria-label="Choose ${escapeHtml(preset.label)} avatar">
            <img src="${escapeHtml(this.avatarPresetToDataUrl(preset))}" alt="">
            <span>${escapeHtml(preset.label)}</span>
          </button>
        `;
      }).join('');
    },

    renderProfileUserBar(user, options = {}) {
      const preferredCuisine = user.preferredCuisine || '';
      const preferredHref = preferredCuisine ? `browse.html?search=${encodeRouteValue(preferredCuisine)}` : 'recommendations.html';
      const bio = user.bio || 'No bio yet.';
      const reviewsLabel = `${options.reviewCount || 0} review${options.reviewCount === 1 ? '' : 's'}`;
      const favouritesLabel = options.favouriteCount == null ? '' : `${options.favouriteCount} favourite${options.favouriteCount === 1 ? '' : 's'}`;
      const editButton = options.editable ? '<button class="btn btn-primary" id="toggleProfileEditorBtn" type="button">Edit profile</button>' : '';

      return `
        <div class="profile-bar">
          <img class="profile-avatar-xl" id="${options.editable ? 'profileAvatarPreview' : 'otherProfileAvatar'}" src="${escapeHtml(this.getUserAvatarUrl(user))}" alt="${escapeHtml(user.name)} profile picture">
          <div class="profile-bar-body">
            <p class="eyebrow mb-2">${escapeHtml(options.eyebrow || 'My profile')}</p>
            <h1 class="fw-bold mb-2">${escapeHtml(user.name)}</h1>
            <p class="text-secondary mb-3">@${escapeHtml(user.username || 'member')}</p>
            <p class="profile-bio mb-3">${escapeHtml(bio)}</p>
            <div class="profile-bar-meta">
              <a class="profile-cuisine-link" href="${preferredHref}">Preferred cuisine: ${escapeHtml(preferredCuisine || 'Not set')}</a>
              <span>${escapeHtml(reviewsLabel)}</span>
              ${favouritesLabel ? `<span>${escapeHtml(favouritesLabel)}</span>` : ''}
            </div>
          </div>
          <div class="profile-bar-actions">${editButton}</div>
        </div>
      `;
    },

    bindProfileEditor(currentUser) {
      const editor = document.getElementById('profileEditor');
      const toggleButton = document.getElementById('toggleProfileEditorBtn');
      const form = document.getElementById('profileSettingsForm');
      const preview = document.getElementById('profileAvatarPreview');
      const avatarInput = document.getElementById('profileAvatarValue');
      const photoInput = document.getElementById('profilePhotoInput');
      const resetButton = document.getElementById('resetAvatarBtn');
      if (!editor || !toggleButton || !form || !preview || !avatarInput) return;

      const setAvatarValue = value => {
        avatarInput.value = value;
        preview.src = this.resolveAvatarUrl(value, currentUser.name);
        form.querySelectorAll('.avatar-choice').forEach(button => {
          button.classList.toggle('is-selected', button.dataset.avatarValue === value);
        });
      };

      toggleButton.addEventListener('click', () => {
        editor.hidden = !editor.hidden;
        toggleButton.textContent = editor.hidden ? 'Edit profile' : 'Close editor';
      });

      form.querySelectorAll('.avatar-choice').forEach(button => {
        button.addEventListener('click', () => {
          setAvatarValue(button.dataset.avatarValue || `preset:${DEFAULT_AVATAR_ID}`);
        });
      });

      if (resetButton) {
        resetButton.addEventListener('click', () => setAvatarValue(`preset:${DEFAULT_AVATAR_ID}`));
      }

      if (photoInput) {
        photoInput.addEventListener('change', () => {
          const file = photoInput.files && photoInput.files[0];
          if (!file) return;
          if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
            this.showMessage('profileEditorMessage', 'Choose a PNG, JPEG, WebP, or GIF image.', 'error');
            photoInput.value = '';
            return;
          }
          if (file.size > 1_500_000) {
            this.showMessage('profileEditorMessage', 'Profile photo is too large. Choose an image under 1.5 MB.', 'error');
            photoInput.value = '';
            return;
          }

          const reader = new FileReader();
          reader.addEventListener('load', () => {
            setAvatarValue(reader.result);
            this.showMessage('profileEditorMessage', 'Photo ready. Save your profile to keep it.', 'info');
          });
          reader.readAsDataURL(file);
        });
      }

      form.addEventListener('submit', async event => {
        event.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        const payload = {
          bio: form.elements.bio.value.trim(),
          preferredCuisine: form.elements.preferredCuisine.value,
          avatarUrl: avatarInput.value
        };

        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = 'Saving...';
        }

        try {
          const response = await this.api('/api/users/me', { method: 'PUT', body: payload });
          this.state.currentUser = response.user;
          this.renderLayout();
          await this.initProfile();
          this.showMessage('profileEditorMessage', 'Profile updated.', 'success');
        } catch (error) {
          this.showMessage('profileEditorMessage', error.message, 'error');
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Save profile';
          }
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
      const favouriteCount = favouriteRestaurants.length;
      const selectedAvatar = currentUser.avatarUrl || `preset:${DEFAULT_AVATAR_ID}`;
      document.getElementById('profileHeader').innerHTML = `
        ${this.renderProfileUserBar(currentUser, { editable: true, reviewCount: myReviews.length, favouriteCount })}
        <div class="profile-editor glass-card p-4 mt-4" id="profileEditor" hidden>
          <form id="profileSettingsForm">
            <div class="row g-4">
              <div class="col-lg-5">
                <label class="form-label fw-bold" for="profileBioInput">Bio</label>
                <textarea class="form-control" id="profileBioInput" name="bio" rows="5" maxlength="500" placeholder="Tell people what food you like.">${escapeHtml(currentUser.bio || '')}</textarea>
              </div>
              <div class="col-lg-7">
                <label class="form-label fw-bold" for="profileCuisineInput">Preferred cuisine</label>
                <select class="form-select mb-3" id="profileCuisineInput" name="preferredCuisine">
                  ${this.renderCuisineOptions(currentUser.preferredCuisine, 'Not set')}
                </select>
                <input type="hidden" id="profileAvatarValue" name="avatarUrl" value="${escapeHtml(selectedAvatar)}">
                <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
                  <label class="btn btn-outline-dark btn-sm profile-upload-control" for="profilePhotoInput">Upload photo</label>
                  <input class="visually-hidden" id="profilePhotoInput" type="file" accept="image/png,image/jpeg,image/webp,image/gif">
                  <button class="btn btn-outline-dark btn-sm" id="resetAvatarBtn" type="button">Use default avatar</button>
                </div>
                <div class="avatar-choice-grid">
                  ${this.renderAvatarPicker(selectedAvatar)}
                </div>
              </div>
            </div>
            <div class="d-flex justify-content-end gap-2 mt-4">
              <button class="btn btn-primary" type="submit">Save profile</button>
            </div>
          </form>
        </div>
      `;
      this.bindProfileEditor(currentUser);
      document.getElementById('myReviews').innerHTML = myReviews.length ? myReviews.map(review => this.renderReviewCard(review, true)).join('') : this.emptyState('You have not written any reviews yet.');
      const favouriteHtml = favouriteRestaurants.map(restaurant => `<div class="favorite-card p-3 mb-3"><h3 class="h5 fw-bold mb-1">${escapeHtml(restaurant.name)}</h3><p class="text-secondary mb-2">${escapeHtml(restaurant.suburb)} • ${escapeHtml(restaurant.cuisine)}</p><a href="restaurant.html?id=${encodeRouteValue(restaurant.id)}" class="btn btn-sm btn-primary">Open</a></div>`).join('');
      document.getElementById('profileFavourites').innerHTML = favouriteHtml || this.emptyState('Nothing saved yet.');
    },

    async initOtherUser() {
      const userId = new URLSearchParams(window.location.search).get('id');
      if (!userId) return;
      try {
        const user = await this.api(`/api/users/${userId}`);
        document.getElementById('otherUserHeader').innerHTML = `
          ${this.renderProfileUserBar(user, { eyebrow: 'Community member', reviewCount: user.reviews.length })}
        `;
        document.getElementById('otherUserReviews').innerHTML = user.reviews.length ? user.reviews.map(review => this.renderReviewCard(review)).join('') : this.emptyState('This user has no reviews yet.');
      } catch (error) {
        this.showFullPageNotice(error.message, 'browse.html');
      }
    },

    async initFavourites() {
      const restaurantContainer = document.getElementById('favouriteRestaurants');
      if (!this.getCurrentUser()) {
        this.showFullPageNotice('Please log in to view your favourites.', 'login.html');
        return;
      }
      try {
        await this.loadFavourites(true);
        const favouriteRestaurants = this.state.favourites.restaurants;
        restaurantContainer.innerHTML = favouriteRestaurants.length ? favouriteRestaurants.map(restaurant => `<div class="favorite-card p-3 mb-3"><h3 class="h5 fw-bold mb-1">${escapeHtml(restaurant.name)}</h3><p class="text-secondary mb-2">${escapeHtml(restaurant.suburb)} • ${escapeHtml(restaurant.cuisine)}</p><a class="btn btn-sm btn-primary" href="restaurant.html?id=${encodeRouteValue(restaurant.id)}">View</a></div>`).join('') : this.emptyState('No saved places yet.');
      } catch (error) {
        restaurantContainer.innerHTML = this.emptyState(error.message);
      }
    },

    initAbout() {
      const form = document.getElementById('missingPlaceForm');
      if (!form) return;

      form.addEventListener('submit', async event => {
        event.preventDefault();
        const payload = Object.fromEntries(new FormData(form).entries());
        const placeName = String(payload.placeName || '').trim();
        const details = String(payload.details || '').trim();

        if (!placeName) {
          this.showMessage('missingPlaceMessage', 'Enter the place name before sending the request.', 'error');
          form.elements.placeName.focus();
          return;
        }

        try {
          await this.api('/api/missing-place-requests', {
            method: 'POST',
            body: { placeName, details }
          });
          form.reset();
          this.showMessage('missingPlaceMessage', 'Request sent for the BiteScout team to review.', 'success');
        } catch (error) {
          this.showMessage('missingPlaceMessage', error.message, 'error');
        }
      });
    },

    async initPlaceRequests() {
      const list = document.getElementById('placeRequestsList');
      if (!list) return;

      try {
        const requests = await this.api('/api/missing-place-requests');
        list.innerHTML = requests.length ? requests.map(item => `
          <div class="favorite-card p-3 mb-3">
            <div class="d-flex justify-content-between gap-3 flex-wrap">
              <h2 class="h5 fw-bold mb-1">${escapeHtml(item.placeName)}</h2>
              <span class="review-meta">${escapeHtml(this.formatDate(item.createdAt))}</span>
            </div>
            <p class="text-secondary mb-0">${escapeHtml(item.details || 'No extra details provided.')}</p>
          </div>
        `).join('') : this.emptyState('No missing place requests yet.');
        this.showMessage('placeRequestsStatus', `${requests.length} request${requests.length === 1 ? '' : 's'} ready for developer review.`, 'info');
      } catch (error) {
        list.innerHTML = this.emptyState(error.message);
      }
    },

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

    requestLocation(messageTarget, onSuccess, onError = null) {
      const locationEnv = {
        hostname: root.location?.hostname || '',
        isSecureContext: root.isSecureContext
      };

      if (!isGeolocationOriginAllowed(locationEnv)) {
        const message = buildLocationErrorMessage({ code: 1 }, locationEnv);
        this.showMessage(
          messageTarget,
          message,
          'error'
        );
        if (onError) onError(message);
        return;
      }

      if (!root.navigator?.geolocation) {
        const message = 'Geolocation is not supported in this browser.';
        this.showMessage(messageTarget, message, 'error');
        if (onError) onError(message);
        return;
      }

      root.navigator.geolocation.getCurrentPosition(
        position => {
          onSuccess({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        error => {
          const message = buildLocationErrorMessage(error, locationEnv);
          this.showMessage(messageTarget, message, 'error');
          if (onError) onError(message);
        },
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
      if (targetId) this.showMessage(targetId, 'BiteScout now saves places only.', 'error');
    },

    bindSaveButtons() {
      document.querySelectorAll('.save-restaurant-trigger').forEach(button => {
        button.onclick = async () => {
          await this.saveRestaurant(button.dataset.id);
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
    },
    
    initChatbot() {
      const widgetBtn = document.getElementById('chatWidgetBtn');
      const windowEl = document.getElementById('chatWindow');
      const closeBtn = document.getElementById('chatCloseBtn');
      const inputEl = document.getElementById('chatInput');
      const sendBtn = document.getElementById('chatSendBtn');
      const bodyEl = document.getElementById('chatBody');
      const typingEl = document.getElementById('chatTyping');

      if (!widgetBtn || !windowEl) return;

      const positionChatWidget = () => {
        const viewport = window.visualViewport;
        const gutter = 18;

        if (!viewport) {
          document.documentElement.style.setProperty('--chat-right', `${gutter}px`);
          document.documentElement.style.setProperty('--chat-bottom', `${gutter}px`);
          return;
        }

        const layoutWidth = document.documentElement.clientWidth || window.innerWidth;
        const layoutHeight = document.documentElement.clientHeight || window.innerHeight;
        const right = Math.max(gutter, layoutWidth - viewport.offsetLeft - viewport.width + gutter);
        const bottom = Math.max(gutter, layoutHeight - viewport.offsetTop - viewport.height + gutter);

        document.documentElement.style.setProperty('--chat-right', `${right}px`);
        document.documentElement.style.setProperty('--chat-bottom', `${bottom}px`);
      };

      positionChatWidget();
      window.addEventListener('resize', positionChatWidget, { passive: true });
      window.addEventListener('scroll', positionChatWidget, { passive: true });
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', positionChatWidget, { passive: true });
        window.visualViewport.addEventListener('scroll', positionChatWidget, { passive: true });
      }
      
      try {
        const savedHistory = sessionStorage.getItem('bitescout_chat_history');
        if (savedHistory) {
          this.state.chatHistory = JSON.parse(savedHistory);
        }
      } catch (e) {}

      const toggleChat = () => {
        positionChatWidget();
        windowEl.classList.toggle('open');
        sessionStorage.setItem('bitescout_chat_open', windowEl.classList.contains('open') ? '1' : '0');
        if (windowEl.classList.contains('open')) inputEl.focus();
      };

      widgetBtn.addEventListener('click', toggleChat);
      closeBtn.addEventListener('click', toggleChat);

      const appendMessage = (text, sender) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${sender}`;
        msgDiv.innerHTML = text; // Allow HTML from AI response (like links)
        bodyEl.insertBefore(msgDiv, typingEl);
        bodyEl.scrollTop = bodyEl.scrollHeight;
      };

      if (this.state.chatHistory && this.state.chatHistory.length > 0) {
        this.state.chatHistory.forEach(msg => {
          if (msg.role === 'user') {
            appendMessage(`<p>${escapeHtml(msg.content)}</p>`, 'user');
          } else {
            let formattedText = msg.content
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\n/g, '<br/>');
            appendMessage(formattedText, 'ai');
          }
        });
      }

      if (sessionStorage.getItem('bitescout_chat_open') === '1') {
        windowEl.classList.add('open');
        bodyEl.scrollTop = bodyEl.scrollHeight;
      }

      const sendMessage = async () => {
        const text = inputEl.value.trim();
        if (!text) return;
        
        inputEl.value = '';
        appendMessage(`<p>${escapeHtml(text)}</p>`, 'user');
        
        typingEl.classList.add('visible');
        bodyEl.scrollTop = bodyEl.scrollHeight;
        
        try {
          // Include user's location if available for Google Places context
          const storedLoc = this.getUserLocation ? this.getUserLocation() : null;
          const chatPayload = {
            message: text,
            history: this.state.chatHistory
          };
          if (storedLoc) {
            chatPayload.location = { lat: storedLoc.lat, lng: storedLoc.lng };
          }
          
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': await this.ensureCsrfToken() },
            body: JSON.stringify(chatPayload)
          });
          
          const data = await response.json();
          typingEl.classList.remove('visible');
          
          if (!response.ok) {
            appendMessage(`<p class="text-danger">Sorry, I encountered an error: ${escapeHtml(data.error || 'Unknown error')}</p>`, 'ai');
          } else {
            // Convert markdown style links if any, though system prompt asks for HTML
            // Add to chat history
            this.state.chatHistory.push({ role: 'user', content: text });
            this.state.chatHistory.push({ role: 'model', content: data.response });
            sessionStorage.setItem('bitescout_chat_history', JSON.stringify(this.state.chatHistory));
            
            // Render basic markdown like **bold** to <strong> and newlines to <br>
            let formattedText = data.response
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\n/g, '<br/>');
            
            appendMessage(formattedText, 'ai');
          }
        } catch (err) {
          typingEl.classList.remove('visible');
          appendMessage(`<p class="text-danger">Sorry, I couldn't reach the server.</p>`, 'ai');
        }
      };

      sendBtn.addEventListener('click', sendMessage);
      inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
      });
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
      App.init().then(() => {
        observeLuxuryElements();
      }).catch(error => {
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

      // Scroll reveal for the presentation layer
      const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      };

      const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, observerOptions);

      const revealSelectors = [
        '.section-top-rated',
        '.section-how',
        '.section-testimonials',
        '.section-cta',
        '.stats-bar',
        '.glass-card',
        '.restaurant-card',
        '.dish-card',
        '.review-card',
        '.favorite-card',
        '.how-card',
        '.testimonial-card',
        '.mini-feature',
        '.auth-card',
        '.profile-bar'
      ].join(',');

      function observeLuxuryElements() {
        document.querySelectorAll(revealSelectors).forEach((element, index) => {
          if (element.dataset.luxuryReveal === 'true') return;

          element.dataset.luxuryReveal = 'true';
          element.classList.add('luxury-reveal');
          element.style.setProperty('--reveal-delay', `${Math.min(index % 8, 7) * 45}ms`);
          revealObserver.observe(element);
        });
      }

      window.setTimeout(observeLuxuryElements, 450);

      const pointerTarget = document.documentElement;
      let pointerTicking = false;
      let latestPointer = { x: 50, y: 18 };

      window.addEventListener('pointermove', (event) => {
        latestPointer = {
          x: Math.round((event.clientX / window.innerWidth) * 100),
          y: Math.round((event.clientY / window.innerHeight) * 100)
        };

        if (!pointerTicking) {
          requestAnimationFrame(() => {
            pointerTarget.style.setProperty('--pointer-x', `${latestPointer.x}%`);
            pointerTarget.style.setProperty('--pointer-y', `${latestPointer.y}%`);
            pointerTicking = false;
          });
          pointerTicking = true;
        }
      }, { passive: true });

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
