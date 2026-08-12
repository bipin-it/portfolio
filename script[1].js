// ==========================================================
// Bipin Khanal — Portfolio front-end behavior
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
  setYear();
  setupMobileNav();
  typeHeroLine();
  setupContactForm();
});

/* ---------- Footer year ---------- */
function setYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* ---------- Mobile nav toggle ---------- */
function setupMobileNav() {
  const toggle = document.getElementById("navToggle");
  const menu = document.getElementById("navLinksMobile");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* ---------- Hero terminal-style line ---------- */
function typeHeroLine() {
  const target = document.getElementById("typedText");
  if (!target) return;

  const line = "> currently building small, functional web projects";

  // Respect reduced-motion preference: show the full line immediately.
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    target.textContent = line;
    return;
  }

  let i = 0;
  const speed = 28;

  function step() {
    if (i <= line.length) {
      target.textContent = line.slice(0, i);
      i += 1;
      setTimeout(step, speed);
    }
  }
  step();
}

/* ---------- Contact form validation + submission ---------- */
function setupContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  const statusEl = document.getElementById("formStatus");
  const submitBtn = document.getElementById("submitBtn");

  const fields = {
    name: { input: document.getElementById("name"), error: document.getElementById("nameError") },
    email: { input: document.getElementById("email"), error: document.getElementById("emailError") },
    message: { input: document.getElementById("message"), error: document.getElementById("messageError") },
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    setStatus("", null);

    if (!validateForm()) return;

    // Honeypot check: if this hidden field has a value, silently treat as spam.
    const honeypot = form.querySelector("#company");
    if (honeypot && honeypot.value.trim() !== "") {
      setStatus("Message sent. Thank you!", "success");
      form.reset();
      return;
    }

    const payload = {
      name: fields.name.input.value.trim(),
      email: fields.email.input.value.trim(),
      message: fields.message.input.value.trim(),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setStatus("Message sent. Thank you — I'll get back to you soon.", "success");
        form.reset();
      } else {
        setStatus(data.error || "Something went wrong. Please try again.", "error");
      }
    } catch (err) {
      // Likely means the backend server (server.js) isn't running.
      setStatus(
        "Couldn't reach the server. If you're running this locally, make sure the backend (server.js) is started.",
        "error"
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Message";
    }
  });

  function validateForm() {
    let valid = true;

    if (fields.name.input.value.trim().length < 2) {
      showError(fields.name, "Please enter your name.");
      valid = false;
    }

    const emailValue = fields.email.input.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailValue)) {
      showError(fields.email, "Please enter a valid email address.");
      valid = false;
    }

    if (fields.message.input.value.trim().length < 10) {
      showError(fields.message, "Message should be at least 10 characters.");
      valid = false;
    }

    return valid;
  }

  function showError(field, message) {
    field.error.textContent = message;
    field.input.setAttribute("aria-invalid", "true");
  }

  function clearErrors() {
    Object.values(fields).forEach(({ input, error }) => {
      error.textContent = "";
      input.removeAttribute("aria-invalid");
    });
  }

  function setStatus(message, type) {
    statusEl.textContent = message;
    statusEl.classList.remove("success", "error");
    if (type) statusEl.classList.add(type);
  }
}
