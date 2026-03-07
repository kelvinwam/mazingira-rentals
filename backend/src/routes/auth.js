const express = require('express');
const router = express.Router();
const { register, registerValidation, login, loginValidation, getProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.get('/profile', authLimiter, authenticate, getProfile);

module.exports = router;
