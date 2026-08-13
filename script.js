// script.js
// Contact form handler for the portfolio site.
// Usage:
// - Sign up at https://formspree.io and create a new form to get a form ID (looks like: abcd1234).
// - Set the FORMSPREE_ID variable below to your form ID to have submissions forwarded to your email.
// - If you don't set a FORMSPREE_ID, the form will fall back to opening a mailto: link addressed to the email
//   already present in index.html (bipin.khanal@example.com).

const FORMSPREE_ID = ""; // <-- Put your Formspree form ID here (e.g. "mrgvdwlp").

const form = document.getElementById("contactForm");
const submitBtn = document.getElementById("submitBtn");
const formStatus = document.getElementById("formStatus");

function setStatus(message, isError = false) {
  formStatus.textContent = message;
  formStatus.style.color = isError ? "#A5372A" : "#3E6B52";
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("");

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const message = document.getElementById("message").value.trim();
  const company = document.getElementById("company").value.trim(); // honeypot

  // basic validation
  if (!name || !email || !message) {
    setStatus("Please complete all required fields.", true);
    return;
  }

  // honeypot: if filled, likely spam
  if (company) {
    setStatus("Submission rejected.", true);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";

  try {
    if (FORMSPREE_ID) {
      // Send to Formspree
      const endpoint = `https://formspree.io/f/${FORMSPREE_ID}`;
      const payload = new FormData();
      payload.append("name", name);
      payload.append("email", email);
      payload.append("message", message);

      const res = await fetch(endpoint, {
        method: "POST",
        body: payload,
        headers: {
          "Accept": "application/json"
        }
      });

      if (res.ok) {
        setStatus("Thanks — your message has been sent.");
        form.reset();
      } else {
        const data = await res.json().catch(() => ({}));
        const errMsg = data?.error || data?.message || "Could not send message.";
        setStatus(`Error: ${errMsg}`, true);
      }
    } else {
      // Fallback: open mail client with prefilled message
      const mailTo = document.querySelector('.contact-list a[href^="mailto:"]');
      const to = mailTo ? mailTo.getAttribute('href').replace('mailto:', '') : 'bipin.khanal@example.com';
      const subject = encodeURIComponent(`Message from ${name} via portfolio`);
      const body = encodeURIComponent(`${message}\n\nFrom: ${name} <${email}>`);
      const mailUrl = `mailto:${to}?subject=${subject}&body=${body}`;
      window.location.href = mailUrl;
      setStatus("Opening your mail app... If nothing happens, add a Formspree ID to enable direct submissions.");
      form.reset();
    }
  } catch (err) {
    console.error(err);
    setStatus("An unexpected error occurred.", true);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Send Message";
  }
});
