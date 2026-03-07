const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const { query } = require('../../database/connection');
const { ok, fail } = require('../../utils/helpers');

// POST /reviews/:apartmentId
// Anyone can leave a review — no login required
router.post('/:apartmentId',
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().trim().isLength({ max: 1000 }),
    body('reviewer_name').optional().trim().isLength({ max: 100 }),
  ],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return fail(res, errs.array()[0].msg);

    // Check listing exists
    const apt = await query(
      `SELECT id FROM apartments WHERE id=$1 AND status='ACTIVE'`,
      [req.params.apartmentId]
    );
    if (!apt.rows[0]) return fail(res, 'Listing not found', 404);

    const r = await query(
      `INSERT INTO reviews (apartment_id, reviewer_name, rating, comment)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        req.params.apartmentId,
        req.body.reviewer_name?.trim() || 'Anonymous',
        req.body.rating,
        req.body.comment?.trim() || null,
      ]
    );

    return ok(res, r.rows[0], 'Review submitted. Thank you!', 201);
  }
);

// GET /reviews/:apartmentId
router.get('/:apartmentId', async (req, res) => {
  const r = await query(
    `SELECT id, reviewer_name, rating, comment, created_at
     FROM reviews
     WHERE apartment_id=$1 AND is_visible=true
     ORDER BY created_at DESC`,
    [req.params.apartmentId]
  );
  return ok(res, r.rows);
});

module.exports = router;
