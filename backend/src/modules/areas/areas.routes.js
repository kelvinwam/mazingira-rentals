const express = require('express');
const router  = express.Router();
const { query } = require('../../database/connection');
const { ok, fail } = require('../../utils/helpers');

/* GET /areas */
router.get('/', async (req, res) => {
  const r = await query(
    `SELECT id, name, slug, county, center_lat, center_lng, listing_count, avg_price_kes
     FROM areas WHERE is_active = true ORDER BY listing_count DESC`
  );
  return ok(res, r.rows);
});

/* GET /areas/:slug */
router.get('/:slug', async (req, res) => {
  const r = await query(
    `SELECT id, name, slug, county, center_lat, center_lng, listing_count, avg_price_kes
     FROM areas WHERE slug = $1 AND is_active = true`,
    [req.params.slug]
  );
  if (!r.rows[0]) return fail(res, 'Area not found.', 404);
  return ok(res, r.rows[0]);
});

module.exports = router;
