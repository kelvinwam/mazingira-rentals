const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const { query }      = require('../../database/connection');
const { authenticate, requireRole } = require('../../common/middleware/auth.middleware');
const { ok, fail, paginated, parsePagination } = require('../../utils/helpers');
const { cloudinary, getUploader } = require('../../config/cloudinary.config');

// All landlord routes require auth + LANDLORD role
router.use(authenticate);
router.use(requireRole('LANDLORD'));

/* ── GET /landlord/stats ─────────────────────── */
router.get('/stats', async (req, res) => {
  const uid = req.user.sub;

  const [listings, views, inquiries, wishlists] = await Promise.all([
    query(`SELECT COUNT(*) AS total,
                  SUM(CASE WHEN status='ACTIVE'  THEN 1 ELSE 0 END) AS active,
                  SUM(CASE WHEN status='PENDING' THEN 1 ELSE 0 END) AS pending
           FROM apartments WHERE landlord_id=$1`, [uid]),
    query(`SELECT COALESCE(SUM(view_count),0) AS total FROM apartments WHERE landlord_id=$1`, [uid]),
    query(`SELECT COUNT(*) AS total FROM inquiries WHERE landlord_id=$1`, [uid]),
    query(`SELECT COALESCE(SUM(wishlist_count),0) AS total FROM apartments WHERE landlord_id=$1`, [uid]),
  ]);

  return ok(res, {
    listings:  listings.rows[0],
    views:     parseInt(views.rows[0].total),
    inquiries: parseInt(inquiries.rows[0].total),
    wishlists: parseInt(wishlists.rows[0].total),
  });
});

/* ── GET /landlord/listings ──────────────────── */
router.get('/listings', async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const uid = req.user.sub;

  const total = await query(
    'SELECT COUNT(*) FROM apartments WHERE landlord_id=$1', [uid]
  );

  const rows = await query(
    `SELECT a.id, a.title, a.price_kes, a.bedrooms, a.bathrooms,
            a.status, a.is_available, a.is_boosted, a.verification_level,
            a.view_count, a.inquiry_count, a.wishlist_count,
            a.avg_rating, a.review_count, a.created_at, a.updated_at,
            ar.name AS area_name,
            (SELECT url FROM apartment_images WHERE apartment_id=a.id AND is_primary=true LIMIT 1) AS primary_image
     FROM apartments a
     JOIN areas ar ON ar.id=a.area_id
     WHERE a.landlord_id=$1
     ORDER BY a.created_at DESC
     LIMIT $2 OFFSET $3`,
    [uid, limit, offset]
  );

  return paginated(res, rows.rows, parseInt(total.rows[0].count), page, limit);
});

/* ── POST /landlord/listings ─────────────────── */
router.post('/listings',
  [
    body('title').trim().isLength({ min: 10, max: 200 }).withMessage('Title must be 10–200 characters'),
    body('description').trim().isLength({ min: 50 }).withMessage('Description must be at least 50 characters'),
    body('price_kes').isInt({ min: 1 }).withMessage('Price must be a positive number'),
    body('deposit_kes').optional().isInt({ min: 0 }),
    body('area_id').isUUID().withMessage('Valid area is required'),
    body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
    body('bedrooms').optional().isInt({ min: 0, max: 20 }),
    body('bathrooms').optional().isInt({ min: 0, max: 20 }),
    body('floor_level').optional().isInt({ min: 0 }),
    body('address_hint').optional().trim().isLength({ max: 255 }),
    body('amenity_ids').optional().isArray(),
  ],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return fail(res, errs.array()[0].msg);

    const {
      title, description, price_kes, deposit_kes = 0,
      area_id, latitude, longitude, bedrooms, bathrooms,
      floor_level, address_hint, amenity_ids = [],
    } = req.body;

    // Verify area exists
    const area = await query('SELECT id FROM areas WHERE id=$1 AND is_active=true', [area_id]);
    if (!area.rows[0]) return fail(res, 'Selected area not found.');

    const r = await query(
      `INSERT INTO apartments
         (landlord_id, area_id, title, description, price_kes, deposit_kes,
          bedrooms, bathrooms, floor_level, latitude, longitude, address_hint, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'PENDING')
       RETURNING *`,
      [req.user.sub, area_id, title, description, price_kes, deposit_kes,
       bedrooms || null, bathrooms || null, floor_level || null,
       latitude, longitude, address_hint || null]
    );

    const apt = r.rows[0];

    // Insert amenities
    if (amenity_ids.length > 0) {
      const amenValues = amenity_ids.map((_, i) => `($1, $${i + 2})`).join(', ');
      await query(
        `INSERT INTO apartment_amenities (apartment_id, amenity_id) VALUES ${amenValues} ON CONFLICT DO NOTHING`,
        [apt.id, ...amenity_ids]
      ).catch(() => {});
    }

    // Update area listing count
    await query(
      `UPDATE areas SET listing_count = (SELECT COUNT(*) FROM apartments WHERE area_id=$1 AND status='ACTIVE') WHERE id=$1`,
      [area_id]
    ).catch(() => {});

    return ok(res, apt, 'Listing submitted for review. It will go live once approved by our team.', 201);
  }
);

/* ── GET /landlord/listings/:id ──────────────── */
router.get('/listings/:id', async (req, res) => {
  const r = await query(
    `SELECT a.*, ar.name AS area_name, ar.id AS area_id_val
     FROM apartments a
     JOIN areas ar ON ar.id=a.area_id
     WHERE a.id=$1 AND a.landlord_id=$2`,
    [req.params.id, req.user.sub]
  );
  if (!r.rows[0]) return fail(res, 'Listing not found.', 404);

  const apt = r.rows[0];

  const [images, amenities] = await Promise.all([
    query('SELECT * FROM apartment_images WHERE apartment_id=$1 ORDER BY is_primary DESC, display_order', [apt.id]),
    query(`SELECT am.id FROM amenities am
           JOIN apartment_amenities aa ON aa.amenity_id=am.id
           WHERE aa.apartment_id=$1`, [apt.id]),
  ]);

  apt.images      = images.rows;
  apt.amenity_ids = amenities.rows.map(a => a.id);

  return ok(res, apt);
});

/* ── PATCH /landlord/listings/:id ────────────── */
router.patch('/listings/:id',
  [
    body('title').optional().trim().isLength({ min: 10, max: 200 }),
    body('description').optional().trim().isLength({ min: 50 }),
    body('price_kes').optional().isInt({ min: 1 }),
    body('deposit_kes').optional().isInt({ min: 0 }),
    body('area_id').optional().isUUID(),
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 }),
    body('bedrooms').optional().isInt({ min: 0 }),
    body('bathrooms').optional().isInt({ min: 0 }),
    body('address_hint').optional().trim(),
    body('is_available').optional().isBoolean(),
    body('amenity_ids').optional().isArray(),
  ],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return fail(res, errs.array()[0].msg);

    const existing = await query(
      'SELECT * FROM apartments WHERE id=$1 AND landlord_id=$2',
      [req.params.id, req.user.sub]
    );
    if (!existing.rows[0]) return fail(res, 'Listing not found.', 404);

    const apt = existing.rows[0];
    const {
      title, description, price_kes, deposit_kes,
      area_id, latitude, longitude, bedrooms, bathrooms,
      floor_level, address_hint, is_available, amenity_ids,
    } = req.body;

    const updated = await query(
      `UPDATE apartments SET
         title         = COALESCE($1,  title),
         description   = COALESCE($2,  description),
         price_kes     = COALESCE($3,  price_kes),
         deposit_kes   = COALESCE($4,  deposit_kes),
         area_id       = COALESCE($5,  area_id),
         latitude      = COALESCE($6,  latitude),
         longitude     = COALESCE($7,  longitude),
         bedrooms      = COALESCE($8,  bedrooms),
         bathrooms     = COALESCE($9,  bathrooms),
         floor_level   = COALESCE($10, floor_level),
         address_hint  = COALESCE($11, address_hint),
         is_available  = COALESCE($12, is_available),
         updated_at    = NOW()
       WHERE id=$13 AND landlord_id=$14
       RETURNING *`,
      [title, description, price_kes, deposit_kes, area_id,
       latitude, longitude, bedrooms, bathrooms, floor_level,
       address_hint, is_available, req.params.id, req.user.sub]
    );

    // Update amenities if provided
    if (Array.isArray(amenity_ids)) {
      await query('DELETE FROM apartment_amenities WHERE apartment_id=$1', [apt.id]);
      if (amenity_ids.length > 0) {
        const vals = amenity_ids.map((_, i) => `($1,$${i + 2})`).join(',');
        await query(
          `INSERT INTO apartment_amenities (apartment_id, amenity_id) VALUES ${vals} ON CONFLICT DO NOTHING`,
          [apt.id, ...amenity_ids]
        ).catch(() => {});
      }
    }

    return ok(res, updated.rows[0], 'Listing updated.');
  }
);

/* ── DELETE /landlord/listings/:id ───────────── */
router.delete('/listings/:id', async (req, res) => {
  const r = await query(
    'SELECT * FROM apartments WHERE id=$1 AND landlord_id=$2',
    [req.params.id, req.user.sub]
  );
  if (!r.rows[0]) return fail(res, 'Listing not found.', 404);

  // Delete images from Cloudinary
  const images = await query('SELECT public_id FROM apartment_images WHERE apartment_id=$1', [req.params.id]);
  for (const img of images.rows) {
    if (img.public_id) await cloudinary.uploader.destroy(img.public_id).catch(() => {});
  }

  await query('DELETE FROM apartments WHERE id=$1', [req.params.id]);
  return ok(res, {}, 'Listing deleted.');
});

/* ── PATCH /landlord/listings/:id/availability ─ */
router.patch('/listings/:id/availability', async (req, res) => {
  const r = await query(
    'SELECT id FROM apartments WHERE id=$1 AND landlord_id=$2',
    [req.params.id, req.user.sub]
  );
  if (!r.rows[0]) return fail(res, 'Listing not found.', 404);

  const { is_available } = req.body;
  if (typeof is_available !== 'boolean') return fail(res, 'is_available must be true or false');

  const updated = await query(
    `UPDATE apartments SET is_available=$1, last_confirmed_at=NOW(), updated_at=NOW()
     WHERE id=$2 RETURNING id, is_available, last_confirmed_at`,
    [is_available, req.params.id]
  );
  return ok(res, updated.rows[0], `Listing marked as ${is_available ? 'available' : 'taken'}.`);
});

/* ── PATCH /landlord/listings/:id/rent-status ── */
router.patch('/listings/:id/rent-status', async (req, res) => {
  const r = await query(
    'SELECT id, status FROM apartments WHERE id=$1 AND landlord_id=$2',
    [req.params.id, req.user.sub]
  );
  if (!r.rows[0]) return fail(res, 'Listing not found.', 404);

  const { action } = req.body; // 'rent_out' or 'relist'
  if (!['rent_out', 'relist'].includes(action)) return fail(res, 'action must be rent_out or relist');

  if (action === 'rent_out') {
    await query(
      `UPDATE apartments SET status='RENTED', is_available=false, updated_at=NOW() WHERE id=$1`,
      [req.params.id]
    );
    return ok(res, {}, 'Listing marked as rented and removed from public browse.');
  } else {
    await query(
      `UPDATE apartments SET status='ACTIVE', is_available=true, updated_at=NOW() WHERE id=$1`,
      [req.params.id]
    );
    return ok(res, {}, 'Listing re-listed and is now visible to tenants.');
  }
});

/* ── POST /landlord/listings/:id/images ─────── */
router.post('/listings/:id/images', async (req, res) => {
  const apt = await query(
    'SELECT id FROM apartments WHERE id=$1 AND landlord_id=$2',
    [req.params.id, req.user.sub]
  );
  if (!apt.rows[0]) return fail(res, 'Listing not found.', 404);

  const uploader = getUploader();

  uploader.array('images', 10)(req, res, async (err) => {
    if (err) return fail(res, err.message || 'Image upload failed.');
    if (!req.files || req.files.length === 0) return fail(res, 'No images uploaded.');

    const files = req.files;
    const existingCount = await query(
      'SELECT COUNT(*) FROM apartment_images WHERE apartment_id=$1', [req.params.id]
    );
    const currentCount = parseInt(existingCount.rows[0].count);
    if (currentCount + files.length > 10) {
      return fail(res, `You can upload a maximum of 10 images. You have ${currentCount} already.`);
    }

    const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name';
    const isPrimary = currentCount === 0;
    const inserted  = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let url, thumbnail_url, public_id;

      if (hasCloudinary) {
        url           = file.path;
        thumbnail_url = file.path.replace('/upload/', '/upload/w_400,h_300,c_fill,q_auto/');
        public_id     = file.filename;
      } else {
        url           = `https://picsum.photos/seed/${Date.now() + i}/1200/900`;
        thumbnail_url = `https://picsum.photos/seed/${Date.now() + i}/400/300`;
        public_id     = null;
      }

      const row = await query(
        `INSERT INTO apartment_images (apartment_id, url, thumbnail_url, public_id, is_primary, display_order)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [req.params.id, url, thumbnail_url, public_id, isPrimary && i === 0, currentCount + i]
      );
      inserted.push(row.rows[0]);
    }

    return ok(res, inserted, `${inserted.length} image(s) uploaded.`, 201);
  });
});

/* ── DELETE /landlord/listings/:id/images/:imgId */
router.delete('/listings/:id/images/:imgId', async (req, res) => {
  const img = await query(
    `SELECT ai.* FROM apartment_images ai
     JOIN apartments a ON a.id=ai.apartment_id
     WHERE ai.id=$1 AND a.landlord_id=$2`,
    [req.params.imgId, req.user.sub]
  );
  if (!img.rows[0]) return fail(res, 'Image not found.', 404);

  if (img.rows[0].public_id) {
    await cloudinary.uploader.destroy(img.rows[0].public_id).catch(() => {});
  }

  await query('DELETE FROM apartment_images WHERE id=$1', [req.params.imgId]);

  // If deleted image was primary, promote next image
  if (img.rows[0].is_primary) {
    await query(
      `UPDATE apartment_images SET is_primary=true
       WHERE id=(SELECT id FROM apartment_images WHERE apartment_id=$1 ORDER BY display_order LIMIT 1)`,
      [req.params.id]
    ).catch(() => {});
  }

  return ok(res, {}, 'Image deleted.');
});

/* ── PATCH /landlord/listings/:id/images/:imgId/primary */
router.patch('/listings/:id/images/:imgId/primary', async (req, res) => {
  const img = await query(
    `SELECT ai.id FROM apartment_images ai
     JOIN apartments a ON a.id=ai.apartment_id
     WHERE ai.id=$1 AND a.landlord_id=$2`,
    [req.params.imgId, req.user.sub]
  );
  if (!img.rows[0]) return fail(res, 'Image not found.', 404);

  await query('UPDATE apartment_images SET is_primary=false WHERE apartment_id=$1', [req.params.id]);
  await query('UPDATE apartment_images SET is_primary=true  WHERE id=$1',           [req.params.imgId]);

  return ok(res, {}, 'Cover image updated.');
});

module.exports = router;

/* ── GET /landlord/analytics ─────────────────── */
router.get('/analytics', async (req, res) => {
  const uid = req.user.sub;

  const [
    dailyViews,
    topListings,
    conversionStats,
    recentInquiries,
    boostStats,
  ] = await Promise.all([

    // Views per day for last 14 days
    query(`
      SELECT DATE(el.created_at) AS day, COUNT(*) AS views
      FROM engagement_logs el
      JOIN apartments a ON a.id = el.apartment_id
      WHERE a.landlord_id=$1
        AND el.event_type='VIEW'
        AND el.created_at >= NOW() - INTERVAL '14 days'
      GROUP BY DATE(el.created_at)
      ORDER BY day ASC
    `, [uid]),

    // Top performing listings by views
    query(`
      SELECT a.id, a.title, a.view_count, a.inquiry_count,
             a.wishlist_count, a.avg_rating, a.price_kes,
             a.is_boosted, a.status,
             ar.name AS area_name,
             (SELECT url FROM apartment_images WHERE apartment_id=a.id AND is_primary=true LIMIT 1) AS primary_image
      FROM apartments a
      JOIN areas ar ON ar.id=a.area_id
      WHERE a.landlord_id=$1
      ORDER BY a.view_count DESC
      LIMIT 5
    `, [uid]),

    // Conversion: views → inquiries ratio per listing
    query(`
      SELECT
        COALESCE(SUM(view_count),0)    AS total_views,
        COALESCE(SUM(inquiry_count),0) AS total_inquiries,
        COALESCE(SUM(wishlist_count),0) AS total_wishlists,
        COUNT(*) FILTER (WHERE status::text='ACTIVE')  AS active_count,
        COUNT(*) FILTER (WHERE status::text='RENTED')  AS rented_count
      FROM apartments
      WHERE landlord_id=$1
    `, [uid]),

    // Recent inquiries with listing title
    query(`
      SELECT i.id, i.created_at, i.last_message,
             a.title AS listing_title,
             u.full_name AS tenant_name
      FROM inquiries i
      JOIN apartments a ON a.id=i.apartment_id
      JOIN users u ON u.id=i.tenant_id
      WHERE i.landlord_id=$1
      ORDER BY i.created_at DESC
      LIMIT 5
    `, [uid]),

    // Boost history
    query(`
      SELECT bp.boost_days, bp.amount_kes, bp.status,
             bp.boost_starts_at, bp.boost_ends_at,
             a.title AS listing_title
      FROM boost_payments bp
      JOIN apartments a ON a.id=bp.apartment_id
      WHERE bp.landlord_id=$1
        AND bp.status='COMPLETED'
      ORDER BY bp.created_at DESC
      LIMIT 3
    `, [uid]),
  ]);

  return ok(res, {
    dailyViews:     dailyViews.rows,
    topListings:    topListings.rows,
    conversion:     conversionStats.rows[0],
    recentInquiries: recentInquiries.rows,
    boostHistory:   boostStats.rows,
  });
});
