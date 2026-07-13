/* =========================================================
   Chard Threads — site script
   Handles: smooth scroll, theme toggle, stitch-rail progress,
   image slider, scroll reveals, footer year.
========================================================= */

(() => {
  "use strict";

  /* ---------------- Smooth scroll (Lenis) ---------------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    });

    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }

  // Smooth-scroll for in-page anchor links (#work, #process, etc.)
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: -90 });
      } else {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  /* ---------------- Theme toggle ---------------- */
  const body = document.body;
  const themeToggle = document.getElementById("themeToggle");
  const THEME_KEY = "chard-threads-theme";

  const applyTheme = (theme) => {
    const isDark = theme === "dark";
    body.classList.toggle("theme-dark", isDark);
    body.classList.toggle("theme-light", !isDark);
    if (themeToggle) themeToggle.setAttribute("aria-pressed", String(isDark));
  };

  // Respect a stored preference; otherwise fall back to system preference.
  let storedTheme = null;
  try {
    storedTheme = localStorage.getItem(THEME_KEY);
  } catch (err) {
    storedTheme = null;
  }
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(storedTheme || (prefersDark ? "dark" : "light"));

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const next = body.classList.contains("theme-dark") ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (err) {
        /* storage unavailable — theme just won't persist */
      }
    });
  }

  /* ---------------- Stitch rail scroll progress ---------------- */
  const stitchPath = document.getElementById("stitchPath");
  if (stitchPath) {
    const totalLength = stitchPath.getTotalLength ? stitchPath.getTotalLength() : 4000;

    const updateStitch = () => {
      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const maxScroll = (doc.scrollHeight - doc.clientHeight) || 1;
      const progress = Math.min(Math.max(scrollTop / maxScroll, 0), 1);
      const offset = totalLength * (1 - progress);
      stitchPath.style.strokeDashoffset = String(offset);
    };

    stitchPath.style.strokeDasharray = String(totalLength);
    stitchPath.style.strokeDashoffset = String(totalLength);
    updateStitch();

    window.addEventListener("scroll", updateStitch, { passive: true });
    window.addEventListener("resize", updateStitch);
    if (lenis) lenis.on("scroll", updateStitch);
  }

  /* ---------------- Scroll reveals ---------------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length) {
    if ("IntersectionObserver" in window) {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
      );
      revealEls.forEach((el) => revealObserver.observe(el));
    } else {
      // Fallback: reveal everything immediately
      revealEls.forEach((el) => el.classList.add("in-view"));
    }
  }

  /* ---------------- Image slider ---------------- */
  const sliderTrack = document.getElementById("sliderTrack");
  if (sliderTrack) {
    const slides = Array.from(sliderTrack.querySelectorAll(".slide"));
    const dots = Array.from(document.querySelectorAll("#slideDots .dot"));
    const prevBtn = document.getElementById("prevSlide");
    const nextBtn = document.getElementById("nextSlide");
    const AUTOPLAY_MS = 5500;

    let current = Math.max(slides.findIndex((s) => s.classList.contains("is-active")), 0);
    let autoplayTimer = null;

    const goTo = (index) => {
      const next = (index + slides.length) % slides.length;
      if (next === current) return;

      slides[current].classList.remove("is-active");
      dots[current] && dots[current].classList.remove("is-active");

      current = next;

      slides[current].classList.add("is-active");
      dots[current] && dots[current].classList.add("is-active");
    };

    const next = () => goTo(current + 1);
    const prev = () => goTo(current - 1);

    const startAutoplay = () => {
      stopAutoplay();
      autoplayTimer = window.setInterval(next, AUTOPLAY_MS);
    };
    const stopAutoplay = () => {
      if (autoplayTimer) {
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    };

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        next();
        startAutoplay();
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        prev();
        startAutoplay();
      });
    }
    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        goTo(i);
        startAutoplay();
      });
    });

    const sliderSection = document.getElementById("slider");
    if (sliderSection) {
      sliderSection.addEventListener("mouseenter", stopAutoplay);
      sliderSection.addEventListener("mouseleave", startAutoplay);
      sliderSection.addEventListener("focusin", stopAutoplay);
      sliderSection.addEventListener("focusout", startAutoplay);
    }

    // Basic keyboard support when the slider region has focus
    document.addEventListener("keydown", (e) => {
      if (!sliderSection) return;
      const rect = sliderSection.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;
      if (e.key === "ArrowRight") {
        next();
        startAutoplay();
      } else if (e.key === "ArrowLeft") {
        prev();
        startAutoplay();
      }
    });

    startAutoplay();
  }

  /* ---------------- Footer year ---------------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();