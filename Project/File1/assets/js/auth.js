(function () {
  "use strict";

  const STORAGE_KEY = "fork-frame-profile";
  const DEFAULT_PROFILE = {
    name: "Avery Tan",
    email: "avery@example.com",
    city: "Perth",
    tagline: "Chasing warm bowls, sharp cocktails, and places worth recommending."
  };

  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("demoAuthForm");
    if (!form) {
      return;
    }

    const status = document.getElementById("authStatus");
    const page = document.body.dataset.page;

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (page === "signup") {
        const profile = {
          name: document.getElementById("signupName").value || DEFAULT_PROFILE.name,
          email: document.getElementById("signupEmail").value || DEFAULT_PROFILE.email,
          city: document.getElementById("signupCity").value || DEFAULT_PROFILE.city,
          tagline: DEFAULT_PROFILE.tagline
        };

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        status.textContent =
          "Account details saved locally. Open the profile page to see the demo user state.";
      } else {
        status.textContent =
          "Signed in for the demo. This prototype keeps account behavior on the front end only.";
      }

      status.classList.remove("is-hidden");
      status.style.background =
        "color-mix(in oklab, var(--accent-soft) 70%, white)";
    });
  });
})();
