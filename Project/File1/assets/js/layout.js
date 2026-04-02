(function () {
  "use strict";

  var navContainer = document.getElementById("layout-nav");
  var footerContainer = document.getElementById("layout-footer");
  var page = (document.body && document.body.dataset && document.body.dataset.page) || "";

  if (!navContainer && !footerContainer) {
    return;
  }

  function isPage(expected) {
    return page === expected;
  }

  function buildNavbar() {
    var homeActive = isPage("home") ? " active" : "";
    var browseActive = isPage("browse") ? " active" : "";
    var restaurantActive = isPage("restaurant") ? " active" : "";
    var profileActive = isPage("profile") ? " active" : "";
    var loginActive = isPage("login") ? " active" : "";

    return (
      '<nav class="site-nav">' +
      '  <div class="site-nav-inner">' +
      '    <a class="navbar-brand" href="index.html">' +
      '      <span class="brand-mark">F</span>' +
      '      <span>Fork &amp; Frame</span>' +
      "    </a>" +
      '    <button class="site-nav-toggle" type="button" aria-controls="site-menu" aria-expanded="false" aria-label="Toggle navigation">' +
      '      <span class="site-nav-toggle-bar"></span>' +
      '      <span class="site-nav-toggle-bar"></span>' +
      '      <span class="site-nav-toggle-bar"></span>' +
      "    </button>" +
      '    <div class="site-menu" id="site-menu">' +
      '      <ul class="site-nav-list">' +
      '        <li><a class="nav-link' +
      homeActive +
      '" href="index.html">Home</a></li>' +
      '        <li><a class="nav-link' +
      browseActive +
      '" href="browse.html">Browse</a></li>' +
      '        <li><a class="nav-link' +
      restaurantActive +
      '" href="restaurant.html?id=ember-lane">Restaurant</a></li>' +
      '        <li><a class="nav-link' +
      profileActive +
      '" href="profile.html">Profile</a></li>' +
      "      </ul>" +
      '      <div class="site-nav-actions">' +
      '        <a class="nav-link nav-pill' +
      loginActive +
      '" href="login.html">Log in</a>' +
      '        <a class="btn-brand" href="signup.html">Create account</a>' +
      "      </div>" +
      "    </div>" +
      "  </div>" +
      "</nav>"
    );
  }

  function buildFooter() {
    switch (page) {
      case "home":
        return (
          '<footer class="site-footer">' +
          '  <p class="mb-1">Fork &amp; Frame prototype for a restaurant discovery and review website.</p>' +
          '  <p class="mb-0">Built as a local multi-page HTML, CSS, Bootstrap, and JavaScript demo.</p>' +
          "</footer>"
        );
      case "login":
        return (
          '<footer class="site-footer">' +
          '  <p class="mb-0">Login page prototype showing the account entry point for the MVP flow.</p>' +
          "</footer>"
        );
      case "signup":
        return (
          '<footer class="site-footer">' +
          '  <p class="mb-0">Sign-up page prototype showing how a new user would enter the product flow.</p>' +
          "</footer>"
        );
      case "browse":
        return (
          '<footer class="site-footer">' +
          '  <p class="mb-0">Browse page prototype showing search, filters, favorites, and links into venue detail pages.</p>' +
          "</footer>"
        );
      case "restaurant":
        return (
          '<footer class="site-footer">' +
          '  <p class="mb-0">Restaurant detail page prototype with query-driven content and saved review integration.</p>' +
          "</footer>"
        );
      case "profile":
        return (
          '<footer class="site-footer">' +
          '  <p class="mb-0">Profile page prototype showing persisted favorites and saved reviews between sessions.</p>' +
          "</footer>"
        );
      case "review":
        return (
          '<footer class="site-footer">' +
          '  <p class="mb-0">Review page prototype with star selection, live character counting, and local persistence.</p>' +
          "</footer>"
        );
      default:
        return "";
    }
  }

  if (navContainer) {
    navContainer.innerHTML = buildNavbar();
  }

  if (footerContainer) {
    footerContainer.innerHTML = buildFooter();
  }

  var toggle = document.querySelector(".site-nav-toggle");
  var menu = document.getElementById("site-menu");

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    menu.addEventListener("click", function (event) {
      if (!event.target.closest("a")) {
        return;
      }

      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  }
})();
