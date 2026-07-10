(function () {
  var STORAGE_KEY = "theme-preference";

  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
  }

  function current() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var toggle = document.querySelector(".theme-toggle");
    if (!toggle) return;

    toggle.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      apply(next);
      localStorage.setItem(STORAGE_KEY, next);
      window.dispatchEvent(new Event("theme-change"));
    });

    if (window.matchMedia && !localStorage.getItem(STORAGE_KEY)) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
        if (!localStorage.getItem(STORAGE_KEY)) {
          apply(e.matches ? "dark" : "light");
        }
      });
    }
  });
})();
