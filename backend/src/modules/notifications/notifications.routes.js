const express = require('express');
const router  = express.Router();
const { query } = require('../../database/connection');
const { authenticate } = require('../../common/middleware/auth.middleware');
const { ok } = require('../../utils/helpers');

router.use(authenticate);

/* GET /notifications */
router.get('/', async (req, res) => {
  const rows = await query(
    `SELECT id, type, title, body, data, is_read, created_at
     FROM notifications
     WHERE user_id=$1
     ORDER BY created_at DESC
     LIMIT 30`,
    [req.user.sub]
  );
  const unread = rows.rows.filter(n => !n.is_read).length;
  return ok(res, { notifications: rows.rows, unread });
});

/* PATCH /notifications/read-all */
router.patch('/read-all', async (req, res) => {
  await query(
    `UPDATE notifications SET is_read=true WHERE user_id=$1 AND is_read=false`,
    [req.user.sub]
  );
  return ok(res, {}, 'All notifications marked as read.');
});

/* PATCH /notifications/:id/read */
router.patch('/:id/read', async (req, res) => {
  await query(
    `UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2`,
    [req.params.id, req.user.sub]
  );
  return ok(res, {});
});

module.exports = router;
