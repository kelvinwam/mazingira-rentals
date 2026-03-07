const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');

const SALT_ROUNDS = 10;

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['tenant', 'landlord'])
    .withMessage('Role must be tenant or landlord'),
];

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, phone, role = 'tenant' } = req.body;

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, role, created_at',
      [name, email, hashed, phone || null, role]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT id, name, email, password, phone, role FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _pw, ...safeUser } = user;
    return res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(result.rows[0]);
  } catch (err) {
    console.error('Profile error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { register, registerValidation, login, loginValidation, getProfile };
