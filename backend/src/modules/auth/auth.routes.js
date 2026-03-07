const express = require('express');
const router  = express.Router();
const crypto  = require('crypto');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const { query }       = require('../../database/connection');
const { authLimiter } = require('../../common/middleware/rateLimit.middleware');
const { authenticate }= require('../../common/middleware/auth.middleware');
const { ok, fail, normalizePhone, safeUser } = require('../../utils/helpers');

/* ── POST /auth/register ─────────────────────── */
router.post('/register', authLimiter,
  [
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['TENANT','LANDLORD']),
    body('full_name').optional().trim().isLength({ min: 2, max: 100 }),
  ],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return fail(res, errs.array()[0].msg);

    const phone    = normalizePhone(req.body.phone);
    const { password, role, full_name } = req.body;

    if (!/^\+254[17]\d{8}$/.test(phone))
      return fail(res, 'Enter a valid Kenyan number e.g. 0712 345 678');

    const exists = await query('SELECT id FROM users WHERE phone=$1', [phone]);
    if (exists.rows[0]) return fail(res, 'Phone number already registered. Please sign in.', 409);

    const hash = await bcrypt.hash(password, 12);
    const r    = await query(
      `INSERT INTO users (phone, full_name, role, password_hash, is_phone_verified)
       VALUES ($1,$2,$3,$4,true) RETURNING *`,
      [phone, full_name || null, role || 'TENANT', hash]
    );

    const user   = r.rows[0];
    const tokens = issueTokens(user);
    await saveRefresh(user.id, tokens.refreshToken);

    return ok(res, { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: safeUser(user) },
      'Welcome to Mazingira!');
  }
);

/* ── POST /auth/login ────────────────────────── */
router.post('/login', authLimiter,
  [
    body('phone').notEmpty(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return fail(res, errs.array()[0].msg);

    const phone = normalizePhone(req.body.phone);
    const r     = await query('SELECT * FROM users WHERE phone=$1', [phone]);
    const user  = r.rows[0];

    if (!user)             return fail(res, 'No account found with this phone number.', 401);
    if (!user.is_active)   return fail(res, 'Account suspended. Contact support.', 403);
    if (!user.password_hash) return fail(res, 'Account has no password. Please register.', 401);

    const valid = await bcrypt.compare(req.body.password, user.password_hash);
    if (!valid) return fail(res, 'Incorrect password.', 401);

    const tokens = issueTokens(user);
    await saveRefresh(user.id, tokens.refreshToken);

    return ok(res, { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: safeUser(user) },
      'Welcome back!');
  }
);

/* ── POST /auth/refresh ──────────────────────── */
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return fail(res, 'Refresh token required', 401);

  let decoded;
  try { decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET); }
  catch { return fail(res, 'Invalid or expired session. Please log in again.', 401); }

  const hash   = hashToken(refreshToken);
  const stored = await query(
    'SELECT * FROM refresh_tokens WHERE token_hash=$1 AND expires_at>NOW()', [hash]
  );
  if (!stored.rows[0]) return fail(res, 'Session expired. Please log in again.', 401);

  const userRes = await query('SELECT * FROM users WHERE id=$1 AND is_active=true', [decoded.sub]);
  if (!userRes.rows[0]) return fail(res, 'Account not found.', 401);

  await query('DELETE FROM refresh_tokens WHERE token_hash=$1', [hash]);
  const tokens = issueTokens(userRes.rows[0]);
  await saveRefresh(userRes.rows[0].id, tokens.refreshToken);

  return ok(res, { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
});

/* ── POST /auth/logout ───────────────────────── */
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken)
    await query('DELETE FROM refresh_tokens WHERE token_hash=$1', [hashToken(refreshToken)]).catch(() => {});
  return ok(res, {}, 'Logged out.');
});

/* ── POST /auth/change-password ──────────────── */
router.post('/change-password', authenticate,
  [
    body('current_password').notEmpty(),
    body('new_password').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return fail(res, errs.array()[0].msg);

    const r    = await query('SELECT * FROM users WHERE id=$1', [req.user.sub]);
    const user = r.rows[0];

    const valid = await bcrypt.compare(req.body.current_password, user.password_hash);
    if (!valid) return fail(res, 'Current password is incorrect.');

    const newHash = await bcrypt.hash(req.body.new_password, 12);
    await query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [newHash, user.id]);
    return ok(res, {}, 'Password updated.');
  }
);

/* ── Helpers ─────────────────────────────────── */
function issueTokens(user) {
  const p = { sub: user.id, role: user.role };
  return {
    accessToken:  jwt.sign(p, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY || '15m' }),
    refreshToken: jwt.sign({ sub: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '30d' }),
  };
}

async function saveRefresh(userId, refreshToken) {
  const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1,$2,$3)',
    [userId, hashToken(refreshToken), expiry]
  );
}

function hashToken(t) {
  return crypto.createHash('sha256').update(t).digest('hex');
}

module.exports = router;