
(function () {
  const STORAGE_KEYS = {
    users: 'bitescout_users',
    session: 'bitescout_session',
    reviews: 'bitescout_reviews',
    favRestaurants: 'bitescout_fav_restaurants',
    favDishes: 'bitescout_fav_dishes',
    userLocation: 'bitescout_user_location'
  };

  const data = window.BiteScoutData;

  const App = {
    init() {
      this.seedData();
      this.renderLayout();
      this.routePage();
    },

    seedData() {
      if (!localStorage.getItem(STORAGE_KEYS.users)) {
        const seeded = [
          {
            id: 'u-local-demo',
            name: 'Demo User',
            username: 'demouser',
            email: 'demo@bitescout.app',
            password: 'password123',
            preferredCuisine: 'Japanese',
            bio: 'I love finding hidden gems around Perth.'
          }
        ];
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(seeded));
      }

      if (!localStorage.getItem(STORAGE_KEYS.reviews)) {
        localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.favRestaurants)) {
        localStorage.setItem(STORAGE_KEYS.favRestaurants, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.favDishes)) {
        localStorage.setItem(STORAGE_KEYS.favDishes, JSON.stringify([]));
      }
    },

    routePage() {
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
      if (routes[page]) routes[page]();
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

    getUsers() {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
    },

    saveUsers(users) {
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
    },

    getCurrentUser() {
      const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || 'null');
      if (!session) return null;
      return this.getUsers().find(user => user.id === session.userId) || null;
    },

    setSession(userId) {
      localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ userId }));
    },

    clearSession() {
      localStorage.removeItem(STORAGE_KEYS.session);
    },

    getAllReviews() {
      const localReviews = JSON.parse(localStorage.getItem(STORAGE_KEYS.reviews) || '[]');
      return [...data.sampleReviews, ...localReviews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    getLocalReviews() {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.reviews) || '[]');
    },

    saveLocalReviews(reviews) {
      localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(reviews));
    },

    getRestaurantById(id) {
      return data.restaurants.find(r => r.id === id);
    },

    getDish(restaurantId, dishId) {
      const restaurant = this.getRestaurantById(restaurantId);
      if (!restaurant) return null;
      return restaurant.dishes.find(d => d.id === dishId);
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

    getDisplayUser(userId) {
      return this.getUsers().find(u => u.id === userId) || data.sampleUsers.find(u => u.id === userId) || { id: userId, name: 'Unknown User', username: 'unknown' };
    },

    haversine(lat1, lon1, lat2, lon2) {
      const toRad = value => (value * Math.PI) / 180;
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    },

    attachDistance(restaurants, coords) {
      return restaurants.map(r => ({
        ...r,
        distanceKm: coords ? this.haversine(coords.lat, coords.lng, r.lat, r.lng) : null
      }));
    },

    renderRestaurantCard(restaurant) {
      const distanceHtml = restaurant.distanceKm != null ? `<span class="distance-pill">📍 ${restaurant.distanceKm.toFixed(1)} km</span>` : '';
      return `
        <div class="col-md-6 col-xl-4">
          <div class="restaurant-card p-3">
            <div class="restaurant-image mb-3">${restaurant.name}</div>
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
      const user = this.getDisplayUser(review.userId);
      const restaurant = this.getRestaurantById(review.restaurantId);
      const dish = review.dishId ? this.getDish(review.restaurantId, review.dishId) : null;
      const manageButton = own && !review.id.startsWith('sr') ? `<a class="btn btn-outline-dark btn-sm" href="edit-review.html?id=${review.id}">Edit</a>` : '';
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

    emptyState(message) {
      return `<div class="empty-state">${message}</div>`;
    },

    showMessage(targetId, message, type = 'info') {
      const el = document.getElementById(targetId);
      if (!el) return;
      const map = {
        info: 'text-secondary',
        success: 'text-success',
        error: 'text-danger'
      };
      el.className = map[type] || 'text-secondary';
      el.textContent = message;
    },

    initHome() {
      const target = document.getElementById('homeTrending');
      if (!target) return;
      const cards = [...data.restaurants].sort((a, b) => b.rating - a.rating).slice(0, 3).map(r => this.renderRestaurantCard(r)).join('');
      target.innerHTML = cards;
      this.bindSaveButtons();
    },

    initSignup() {
      const form = document.getElementById('signupForm');
      if (!form) return;
      form.addEventListener('submit', e => {
        e.preventDefault();
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        const users = this.getUsers();
        if (users.some(u => u.email.toLowerCase() === payload.email.toLowerCase())) {
          return this.showMessage('signupMessage', 'That email is already registered.', 'error');
        }
        const newUser = {
          id: `u-${Date.now()}`,
          ...payload,
          bio: `Hi, I'm ${payload.name}. I enjoy finding good food around the city.`
        };
        users.push(newUser);
        this.saveUsers(users);
        this.setSession(newUser.id);
        this.showMessage('signupMessage', 'Account created. Redirecting to your profile...', 'success');
        setTimeout(() => window.location.href = 'profile.html', 900);
      });
    },

    initLogin() {
      const form = document.getElementById('loginForm');
      if (!form) return;
      form.addEventListener('submit', e => {
        e.preventDefault();
        const formData = new FormData(form);
        const email = (formData.get('email') || '').toString().toLowerCase();
        const password = formData.get('password');
        const user = this.getUsers().find(u => u.email.toLowerCase() === email && u.password === password);
        if (!user) return this.showMessage('loginMessage', 'Incorrect email or password.', 'error');
        this.setSession(user.id);
        this.showMessage('loginMessage', 'Logged in successfully. Redirecting...', 'success');
        setTimeout(() => window.location.href = 'profile.html', 900);
      });
    },

    initBrowse() {
      const cuisineSelect = document.getElementById('cuisineFilter');
      const cuisines = [...new Set(data.restaurants.map(r => r.cuisine))];
      cuisineSelect.innerHTML = `<option value="">Any</option>${cuisines.map(c => `<option value="${c}">${c}</option>`).join('')}`;
      const render = () => {
        const search = document.getElementById('searchInput').value.trim().toLowerCase();
        const cuisine = cuisineSelect.value;
        const price = document.getElementById('priceFilter').value;
        const rating = parseFloat(document.getElementById('ratingFilter').value || '0');
        const coords = this.getUserLocation();
        let restaurants = this.attachDistance(data.restaurants, coords);
        restaurants = restaurants.filter(r => {
          const haystack = `${r.name} ${r.suburb} ${r.cuisine} ${r.tags.join(' ')}`.toLowerCase();
          return (!search || haystack.includes(search)) && (!cuisine || r.cuisine === cuisine) && (!price || r.price === price) && (r.rating >= rating);
        });
        if (coords) restaurants.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
        document.getElementById('browseResults').innerHTML = restaurants.length ? restaurants.map(r => this.renderRestaurantCard(r)).join('') : this.emptyState('No restaurants matched those filters.');
        document.getElementById('resultsCount').textContent = `${restaurants.length} place${restaurants.length === 1 ? '' : 's'} found`;
        this.bindSaveButtons();
      };
      ['searchInput', 'cuisineFilter', 'priceFilter', 'ratingFilter'].forEach(id => document.getElementById(id).addEventListener('input', render));
      document.getElementById('useLocationBrowse').addEventListener('click', () => {
        this.requestLocation('browseLocationMessage', coords => {
          this.setUserLocation(coords);
          this.showMessage('browseLocationMessage', `Location saved. Results are now sorted by distance from you.`, 'success');
          render();
        });
      });
      const coords = this.getUserLocation();
      if (coords) this.showMessage('browseLocationMessage', 'Using your saved location to sort results by distance.', 'info');
      render();
    },

    initRestaurantPage() {
      const id = new URLSearchParams(window.location.search).get('id');
      const restaurant = this.getRestaurantById(id);
      if (!restaurant) return;
      const reviews = this.getAllReviews().filter(r => r.restaurantId === restaurant.id);
      const average = reviews.length ? (reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length).toFixed(1) : restaurant.rating.toFixed(1);
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
        <p class="mb-0 text-secondary"><strong>Popular tags:</strong> ${restaurant.tags.join(', ')}</p>
      `;
      document.getElementById('restaurantDishes').innerHTML = restaurant.dishes.map(d => this.renderDishCard(restaurant, d)).join('');
      document.getElementById('restaurantReviews').innerHTML = reviews.length ? reviews.map(r => this.renderReviewCard(r, this.getCurrentUser()?.id === r.userId)).join('') : this.emptyState('No reviews yet. Be the first to share your experience.');
      document.getElementById('restaurantSidebar').innerHTML = `
        <h3 class="h5 fw-bold mb-3">Quick facts</h3>
        <p class="mb-2"><strong>Cuisine:</strong> ${restaurant.cuisine}</p>
        <p class="mb-2"><strong>Price range:</strong> ${restaurant.price}</p>
        <p class="mb-2"><strong>Average rating:</strong> ${average}</p>
        <p class="mb-0"><strong>Dishes listed:</strong> ${restaurant.dishes.length}</p>
      `;
      document.getElementById('saveRestaurantBtn').addEventListener('click', () => {
        this.saveRestaurant(restaurant.id, 'saveRestaurantMessage');
      });
      this.bindSaveButtons();
    },

    initDishPage() {
      const params = new URLSearchParams(window.location.search);
      const restaurantId = params.get('restaurant');
      const dishId = params.get('dish');
      const restaurant = this.getRestaurantById(restaurantId);
      const dish = this.getDish(restaurantId, dishId);
      if (!restaurant || !dish) return;
      const reviews = this.getAllReviews().filter(r => r.restaurantId === restaurantId && r.dishId === dishId);
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
      document.getElementById('dishReviews').innerHTML = reviews.length ? reviews.map(r => this.renderReviewCard(r, this.getCurrentUser()?.id === r.userId)).join('') : this.emptyState('No dish reviews yet.');
      document.getElementById('backToRestaurantLink').href = `restaurant.html?id=${restaurant.id}`;
      document.getElementById('saveDishBtn').addEventListener('click', () => {
        this.saveDish(restaurantId, dishId, 'saveDishMessage');
      });
    },

    initWriteReview() {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        this.showFullPageNotice('Please log in before writing a review.', 'login.html');
        return;
      }
      const restaurantSelect = document.getElementById('reviewRestaurantSelect');
      const dishSelect = document.getElementById('reviewDishSelect');
      restaurantSelect.innerHTML = data.restaurants.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
      const fillDishes = (restaurantId) => {
        const restaurant = this.getRestaurantById(restaurantId);
        dishSelect.innerHTML = `<option value="">Restaurant review only</option>` + restaurant.dishes.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
      };
      restaurantSelect.addEventListener('change', () => fillDishes(restaurantSelect.value));
      const params = new URLSearchParams(window.location.search);
      const presetRestaurant = params.get('restaurantId');
      const presetDish = params.get('dishId');
      if (presetRestaurant) restaurantSelect.value = presetRestaurant;
      fillDishes(restaurantSelect.value);
      if (presetDish) dishSelect.value = presetDish;
      document.getElementById('writeReviewForm').addEventListener('submit', e => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const payload = Object.fromEntries(formData.entries());
        const reviews = this.getLocalReviews();
        reviews.push({
          id: `lr-${Date.now()}`,
          userId: currentUser.id,
          restaurantId: payload.restaurantId,
          dishId: payload.dishId,
          rating: Number(payload.rating),
          title: payload.title,
          content: payload.content,
          createdAt: new Date().toISOString()
        });
        this.saveLocalReviews(reviews);
        this.showMessage('writeReviewMessage', 'Review posted successfully. Redirecting to your profile...', 'success');
        setTimeout(() => window.location.href = 'profile.html', 1000);
      });
    },

    initEditReview() {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        this.showFullPageNotice('Please log in before editing reviews.', 'login.html');
        return;
      }
      const reviewId = new URLSearchParams(window.location.search).get('id');
      const localReviews = this.getLocalReviews();
      const review = localReviews.find(r => r.id === reviewId && r.userId === currentUser.id);
      if (!review) {
        this.showMessage('editReviewMessage', 'Review not found or not editable.', 'error');
        return;
      }
      document.getElementById('editReviewId').value = review.id;
      document.getElementById('editRating').value = review.rating;
      document.getElementById('editTitle').value = review.title;
      document.getElementById('editContent').value = review.content;
      document.getElementById('editReviewForm').addEventListener('submit', e => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const updates = Object.fromEntries(formData.entries());
        const revised = localReviews.map(r => r.id === review.id ? { ...r, rating: Number(updates.rating), title: updates.title, content: updates.content } : r);
        this.saveLocalReviews(revised);
        this.showMessage('editReviewMessage', 'Review updated.', 'success');
      });
      document.getElementById('deleteReviewBtn').addEventListener('click', () => {
        const revised = localReviews.filter(r => r.id !== review.id);
        this.saveLocalReviews(revised);
        this.showMessage('editReviewMessage', 'Review deleted. Redirecting...', 'success');
        setTimeout(() => window.location.href = 'profile.html', 900);
      });
    },

    initProfile() {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        this.showFullPageNotice('Please log in to view your profile.', 'login.html');
        return;
      }
      const myReviews = this.getAllReviews().filter(r => r.userId === currentUser.id);
      const favRestaurants = this.getFavouriteRestaurants();
      const favDishes = this.getFavouriteDishes();
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
        <p class="mb-0"><strong>Favourites:</strong> ${favRestaurants.length + favDishes.length}</p>
      `;
      document.getElementById('myReviews').innerHTML = myReviews.length ? myReviews.map(r => this.renderReviewCard(r, true)).join('') : this.emptyState('You have not written any reviews yet.');
      const favHtml = [
        ...favRestaurants.map(r => `<div class="favorite-card p-3 mb-3"><h3 class="h5 fw-bold mb-1">${r.name}</h3><p class="text-secondary mb-2">${r.suburb} • ${r.cuisine}</p><a href="restaurant.html?id=${r.id}" class="btn btn-sm btn-primary">Open</a></div>`),
        ...favDishes.map(item => `<div class="favorite-card p-3 mb-3"><h3 class="h5 fw-bold mb-1">${item.dish.name}</h3><p class="text-secondary mb-2">${item.restaurant.name}</p><a href="dish.html?restaurant=${item.restaurant.id}&dish=${item.dish.id}" class="btn btn-sm btn-primary">Open</a></div>`)
      ].join('');
      document.getElementById('profileFavourites').innerHTML = favHtml || this.emptyState('Nothing saved yet.');
    },

    initOtherUser() {
      const userId = new URLSearchParams(window.location.search).get('id') || 'u-demo-1';
      const user = this.getDisplayUser(userId);
      const reviews = this.getAllReviews().filter(r => r.userId === user.id);
      document.getElementById('otherUserHeader').innerHTML = `
        <p class="eyebrow mb-2">Community member</p>
        <h1 class="fw-bold mb-3">${user.name}</h1>
        <p class="text-secondary mb-0">@${user.username || 'member'}</p>
      `;
      document.getElementById('otherUserSummary').innerHTML = `
        <h2 class="h4 fw-bold mb-3">Profile summary</h2>
        <p class="text-secondary mb-0">${user.bio || 'This user has not added a bio yet.'}</p>
      `;
      document.getElementById('otherUserReviews').innerHTML = reviews.length ? reviews.map(r => this.renderReviewCard(r)).join('') : this.emptyState('This user has no reviews yet.');
    },

    initRecommendations() {
      const target = document.getElementById('recommendationsGrid');
      const render = (coords = null) => {
        let items = this.attachDistance(data.restaurants, coords);
        if (coords) {
          const currentUser = this.getCurrentUser();
          items = items.sort((a, b) => {
            const distCompare = (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
            if (Math.abs(distCompare) > 0.15) return distCompare;
            const aBonus = currentUser && currentUser.preferredCuisine === a.cuisine ? 0.2 : 0;
            const bBonus = currentUser && currentUser.preferredCuisine === b.cuisine ? 0.2 : 0;
            return (b.rating + bBonus) - (a.rating + aBonus);
          });
        } else {
          items = items.sort((a, b) => b.rating - a.rating);
        }
        target.innerHTML = items.map(r => this.renderRestaurantCard(r)).join('');
        this.bindSaveButtons();
      };
      document.getElementById('detectLocationBtn').addEventListener('click', () => {
        this.requestLocation('recommendationStatus', coords => {
          this.setUserLocation(coords);
          this.showMessage('recommendationStatus', `Location found. Nearby recommendations are now ranked from closest to furthest.`, 'success');
          render(coords);
        });
      });
      document.getElementById('resetRecommendationsBtn').addEventListener('click', () => {
        this.showMessage('recommendationStatus', 'Showing recommendations without distance sorting.', 'info');
        render(null);
      });
      const saved = this.getUserLocation();
      if (saved) {
        this.showMessage('recommendationStatus', 'Using your previously saved location.', 'info');
        render(saved);
      } else {
        render(null);
      }
    },

    initFavourites() {
      const restaurantContainer = document.getElementById('favouriteRestaurants');
      const dishContainer = document.getElementById('favouriteDishes');
      const favRestaurants = this.getFavouriteRestaurants();
      const favDishes = this.getFavouriteDishes();
      restaurantContainer.innerHTML = favRestaurants.length ? favRestaurants.map(r => `<div class="favorite-card p-3 mb-3"><h3 class="h5 fw-bold mb-1">${r.name}</h3><p class="text-secondary mb-2">${r.suburb} • ${r.cuisine}</p><a class="btn btn-sm btn-primary" href="restaurant.html?id=${r.id}">View</a></div>`).join('') : this.emptyState('No saved restaurants yet.');
      dishContainer.innerHTML = favDishes.length ? favDishes.map(item => `<div class="favorite-card p-3 mb-3"><h3 class="h5 fw-bold mb-1">${item.dish.name}</h3><p class="text-secondary mb-2">${item.restaurant.name}</p><a class="btn btn-sm btn-primary" href="dish.html?restaurant=${item.restaurant.id}&dish=${item.dish.id}">View</a></div>`).join('') : this.emptyState('No saved dishes yet.');
    },

    initAbout() {},

    initLogout() {
      this.clearSession();
    },

    requestLocation(messageTarget, onSuccess) {
      if (!navigator.geolocation) {
        return this.showMessage(messageTarget, 'Geolocation is not supported in this browser.', 'error');
      }
      navigator.geolocation.getCurrentPosition(
        position => {
          const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
          onSuccess(coords);
        },
        () => this.showMessage(messageTarget, 'Location access was denied or unavailable. Try localhost or HTTPS.', 'error')
      );
    },

    saveRestaurant(restaurantId, targetId = '') {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.favRestaurants) || '[]');
      if (!stored.includes(restaurantId)) stored.push(restaurantId);
      localStorage.setItem(STORAGE_KEYS.favRestaurants, JSON.stringify(stored));
      if (targetId) this.showMessage(targetId, 'Restaurant saved to favourites.', 'success');
    },

    saveDish(restaurantId, dishId, targetId = '') {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.favDishes) || '[]');
      const token = `${restaurantId}:${dishId}`;
      if (!stored.includes(token)) stored.push(token);
      localStorage.setItem(STORAGE_KEYS.favDishes, JSON.stringify(stored));
      if (targetId) this.showMessage(targetId, 'Dish saved to favourites.', 'success');
    },

    getFavouriteRestaurants() {
      const ids = JSON.parse(localStorage.getItem(STORAGE_KEYS.favRestaurants) || '[]');
      return ids.map(id => this.getRestaurantById(id)).filter(Boolean);
    },

    getFavouriteDishes() {
      const ids = JSON.parse(localStorage.getItem(STORAGE_KEYS.favDishes) || '[]');
      return ids.map(token => {
        const [restaurantId, dishId] = token.split(':');
        const restaurant = this.getRestaurantById(restaurantId);
        const dish = this.getDish(restaurantId, dishId);
        if (!restaurant || !dish) return null;
        return { restaurant, dish };
      }).filter(Boolean);
    },

    bindSaveButtons() {
      document.querySelectorAll('.save-restaurant-trigger').forEach(btn => {
        btn.addEventListener('click', () => this.saveRestaurant(btn.dataset.id));
      });
      document.querySelectorAll('.save-dish-trigger').forEach(btn => {
        btn.addEventListener('click', () => this.saveDish(btn.dataset.restaurant, btn.dataset.id));
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
    }
  };

  window.addEventListener('DOMContentLoaded', () => App.init());
})();
