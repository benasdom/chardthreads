(function () {
  "use strict";

  /* ---------------------------------------------------------
     Theme: defaults to light, persists choice in localStorage
  --------------------------------------------------------- */
  var root = document.documentElement;
  var themeBtn = document.getElementById("theme-toggle");
  var stored = null;
  try { stored = localStorage.getItem("chard-theme"); } catch (e) {}

  function applyTheme(theme) {
    if (theme === "dark") {
      root.classList.add("dark");
      themeBtn.setAttribute("aria-pressed", "true");
      themeBtn.setAttribute("aria-label", "Switch to light mode");
    } else {
      root.classList.remove("dark");
      themeBtn.setAttribute("aria-pressed", "false");
      themeBtn.setAttribute("aria-label", "Switch to dark mode");
    }
  }

  applyTheme(stored === "dark" ? "dark" : "light");

  themeBtn.addEventListener("click", function () {
    var next = root.classList.contains("dark") ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem("chard-theme", next); } catch (e) {}
  });

  /* ---------------------------------------------------------
     Mobile nav
  --------------------------------------------------------- */
  var menuBtn = document.getElementById("menu-toggle");
  var mobileNav = document.getElementById("mobile-nav");

  function closeMenu() {
    menuBtn.classList.remove("is-open");
    mobileNav.classList.remove("is-open");
    menuBtn.setAttribute("aria-expanded", "false");
  }

  menuBtn.addEventListener("click", function () {
    var open = mobileNav.classList.toggle("is-open");
    menuBtn.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  mobileNav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", closeMenu);
  });

  /* ---------------------------------------------------------
     Lenis smooth scroll
  --------------------------------------------------------- */
  var lenis = null;
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (window.Lenis && !prefersReduced) {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: function (t) { return 1 - Math.pow(1 - t, 3); },
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // Route in-page anchor links through Lenis (or native fallback)
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) {
        lenis.scrollTo(target, { offset: -20 });
      } else {
        target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
      }
    });
  });

  /* ---------------------------------------------------------
     Scroll reveal (fade + rise), staggered within a section
  --------------------------------------------------------- */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));

  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var groups = new Map();
    revealEls.forEach(function (el) {
      var parent = el.closest("section") || document.body;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var siblings = groups.get(el.closest("section") || document.body) || [el];
          var index = siblings.indexOf(el);
          var delay = Math.min(index, 6) * 90;
          el.style.transitionDelay = delay + "ms";
          el.classList.add("is-visible");
          io.unobserve(el);
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
    );

    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     Ambient blobs: gentle parallax tied to scroll position
  --------------------------------------------------------- */
  if (!prefersReduced) {
    var ambients = Array.prototype.slice.call(document.querySelectorAll(".ambient"));
    var ticking = false;

    function updateParallax() {
      var y = window.scrollY || window.pageYOffset;
      ambients.forEach(function (el, i) {
        var speed = (i % 2 === 0) ? 0.04 : -0.03;
        el.style.transform = "translate3d(0," + (y * speed) + "px,0)";
      });
      ticking = false;
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     Header: subtle shrink on scroll
  --------------------------------------------------------- */
  var header = document.getElementById("site-header");
  var lastY = window.scrollY;
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    header.style.boxShadow = y > 4 ? "0 1px 0 var(--line)" : "none";
    lastY = y;
  }, { passive: true });
})();