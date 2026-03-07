const express = require('express');
const router  = express.Router();
const { query } = require('../../database/connection');
const { ok, fail } = require('../../utils/helpers');

/* GET /search/suggest?q=machakos — autocomplete */
router.get('/suggest', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (q.length < 2) return ok(res, []);

  const pattern = `%${q}%`;

  const [listings, areas] = await Promise.all([
    query(
      `SELECT id, title, price_kes, address_hint,
              ar.name AS area_name, ar.slug AS area_slug,
              (SELECT thumbnail_url FROM apartment_images WHERE apartment_id=a.id AND is_primary=true LIMIT 1) AS thumbnail
       FROM apartments a
       JOIN areas ar ON ar.id=a.area_id
       WHERE a.status='ACTIVE'
         AND (a.title ILIKE $1 OR a.address_hint ILIKE $1 OR ar.name ILIKE $1)
       ORDER BY a.is_boosted DESC, a.view_count DESC
       LIMIT 5`,
      [pattern]
    ),
    query(
      `SELECT id, name, slug, listing_count
       FROM areas
       WHERE is_active=true AND name ILIKE $1
       ORDER BY listing_count DESC
       LIMIT 3`,
      [pattern]
    ),
  ]);

  return ok(res, {
    listings: listings.rows,
    areas:    areas.rows,
  });
});

/* GET /search?q=2bedroom+machakos&... — full search */
router.get('/', async (req, res) => {
  const {
    q, area, min_price, max_price, bedrooms, available,
    page = '1', limit: lim = '12',
  } = req.query;

  const page_num  = Math.max(1, parseInt(page));
  const limit_num = Math.min(50, Math.max(1, parseInt(lim)));
  const offset    = (page_num - 1) * limit_num;

  const conditions = ["a.status='ACTIVE'"];
  const vals       = [];
  let   i          = 1;

  if (q) {
    conditions.push(`(
      to_tsvector('english', a.title || ' ' || COALESCE(a.description,'') || ' ' || COALESCE(a.address_hint,'') || ' ' || ar.name)
      @@ plainto_tsquery('english', $${i})
      OR a.title       ILIKE $${i+1}
      OR a.address_hint ILIKE $${i+1}
      OR ar.name        ILIKE $${i+1}
    )`);
    vals.push(q, `%${q}%`);
    i += 2;
  }
  if (area)      { conditions.push(`ar.slug=$${i++}`);          vals.push(area); }
  if (min_price) { conditions.push(`a.price_kes>=$${i++}`);     vals.push(parseInt(min_price)); }
  if (max_price) { conditions.push(`a.price_kes<=$${i++}`);     vals.push(parseInt(max_price)); }
  if (bedrooms)  { conditions.push(`a.bedrooms=$${i++}`);       vals.push(parseInt(bedrooms)); }
  if (available === 'true') { conditions.push(`a.is_available=true`); }

  const where = 'WHERE ' + conditions.join(' AND ');

  const total = await query(
    `SELECT COUNT(*) FROM apartments a JOIN areas ar ON ar.id=a.area_id ${where}`, vals
  );

  const rankExpr = q
    ? `ts_rank(to_tsvector('english', a.title || ' ' || COALESCE(a.description,'') || ' ' || COALESCE(a.address_hint,'') || ' ' || ar.name), plainto_tsquery('english', $${i})) DESC, a.is_boosted DESC, a.view_count DESC`
    : `a.is_boosted DESC, a.view_count DESC, a.created_at DESC`;

  if (q) vals.push(q);
  vals.push(limit_num, offset);

  const rows = await query(
    `SELECT a.id, a.title, a.price_kes, a.bedrooms, a.bathrooms,
            a.is_available, a.is_boosted, a.verification_level,
            a.avg_rating, a.review_count, a.address_hint, a.view_count,
            ar.name AS area_name, ar.slug AS area_slug,
            (SELECT url FROM apartment_images WHERE apartment_id=a.id AND is_primary=true LIMIT 1) AS primary_image,
            (SELECT thumbnail_url FROM apartment_images WHERE apartment_id=a.id AND is_primary=true LIMIT 1) AS thumbnail
     FROM apartments a
     JOIN areas ar ON ar.id=a.area_id
     ${where}
     ORDER BY ${rankExpr}
     LIMIT $${q ? i+1 : i} OFFSET $${q ? i+2 : i+1}`,
    vals
  );

  const totalCount = parseInt(total.rows[0].count);
  return res.json({
    success: true,
    data:    rows.rows,
    meta: {
      total:      totalCount,
      page:       page_num,
      limit:      limit_num,
      totalPages: Math.ceil(totalCount / limit_num),
      hasMore:    page_num < Math.ceil(totalCount / limit_num),
      query:      q || null,
    },
  });
});

module.exports = router;
