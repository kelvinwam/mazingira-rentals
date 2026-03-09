const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const { query } = require('../../database/connection');
const { optionalAuth, authenticate, requireRole } = require('../../common/middleware/auth.middleware');
const { ok, fail, paginated, parsePagination } = require('../../utils/helpers');

/* GET /listings  — public browse */
router.get('/', optionalAuth, async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { area, price_min, price_max, bedrooms, available, q } = req.query;

  const conditions = ["a.status='ACTIVE'"];
  const vals = [];
  let i = 1;

  if (area)      { conditions.push(`ar.slug=$${i++}`);      vals.push(area); }
  if (price_min) { conditions.push(`a.price_kes>=$${i++}`); vals.push(+price_min); }
  if (price_max) { conditions.push(`a.price_kes<=$${i++}`); vals.push(+price_max); }
  if (bedrooms)  { conditions.push(`a.bedrooms=$${i++}`);   vals.push(+bedrooms); }
  if (available === 'true') conditions.push('a.is_available=true');
  if (q) {
    conditions.push(`(a.title ILIKE $${i} OR a.address_hint ILIKE $${i})`);
    vals.push(`%${q}%`); i++;
  }

  const where = 'WHERE ' + conditions.join(' AND ');

  const countRes = await query(
    `SELECT COUNT(*) FROM apartments a JOIN areas ar ON ar.id=a.area_id ${where}`, vals
  );
  const total = parseInt(countRes.rows[0].count);

  vals.push(limit, offset);
  const rows = await query(
    `SELECT a.id, a.title, a.price_kes, a.deposit_kes, a.bedrooms, a.bathrooms,
            a.is_available, a.is_boosted, a.verification_level,
            a.avg_rating, a.review_count, a.address_hint,
            ar.name AS area_name, ar.slug AS area_slug,
            (SELECT url FROM apartment_images WHERE apartment_id=a.id AND is_primary=true LIMIT 1) AS primary_image,
            (SELECT thumbnail_url FROM apartment_images WHERE apartment_id=a.id AND is_primary=true LIMIT 1) AS thumbnail
     FROM apartments a JOIN areas ar ON ar.id=a.area_id
     ${where}
     ORDER BY a.is_boosted DESC, a.created_at DESC
     LIMIT $${i++} OFFSET $${i++}`,
    vals
  );

  return paginated(res, rows.rows, total, page, limit);
});

/* GET /listings/featured — public */
router.get('/featured', async (req, res) => {
  // Boosted listings first (always shown), then random selection from the rest
  const boosted = await query(
    `SELECT a.id, a.title, a.price_kes, a.bedrooms, a.bathrooms,
            a.is_available, a.is_boosted, a.verification_level,
            a.avg_rating, a.review_count, a.address_hint,
            ar.name AS area_name, ar.slug AS area_slug,
            (SELECT url FROM apartment_images WHERE apartment_id=a.id AND is_primary=true LIMIT 1) AS primary_image
     FROM apartments a JOIN areas ar ON ar.id=a.area_id
     WHERE a.status='ACTIVE' AND a.is_boosted=true AND a.is_available=true
     ORDER BY a.boost_ends_at DESC
     LIMIT 6`
  );

  const needed = 6 - boosted.rows.length;
  let others = { rows: [] };
  if (needed > 0) {
    const excludeIds = boosted.rows.map(r => r.id);
    const excludeClause = excludeIds.length > 0
      ? `AND a.id NOT IN (${excludeIds.map((_, i) => `$${i + 1}`).join(',')})`
      : '';
    others = await query(
      `SELECT a.id, a.title, a.price_kes, a.bedrooms, a.bathrooms,
              a.is_available, a.is_boosted, a.verification_level,
              a.avg_rating, a.review_count, a.address_hint,
              ar.name AS area_name, ar.slug AS area_slug,
              (SELECT url FROM apartment_images WHERE apartment_id=a.id AND is_primary=true LIMIT 1) AS primary_image
       FROM apartments a JOIN areas ar ON ar.id=a.area_id
       WHERE a.status='ACTIVE' AND a.is_available=true ${excludeClause}
       ORDER BY RANDOM()
       LIMIT ${needed}`,
      excludeIds
    );
  }

  return ok(res, [...boosted.rows, ...others.rows]);
});

/* GET /listings/:id — public */
router.get('/:id', optionalAuth, async (req, res) => {
  // Unique view — one per IP per 24 hours, wrapped safely so it never blocks the listing
  try {
    const ip      = (req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || 'unknown').trim();
    const viewKey = `${req.params.id}:${ip}`;

    const seen = await query(
      `SELECT 1 FROM engagement_logs
       WHERE apartment_id=$1 AND ip_address=$2 AND event_type='VIEW'
         AND created_at > NOW() - INTERVAL '24 hours'
       LIMIT 1`,
      [req.params.id, viewKey]
    );

    if (!seen.rows[0]) {
      await query('UPDATE apartments SET view_count=view_count+1 WHERE id=$1', [req.params.id]);
      await query(
        `INSERT INTO engagement_logs (apartment_id, ip_address, event_type, user_id, session_id)
         VALUES ($1, $2, 'VIEW', $3, $4)`,
        [req.params.id, viewKey, req.user?.sub || null, null]
      );
    }
  } catch {
    // View tracking failed — don't block the listing from loading
  }

  const r = await query(
    `SELECT a.*, ar.name AS area_name, ar.slug AS area_slug,
            u.full_name AS landlord_name, u.phone AS landlord_phone, u.profile_photo AS landlord_photo
     FROM apartments a
     JOIN areas ar ON ar.id=a.area_id
     JOIN users  u  ON u.id=a.landlord_id
     WHERE a.id=$1 AND a.status='ACTIVE'`,
    [req.params.id]
  );
  if (!r.rows[0]) return fail(res, 'Listing not found.', 404);

  const apt = r.rows[0];

  const imgs = await query(
    'SELECT id, url, thumbnail_url, is_primary, display_order FROM apartment_images WHERE apartment_id=$1 ORDER BY is_primary DESC, display_order',
    [req.params.id]
  );
  const amen = await query(
    `SELECT am.id, am.name, am.icon, am.category FROM amenities am
     JOIN apartment_amenities aa ON aa.amenity_id=am.id WHERE aa.apartment_id=$1`,
    [req.params.id]
  );
  const reviews = await query(
    `SELECT rv.id, rv.rating, rv.body, rv.created_at, u.full_name AS reviewer_name
     FROM reviews rv LEFT JOIN users u ON u.id=rv.user_id
     WHERE rv.apartment_id=$1 AND rv.is_visible=true
     ORDER BY rv.created_at DESC LIMIT 5`,
    [req.params.id]
  );

  apt.images    = imgs.rows;
  apt.amenities = amen.rows;
  apt.reviews   = reviews.rows;

  return ok(res, apt);
});

/* POST /listings/:id/report — public */
router.post('/:id/report', optionalAuth,
  [body('reason').notEmpty(), body('details').optional()],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return fail(res, errs.array()[0].msg);
    const apt = await query("SELECT id FROM apartments WHERE id=$1 AND status='ACTIVE'", [req.params.id]);
    if (!apt.rows[0]) return fail(res, 'Listing not found.', 404);
    await query(
      'INSERT INTO reported_listings (reporter_id, apartment_id, reason, details) VALUES ($1,$2,$3,$4)',
      [req.user?.sub || null, req.params.id, req.body.reason, req.body.details || null]
    );
    return ok(res, {}, 'Report submitted. Our team will review it.');
  }
);


/* GET /listings/top-reviews — landing page testimonials */
router.get('/top-reviews', async (req, res) => {
  const r = await query(
    `SELECT r.reviewer_name, r.rating, r.comment, r.created_at,
            a.title AS listing_title, ar.name AS area_name
     FROM reviews r
     JOIN apartments a ON a.id = r.apartment_id
     JOIN areas ar ON ar.id = a.area_id
     WHERE r.is_visible = true
       AND r.rating >= 4
       AND r.comment IS NOT NULL
       AND LENGTH(r.comment) > 30
     ORDER BY r.rating DESC, r.created_at DESC
     LIMIT 3`
  );
  return ok(res, r.rows);
});

module.exports = router;
