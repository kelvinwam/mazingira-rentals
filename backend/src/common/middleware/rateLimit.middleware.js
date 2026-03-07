const rateLimit = require('express-rate-limit');

const msg = (text) => ({ success: false, message: text });

const defaultLimiter = rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            100,
  standardHeaders: true,
  legacyHeaders:  false,
  message: msg('Too many requests. Please slow down.'),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  standardHeaders: true,
  message: msg('Too many auth attempts. Try again in 15 minutes.'),
});

const otpLimiter = rateLimit({
  windowMs:       10 * 60 * 1000,
  max:            3,
  keyGenerator:   (req) => req.body?.phone || req.ip,
  standardHeaders: true,
  message: msg('Too many OTP requests. Wait 10 minutes before trying again.'),
});

module.exports = { defaultLimiter, authLimiter, otpLimiter };
