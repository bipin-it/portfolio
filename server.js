// ==========================================================
// Bipin Khanal — Portfolio backend
// Serves the static site and handles contact form submissions.
//
// Run locally:
//   npm install
//   npm start
// Then open http://localhost:3000
// ==========================================================

const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// Where submissions are stored. In production you would likely replace this
// with a database (e.g. SQLite, MongoDB) or an email service (see note below).
const SUBMISSIONS_FILE = path.join(__dirname, "data", "submissions.json");

app.use(express.json());
app.use(express.static(path.join(__dirname))); // serves index.html, style.css, script.js, /projects

// Basic rate limiting: cap requests per IP to reduce spam / abuse.
const requestLog = new Map(); // ip -> [timestamps]
const RATE_LIMIT = 5; // max submissions
const RATE_WINDOW_MS = 10 * 60 * 1000; // per 10 minutes

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT;
}

function ensureDataFile() {
  const dir = path.dirname(SUBMISSIONS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(SUBMISSIONS_FILE)) fs.writeFileSync(SUBMISSIONS_FILE, "[]");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.post("/api/contact", (req, res) => {
  const ip = req.ip;
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many submissions. Please try again later." });
  }

  const { name, email, message, company } = req.body || {};

  // "company" is a honeypot field the real form keeps hidden from users.
  // A filled-in value almost always means a bot filled every field.
  if (company && String(company).trim() !== "") {
    return res.status(200).json({ ok: true }); // pretend success, drop silently
  }

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({ error: "Please provide a valid name." });
  }
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }
  if (!message || typeof message !== "string" || message.trim().length < 10) {
    return res.status(400).json({ error: "Message should be at least 10 characters." });
  }

  const submission = {
    name: name.trim(),
    email: email.trim(),
    message: message.trim(),
    receivedAt: new Date().toISOString(),
  };

  try {
    ensureDataFile();
    const existing = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, "utf-8"));
    existing.push(submission);
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(existing, null, 2));

    // --- Optional: send an email notification instead of / in addition to
    // storing to disk. This requires an email-sending package such as
    // Nodemailer and real SMTP or API credentials, so it's left commented
    // out as a possibility to wire up rather than assumed to be configured:
    //
    //   const nodemailer = require("nodemailer");
    //   const transporter = nodemailer.createTransport({ ... });
    //   await transporter.sendMail({
    //     to: "bipin.khanal@example.com",
    //     subject: `Portfolio contact from ${submission.name}`,
    //     text: submission.message,
    //     replyTo: submission.email,
    //   });

    console.log(`New contact form submission from ${submission.email}`);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Failed to save submission:", err);
    return res.status(500).json({ error: "Something went wrong on our end. Please try again." });
  }
});

app.listen(PORT, () => {
  console.log(`Portfolio server running at http://localhost:${PORT}`);
});
