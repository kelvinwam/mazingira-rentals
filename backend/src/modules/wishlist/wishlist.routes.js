const express = require('express');
const router  = express.Router();
const { query }      = require('../../database/connection');
const { authenticate } = require('../../common/middleware/auth.middleware');
const { ok, fail, paginated, parsePagination } = require('../../utils/helpers');

router.use(authenticate);

/* GET /wishlist — tenant's saved listings */
router.get('/', async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const uid = req.user.sub;

  const total = await query(
    'SELECT COUNT(*) FROM wishlists WHERE tenant_id=$1', [uid]
  );

  const rows = await query(
    `SELECT a.id, a.title, a.price_kes, a.bedrooms, a.bathrooms,
            a.is_available, a.is_boosted, a.verification_level,
            a.avg_rating, a.review_count, a.address_hint,
            ar.name AS area_name, ar.slug AS area_slug,
            w.created_at AS saved_at,
            (SELECT url FROM apartment_images WHERE apartment_id=a.id AND is_primary=true LIMIT 1) AS primary_image,
            (SELECT thumbnail_url FROM apartment_images WHERE apartment_id=a.id AND is_primary=true LIMIT 1) AS thumbnail
     FROM wishlists w
     JOIN apartments a  ON a.id  = w.apartment_id
     JOIN areas      ar ON ar.id = a.area_id
     WHERE w.tenant_id=$1
     ORDER BY w.created_at DESC
     LIMIT $2 OFFSET $3`,
    [uid, limit, offset]
  );

  return paginated(res, rows.rows, parseInt(total.rows[0].count), page, limit);
});

/* POST /wishlist/:apartmentId — save a listing */
router.post('/:apartmentId', async (req, res) => {
  const uid = req.user.sub;
  const aid = req.params.apartmentId;

  const apt = await query("SELECT id FROM apartments WHERE id=$1 AND status='ACTIVE'", [aid]);
  if (!apt.rows[0]) return fail(res, 'Listing not found.', 404);

  const existing = await query(
    'SELECT id FROM wishlists WHERE tenant_id=$1 AND apartment_id=$2', [uid, aid]
  );
  if (existing.rows[0]) return ok(res, { saved: true }, 'Already in your wishlist.');

  await query(
    'INSERT INTO wishlists (tenant_id, apartment_id) VALUES ($1,$2)', [uid, aid]
  );
  await query(
    'UPDATE apartments SET wishlist_count = wishlist_count + 1 WHERE id=$1', [aid]
  );

  return ok(res, { saved: true }, 'Saved to wishlist.', 201);
});

/* DELETE /wishlist/:apartmentId — unsave */
router.delete('/:apartmentId', async (req, res) => {
  const uid = req.user.sub;
  const aid = req.params.apartmentId;

  const existing = await query(
    'SELECT id FROM wishlists WHERE tenant_id=$1 AND apartment_id=$2', [uid, aid]
  );
  if (!existing.rows[0]) return fail(res, 'Not in wishlist.', 404);

  await query('DELETE FROM wishlists WHERE tenant_id=$1 AND apartment_id=$2', [uid, aid]);
  await query(
    'UPDATE apartments SET wishlist_count = GREATEST(wishlist_count - 1, 0) WHERE id=$1', [aid]
  );

  return ok(res, { saved: false }, 'Removed from wishlist.');
});

/* GET /wishlist/check/:apartmentId — is this listing saved? */
router.get('/check/:apartmentId', async (req, res) => {
  const row = await query(
    'SELECT id FROM wishlists WHERE tenant_id=$1 AND apartment_id=$2',
    [req.user.sub, req.params.apartmentId]
  );
  return ok(res, { saved: !!row.rows[0] });
});

module.exports = router;
