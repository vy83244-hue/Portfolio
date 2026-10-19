
(() => {
  "use strict";

  // Mobile navigation
  const menuButton = document.querySelector(".menu-btn");
  const nav = document.querySelector("#navLinks");

  if (menuButton && nav) {
    menuButton.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");

      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation"
      );

      menuButton.textContent = isOpen ? "×" : "☰";
    });

    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation");
        menuButton.textContent = "☰";
      });
    });
  }

  // Automatically update the copyright year
  const year = document.querySelector("#year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // Reveal elements when they enter the viewport
  const revealItems = document.querySelectorAll(
    ".hero-copy, .hero-visual, .section-heading, " +
    ".about-grid > div, .skill-card, .job, " +
    ".project-card, .education-card, .contact-copy, .contact-form"
  );

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (!reduceMotion && "IntersectionObserver" in window) {
    revealItems.forEach(item => item.classList.add("reveal"));

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.10,
      rootMargin: "0px 0px -25px 0px"
    });

    revealItems.forEach(item => observer.observe(item));
  }

  // Contact form: prepare an email without storing form data
  const form = document.querySelector("#contactForm");
  const status = document.querySelector("#formStatus");

  if (form) {
    form.addEventListener("submit", event => {
      event.preventDefault();

      if (!form.reportValidity()) {
        return;
      }

      const data = new FormData(form);

      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const subjectText = String(data.get("subject") || "").trim();
      const message = String(data.get("message") || "").trim();

      const subject = encodeURIComponent(
        "[Portfolio Enquiry] " + subjectText
      );

      const body = encodeURIComponent(
        "Name: " + name + "\n" +
        "Email: " + email + "\n\n" +
        "Message:\n" + message
      );

      if (status) {
        status.textContent =
          "Opening your default email application. " +
          "If it does not open, email vy83244@gmail.com directly.";
      }

      window.location.href =
        "mailto:vy83244@gmail.com?subject=" +
        subject + "&body=" + body;
    });
  }
})();
