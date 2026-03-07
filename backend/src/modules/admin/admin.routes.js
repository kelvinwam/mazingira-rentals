const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const { query }      = require('../../database/connection');
const { authenticate, requireRole } = require('../../common/middleware/auth.middleware');
const { ok, fail, paginated, parsePagination } = require('../../utils/helpers');

router.use(authenticate);
router.use(requireRole('ADMIN'));

/* ── GET /admin/stats ────────────────────────── */
router.get('/stats', async (req, res) => {
  const [listings, users, reports, reviews, messages] = await Promise.all([
    query(`SELECT
             COUNT(*)                                                        AS total,
             SUM(CASE WHEN status='ACTIVE'    THEN 1 ELSE 0 END)            AS active,
             SUM(CASE WHEN status='PENDING'   THEN 1 ELSE 0 END)            AS pending,
             SUM(CASE WHEN status='REJECTED'  THEN 1 ELSE 0 END)            AS rejected,
             SUM(CASE WHEN status='SUSPENDED' THEN 1 ELSE 0 END)            AS suspended,
             SUM(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) AS new_this_week
           FROM apartments`),
    query(`SELECT
             COUNT(*)                                                        AS total,
             SUM(CASE WHEN role='TENANT'   THEN 1 ELSE 0 END)               AS tenants,
             SUM(CASE WHEN role='LANDLORD' THEN 1 ELSE 0 END)               AS landlords,
             SUM(CASE WHEN is_active=false THEN 1 ELSE 0 END)               AS suspended,
             SUM(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END) AS new_this_week
           FROM users WHERE role != 'ADMIN'`),
    query(`SELECT COUNT(*) AS total, SUM(CASE WHEN is_resolved=false THEN 1 ELSE 0 END) AS pending FROM reported_listings`),
    query(`SELECT COUNT(*) AS total FROM reviews`),
    query(`SELECT COUNT(*) AS total FROM messages`),
  ]);

  return ok(res, {
    listings:  listings.rows[0],
    users:     users.rows[0],
    reports:   reports.rows[0],
    reviews:   parseInt(reviews.rows[0].total),
    messages:  parseInt(messages.rows[0].total),
  });
});

/* ── GET /admin/listings ─────────────────────── */
router.get('/listings', async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { status, q, area } = req.query;

  const conditions = [];
  const vals = [];
  let i = 1;

  if (status) { conditions.push(`a.status=$${i++}`);            vals.push(status); }
  if (area)   { conditions.push(`ar.slug=$${i++}`);             vals.push(area); }
  if (q)      { conditions.push(`(a.title ILIKE $${i} OR u.full_name ILIKE $${i} OR u.phone ILIKE $${i})`);
                vals.push(`%${q}%`); i++; }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const total = await query(
    `SELECT COUNT(*) FROM apartments a
     JOIN users u  ON u.id=a.landlord_id
     JOIN areas ar ON ar.id=a.area_id ${where}`, vals
  );

  vals.push(limit, offset);
  const rows = await query(
    `SELECT a.id, a.title, a.price_kes, a.status, a.verification_level,
            a.is_available, a.is_boosted, a.view_count, a.created_at, a.updated_at,
            a.price_flagged, a.admin_note,
            ar.name AS area_name, ar.slug AS area_slug,
            u.id AS landlord_id, u.full_name AS landlord_name, u.phone AS landlord_phone,
            (SELECT url FROM apartment_images WHERE apartment_id=a.id AND is_primary=true LIMIT 1) AS primary_image
     FROM apartments a
     JOIN users u  ON u.id=a.landlord_id
     JOIN areas ar ON ar.id=a.area_id
     ${where}
     ORDER BY
       CASE a.status WHEN 'PENDING' THEN 0 WHEN 'ACTIVE' THEN 1 ELSE 2 END,
       a.created_at DESC
     LIMIT $${i++} OFFSET $${i++}`,
    vals
  );

  return paginated(res, rows.rows, parseInt(total.rows[0].count), page, limit);
});

/* ── GET /admin/listings/:id ─────────────────── */
router.get('/listings/:id', async (req, res) => {
  const r = await query(
    `SELECT a.*,
            ar.name AS area_name,
            u.id AS landlord_id, u.full_name AS landlord_name,
            u.phone AS landlord_phone, u.email AS landlord_email
     FROM apartments a
     JOIN areas ar ON ar.id=a.area_id
     JOIN users u  ON u.id=a.landlord_id
     WHERE a.id=$1`,
    [req.params.id]
  );
  if (!r.rows[0]) return fail(res, 'Listing not found.', 404);

  const apt = r.rows[0];
  const [images, amenities, reviews, reports] = await Promise.all([
    query('SELECT * FROM apartment_images WHERE apartment_id=$1 ORDER BY is_primary DESC, display_order', [apt.id]),
    query(`SELECT am.* FROM amenities am JOIN apartment_amenities aa ON aa.amenity_id=am.id WHERE aa.apartment_id=$1`, [apt.id]),
    query(`SELECT rv.*, u.full_name AS reviewer_name FROM reviews rv LEFT JOIN users u ON u.id=rv.user_id WHERE rv.apartment_id=$1 ORDER BY rv.created_at DESC`, [apt.id]),
    query(`SELECT rl.*, u.full_name AS reporter_name FROM reported_listings rl LEFT JOIN users u ON u.id=rl.reporter_id WHERE rl.apartment_id=$1 ORDER BY rl.created_at DESC`, [apt.id]),
  ]);

  apt.images    = images.rows;
  apt.amenities = amenities.rows;
  apt.reviews   = reviews.rows;
  apt.reports   = reports.rows;

  return ok(res, apt);
});

/* ── PATCH /admin/listings/:id/status ────────── */
router.patch('/listings/:id/status',
  [
    body('status').isIn(['ACTIVE','REJECTED','SUSPENDED','ARCHIVED','PENDING']),
    body('admin_note').optional().trim(),
  ],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return fail(res, errs.array()[0].msg);

    const { status, admin_note } = req.body;

    const r = await query(
      `UPDATE apartments SET status=$1, admin_note=COALESCE($2, admin_note), updated_at=NOW()
       WHERE id=$3 RETURNING id, title, status, admin_note`,
      [status, admin_note || null, req.params.id]
    );
    if (!r.rows[0]) return fail(res, 'Listing not found.', 404);

    // Update area listing counts when status changes
    const apt = await query('SELECT area_id FROM apartments WHERE id=$1', [req.params.id]);
    if (apt.rows[0]) {
      await query(
        `UPDATE areas SET listing_count=(SELECT COUNT(*) FROM apartments WHERE area_id=$1 AND status='ACTIVE') WHERE id=$1`,
        [apt.rows[0].area_id]
      ).catch(() => {});
    }

    const msgs = {
      ACTIVE:    'Listing approved and is now live.',
      REJECTED:  'Listing rejected.',
      SUSPENDED: 'Listing suspended.',
      ARCHIVED:  'Listing archived.',
      PENDING:   'Listing moved back to pending.',
    };

    return ok(res, r.rows[0], msgs[status] || 'Status updated.');
  }
);

/* ── PATCH /admin/listings/:id/verify ───────────*/
router.patch('/listings/:id/verify',
  [body('level').isIn(['UNVERIFIED','PHONE_VERIFIED','IN_PERSON_VERIFIED'])],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return fail(res, errs.array()[0].msg);

    const r = await query(
      'UPDATE apartments SET verification_level=$1, updated_at=NOW() WHERE id=$2 RETURNING id, verification_level',
      [req.body.level, req.params.id]
    );
    if (!r.rows[0]) return fail(res, 'Listing not found.', 404);
    return ok(res, r.rows[0], 'Verification level updated.');
  }
);

/* ── PATCH /admin/listings/:id/boost ────────────*/
router.patch('/listings/:id/boost', async (req, res) => {
  const { boosted, days = 30 } = req.body;
  const expires = boosted ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;

  const r = await query(
    'UPDATE apartments SET is_boosted=$1, boost_expires_at=$2, updated_at=NOW() WHERE id=$3 RETURNING id, is_boosted, boost_expires_at',
    [!!boosted, expires, req.params.id]
  );
  if (!r.rows[0]) return fail(res, 'Listing not found.', 404);
  return ok(res, r.rows[0], boosted ? `Listing boosted for ${days} days.` : 'Boost removed.');
});

/* ── DELETE /admin/listings/:id ─────────────── */
router.delete('/listings/:id', async (req, res) => {
  const r = await query('SELECT id FROM apartments WHERE id=$1', [req.params.id]);
  if (!r.rows[0]) return fail(res, 'Listing not found.', 404);
  await query('DELETE FROM apartments WHERE id=$1', [req.params.id]);
  return ok(res, {}, 'Listing permanently deleted.');
});

/* ── GET /admin/users ────────────────────────── */
router.get('/users', async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { role, q, active } = req.query;

  const conditions = ["u.role != 'ADMIN'"];
  const vals = [];
  let i = 1;

  if (role)   { conditions.push(`u.role=$${i++}`);   vals.push(role); }
  if (active !== undefined) { conditions.push(`u.is_active=$${i++}`); vals.push(active === 'true'); }
  if (q)      { conditions.push(`(u.full_name ILIKE $${i} OR u.phone ILIKE $${i} OR u.email ILIKE $${i})`);
                vals.push(`%${q}%`); i++; }

  const where = 'WHERE ' + conditions.join(' AND ');

  const total = await query(`SELECT COUNT(*) FROM users u ${where}`, vals);

  vals.push(limit, offset);
  const rows = await query(
    `SELECT u.id, u.phone, u.full_name, u.email, u.role, u.is_active,
            u.is_phone_verified, u.created_at,
            COUNT(DISTINCT a.id) AS listing_count
     FROM users u
     LEFT JOIN apartments a ON a.landlord_id=u.id
     ${where}
     GROUP BY u.id
     ORDER BY u.created_at DESC
     LIMIT $${i++} OFFSET $${i++}`,
    vals
  );

  return paginated(res, rows.rows, parseInt(total.rows[0].count), page, limit);
});

/* ── GET /admin/users/:id ────────────────────── */
router.get('/users/:id', async (req, res) => {
  const r = await query(
    `SELECT u.*, COUNT(DISTINCT a.id) AS listing_count
     FROM users u
     LEFT JOIN apartments a ON a.landlord_id=u.id
     WHERE u.id=$1 GROUP BY u.id`,
    [req.params.id]
  );
  if (!r.rows[0]) return fail(res, 'User not found.', 404);

  const user = r.rows[0];
  delete user.password_hash;

  const listings = await query(
    `SELECT a.id, a.title, a.price_kes, a.status, a.created_at, ar.name AS area_name
     FROM apartments a JOIN areas ar ON ar.id=a.area_id
     WHERE a.landlord_id=$1 ORDER BY a.created_at DESC`,
    [req.params.id]
  );
  user.listings = listings.rows;

  return ok(res, user);
});

/* ── PATCH /admin/users/:id/status ──────────── */
router.patch('/users/:id/status',
  [body('is_active').isBoolean()],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return fail(res, errs.array()[0].msg);

    const r = await query(
      'UPDATE users SET is_active=$1, updated_at=NOW() WHERE id=$2 AND role!=\'ADMIN\' RETURNING id, full_name, is_active',
      [req.body.is_active, req.params.id]
    );
    if (!r.rows[0]) return fail(res, 'User not found.', 404);

    return ok(res, r.rows[0], req.body.is_active ? 'User reactivated.' : 'User suspended.');
  }
);

/* ── PATCH /admin/users/:id/role ─────────────── */
router.patch('/users/:id/role',
  [body('role').isIn(['TENANT','LANDLORD'])],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return fail(res, errs.array()[0].msg);

    const r = await query(
      'UPDATE users SET role=$1, updated_at=NOW() WHERE id=$2 AND role!=\'ADMIN\' RETURNING id, full_name, role',
      [req.body.role, req.params.id]
    );
    if (!r.rows[0]) return fail(res, 'User not found.', 404);
    return ok(res, r.rows[0], 'User role updated.');
  }
);

/* ── GET /admin/reports ──────────────────────── */
router.get('/reports', async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { resolved } = req.query;

  const conditions = [];
  const vals = [];
  let i = 1;

  if (resolved !== undefined) { conditions.push(`rl.is_resolved=$${i++}`); vals.push(resolved === 'true'); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const total = await query(`SELECT COUNT(*) FROM reported_listings rl ${where}`, vals);

  vals.push(limit, offset);
  const rows = await query(
    `SELECT rl.id, rl.reason, rl.details, rl.is_resolved, rl.created_at,
            a.id AS apartment_id, a.title AS apartment_title, a.status AS apartment_status,
            reporter.full_name AS reporter_name, reporter.phone AS reporter_phone,
            resolver.full_name AS resolved_by_name
     FROM reported_listings rl
     JOIN apartments a        ON a.id=rl.apartment_id
     LEFT JOIN users reporter ON reporter.id=rl.reporter_id
     LEFT JOIN users resolver ON resolver.id=rl.resolved_by
     ${where}
     ORDER BY rl.is_resolved ASC, rl.created_at DESC
     LIMIT $${i++} OFFSET $${i++}`,
    vals
  );

  return paginated(res, rows.rows, parseInt(total.rows[0].count), page, limit);
});

/* ── PATCH /admin/reports/:id/resolve ────────── */
router.patch('/reports/:id/resolve', async (req, res) => {
  const r = await query(
    'UPDATE reported_listings SET is_resolved=true, resolved_by=$1 WHERE id=$2 RETURNING id',
    [req.user.sub, req.params.id]
  );
  if (!r.rows[0]) return fail(res, 'Report not found.', 404);
  return ok(res, {}, 'Report marked as resolved.');
});

/* ── DELETE /admin/reviews/:id ───────────────── */
router.delete('/reviews/:id', async (req, res) => {
  const r = await query('SELECT apartment_id FROM reviews WHERE id=$1', [req.params.id]);
  if (!r.rows[0]) return fail(res, 'Review not found.', 404);

  await query('DELETE FROM reviews WHERE id=$1', [req.params.id]);
  await query(
    `UPDATE apartments SET
       avg_rating   = (SELECT ROUND(AVG(rating)::numeric,1) FROM reviews WHERE apartment_id=$1 AND is_visible=true),
       review_count = (SELECT COUNT(*) FROM reviews WHERE apartment_id=$1 AND is_visible=true)
     WHERE id=$1`,
    [r.rows[0].apartment_id]
  );
  return ok(res, {}, 'Review deleted.');
});

module.exports = router;
