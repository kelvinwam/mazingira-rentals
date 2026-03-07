const express = require('express');
const router = express.Router();
const { register, registerValidation, login, loginValidation, getProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/profile', authenticate, getProfile);

module.exports = router;
