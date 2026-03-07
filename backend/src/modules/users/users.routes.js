const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const { query }        = require('../../database/connection');
const { authenticate } = require('../../common/middleware/auth.middleware');
const { ok, fail, safeUser } = require('../../utils/helpers');

// GET /users/me
router.get('/me', authenticate, async (req, res) => {
  const r = await query('SELECT * FROM users WHERE id=$1', [req.user.sub]);
  if (!r.rows[0]) return fail(res, 'User not found', 404);
  return ok(res, safeUser(r.rows[0]));
});

// PATCH /users/me
router.patch('/me', authenticate,
  [
    body('full_name').optional().trim().isLength({ min: 2, max: 100 }),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return fail(res, errs.array()[0].msg);

    const fields = [];
    const vals   = [];
    let i = 1;
    if (req.body.full_name !== undefined) { fields.push(`full_name=$${i++}`); vals.push(req.body.full_name); }
    if (req.body.email     !== undefined) { fields.push(`email=$${i++}`);     vals.push(req.body.email); }
    if (!fields.length) return fail(res, 'Nothing to update.');

    fields.push('updated_at=NOW()');
    vals.push(req.user.sub);
    const r = await query(`UPDATE users SET ${fields.join(',')} WHERE id=$${i} RETURNING *`, vals);
    return ok(res, safeUser(r.rows[0]), 'Profile updated.');
  }
);

module.exports = router;
