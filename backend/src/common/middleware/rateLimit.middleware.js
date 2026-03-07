const rateLimit = require('express-rate-limit');

const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' },
});

module.exports = { defaultLimiter, authLimiter };
