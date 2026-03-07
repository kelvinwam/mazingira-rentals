const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const { query }      = require('../../database/connection');
const { authenticate } = require('../../common/middleware/auth.middleware');
const { ok, fail, paginated, parsePagination } = require('../../utils/helpers');

router.use(authenticate);

/* ── GET /messages — list all inquiries for current user ── */
router.get('/', async (req, res) => {
  const uid  = req.user.sub;
  const role = req.user.role;

  const rows = await query(
    `SELECT i.id, i.type, i.last_message, i.last_message_at, i.created_at,
            a.id AS apartment_id, a.title AS apartment_title, a.price_kes,
            ar.name AS area_name,
            (SELECT url FROM apartment_images WHERE apartment_id=a.id AND is_primary=true LIMIT 1) AS apartment_image,
            -- tenant info
            t.id        AS tenant_id,
            t.full_name AS tenant_name,
            t.phone     AS tenant_phone,
            -- landlord info
            l.id        AS landlord_id,
            l.full_name AS landlord_name,
            l.phone     AS landlord_phone,
            -- unread count for current user
            (SELECT COUNT(*) FROM messages m
             WHERE m.inquiry_id=i.id AND m.is_read=false AND m.sender_id != $1) AS unread_count
     FROM inquiries i
     JOIN apartments a  ON a.id  = i.apartment_id
     JOIN areas      ar ON ar.id = a.area_id
     LEFT JOIN users t  ON t.id  = i.tenant_id
     JOIN users      l  ON l.id  = i.landlord_id
     WHERE ($2='TENANT'   AND i.tenant_id  = $1)
        OR ($2='LANDLORD' AND i.landlord_id = $1)
        OR ($2='ADMIN')
     ORDER BY COALESCE(i.last_message_at, i.created_at) DESC`,
    [uid, role]
  );

  return ok(res, rows.rows);
});

/* ── POST /messages — start or find existing inquiry ── */
router.post('/',
  [
    body('apartment_id').isUUID().withMessage('Valid apartment ID required'),
    body('message').trim().isLength({ min: 2, max: 1000 }).withMessage('Message must be 2–1000 characters'),
  ],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return fail(res, errs.array()[0].msg);

    const uid          = req.user.sub;
    const { apartment_id, message } = req.body;

    // Get apartment + landlord
    const apt = await query(
      "SELECT id, landlord_id FROM apartments WHERE id=$1 AND status='ACTIVE'",
      [apartment_id]
    );
    if (!apt.rows[0]) return fail(res, 'Listing not found.', 404);

    const landlord_id = apt.rows[0].landlord_id;
    if (landlord_id === uid) return fail(res, 'You cannot message your own listing.');

    // Find or create inquiry
    let inquiry = await query(
      'SELECT * FROM inquiries WHERE apartment_id=$1 AND tenant_id=$2',
      [apartment_id, uid]
    );

    if (!inquiry.rows[0]) {
      inquiry = await query(
        `INSERT INTO inquiries (tenant_id, landlord_id, apartment_id, type, last_message, last_message_at)
         VALUES ($1,$2,$3,'IN_APP_MESSAGE',$4,NOW()) RETURNING *`,
        [uid, landlord_id, apartment_id, message.substring(0, 100)]
      );
      // increment inquiry count
      await query(
        'UPDATE apartments SET inquiry_count = inquiry_count + 1 WHERE id=$1', [apartment_id]
      );
    }

    const inq = inquiry.rows[0];

    // Insert message
    const msg = await query(
      'INSERT INTO messages (inquiry_id, sender_id, body) VALUES ($1,$2,$3) RETURNING *',
      [inq.id, uid, message]
    );

    // Update last message on inquiry
    await query(
      'UPDATE inquiries SET last_message=$1, last_message_at=NOW() WHERE id=$2',
      [message.substring(0, 100), inq.id]
    );

    return ok(res, { inquiry: inq, message: msg.rows[0] }, 'Message sent.', 201);
  }
);

/* ── GET /messages/:inquiryId — get full thread ── */
router.get('/:inquiryId', async (req, res) => {
  const uid = req.user.sub;

  // Verify user is part of this inquiry
  const inq = await query(
    `SELECT i.*, 
            a.id AS apartment_id, a.title AS apartment_title, a.price_kes,
            ar.name AS area_name,
            (SELECT url FROM apartment_images WHERE apartment_id=a.id AND is_primary=true LIMIT 1) AS apartment_image,
            t.full_name AS tenant_name,  t.phone AS tenant_phone,
            l.full_name AS landlord_name, l.phone AS landlord_phone
     FROM inquiries i
     JOIN apartments a  ON a.id  = i.apartment_id
     JOIN areas      ar ON ar.id = a.area_id
     LEFT JOIN users t  ON t.id  = i.tenant_id
     JOIN users      l  ON l.id  = i.landlord_id
     WHERE i.id=$1 AND (i.tenant_id=$2 OR i.landlord_id=$2)`,
    [req.params.inquiryId, uid]
  );
  if (!inq.rows[0]) return fail(res, 'Conversation not found.', 404);

  // Get messages
  const msgs = await query(
    `SELECT m.id, m.body, m.is_read, m.sent_at,
            u.id AS sender_id, u.full_name AS sender_name, u.role AS sender_role
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.inquiry_id=$1
     ORDER BY m.sent_at ASC`,
    [req.params.inquiryId]
  );

  // Mark incoming messages as read
  await query(
    'UPDATE messages SET is_read=true WHERE inquiry_id=$1 AND sender_id != $2 AND is_read=false',
    [req.params.inquiryId, uid]
  );

  return ok(res, { inquiry: inq.rows[0], messages: msgs.rows });
});

/* ── POST /messages/:inquiryId/reply — send a reply ── */
router.post('/:inquiryId/reply',
  [body('message').trim().isLength({ min: 1, max: 1000 })],
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return fail(res, errs.array()[0].msg);

    const uid = req.user.sub;

    const inq = await query(
      'SELECT * FROM inquiries WHERE id=$1 AND (tenant_id=$2 OR landlord_id=$2)',
      [req.params.inquiryId, uid]
    );
    if (!inq.rows[0]) return fail(res, 'Conversation not found.', 404);

    const msg = await query(
      'INSERT INTO messages (inquiry_id, sender_id, body) VALUES ($1,$2,$3) RETURNING *',
      [req.params.inquiryId, uid, req.body.message]
    );

    await query(
      'UPDATE inquiries SET last_message=$1, last_message_at=NOW() WHERE id=$2',
      [req.body.message.substring(0, 100), req.params.inquiryId]
    );

    return ok(res, msg.rows[0], 'Reply sent.', 201);
  }
);

/* ── GET /messages/unread/count — badge count ── */
router.get('/unread/count', async (req, res) => {
  const uid = req.user.sub;

  const r = await query(
    `SELECT COUNT(*) FROM messages m
     JOIN inquiries i ON i.id = m.inquiry_id
     WHERE (i.tenant_id=$1 OR i.landlord_id=$1)
       AND m.sender_id != $1
       AND m.is_read = false`,
    [uid]
  );

  return ok(res, { count: parseInt(r.rows[0].count) });
});

module.exports = router;
