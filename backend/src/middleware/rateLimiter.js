const rateLimit = require('express-rate-limit');

// Strict limiter for auth endpoints (login, register) — prevents brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
});

// General API limiter for all other routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' },
});

module.exports = { authLimiter, apiLimiter };
