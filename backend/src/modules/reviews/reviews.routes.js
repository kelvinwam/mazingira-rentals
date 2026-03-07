const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const { query }        = require('../../database/connection');
const { optionalAuth } = require('../../common/middleware/auth.middleware');
const { ok, fail, paginated, parsePagination } = require('../../utils/helpers');

/* ── GET /reviews/:apartmentId  (public) ──────── */
router.get('/:apartmentId', async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);

  const total = await query(
    'SELECT COUNT(*) FROM reviews WHERE apartment_id=$1 AND is_visible=true',
    [req.params.apartmentId]
  );

  const r = await query(
    `SELECT rv.id, rv.rating, rv.body, rv.created_at,
            u.full_name AS reviewer_name
     FROM reviews rv
     LEFT JOIN users u ON u.id = rv.user_id
     WHERE rv.apartment_id=$1 AND rv.is_visible=true
     ORDER BY rv.created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.params.apartmentId, limit, offset]
  );

  return paginated(res, r.rows, parseInt(total.rows[0].count), page, limit);
});

/* ── POST /reviews/:apartmentId  (public — no login required) ── */
router.post('/:apartmentId',
  optionalAuth,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('body').optional().isLength({ min: 5, max: 1000 }).withMessage('Comment must be between 5 and 1000 characters'),
  ],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return fail(res, errs.array()[0].msg);

    const { rating, body: comment } = req.body;
    const apartmentId = req.params.apartmentId;
    const userId      = req.user?.sub || null;

    // Verify apartment exists and is active
    const apt = await query(
      "SELECT id FROM apartments WHERE id=$1 AND status='ACTIVE'",
      [apartmentId]
    );
    if (!apt.rows[0]) return fail(res, 'Apartment not found.', 404);

    // Prevent duplicate reviews from the same logged-in user
    if (userId) {
      const dup = await query(
        'SELECT id FROM reviews WHERE apartment_id=$1 AND user_id=$2',
        [apartmentId, userId]
      );
      if (dup.rows[0]) return fail(res, 'You have already reviewed this apartment.', 409);
    }

    const r = await query(
      `INSERT INTO reviews (apartment_id, user_id, rating, body, is_visible)
       VALUES ($1,$2,$3,$4,true) RETURNING id, rating, body, created_at`,
      [apartmentId, userId, rating, comment || null]
    );

    // Update apartment avg rating
    await query(
      `UPDATE apartments SET
         avg_rating   = (SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE apartment_id=$1 AND is_visible=true),
         review_count = (SELECT COUNT(*) FROM reviews WHERE apartment_id=$1 AND is_visible=true)
       WHERE id=$1`,
      [apartmentId]
    );

    return ok(res, r.rows[0], 'Thank you for your review!', 201);
  }
);

/* ── DELETE /reviews/:id  (admin only) ────────── */
const { authenticate, requireRole } = require('../../common/middleware/auth.middleware');

router.delete('/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
  const r = await query('SELECT id FROM reviews WHERE id=$1', [req.params.id]);
  if (!r.rows[0]) return fail(res, 'Review not found.', 404);

  await query('DELETE FROM reviews WHERE id=$1', [req.params.id]);

  // Recalculate rating
  const apt = await query('SELECT apartment_id FROM reviews WHERE id=$1', [req.params.id]).catch(() => ({ rows: [] }));
  if (apt.rows[0]) {
    await query(
      `UPDATE apartments SET
         avg_rating   = (SELECT ROUND(AVG(rating)::numeric,1) FROM reviews WHERE apartment_id=$1 AND is_visible=true),
         review_count = (SELECT COUNT(*) FROM reviews WHERE apartment_id=$1 AND is_visible=true)
       WHERE id=$1`,
      [apt.rows[0].apartment_id]
    );
  }

  return ok(res, {}, 'Review deleted.');
});

module.exports = router;