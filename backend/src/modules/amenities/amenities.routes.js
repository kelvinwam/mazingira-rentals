const express = require('express');
const router  = express.Router();
const { query } = require('../../database/connection');
const { ok } = require('../../utils/helpers');

/* GET /amenities */
router.get('/', async (req, res) => {
  const r = await query('SELECT id, name, icon, category FROM amenities ORDER BY category, name');
  // group by category
  const grouped = r.rows.reduce((acc, a) => {
    (acc[a.category] = acc[a.category] || []).push(a);
    return acc;
  }, {});
  return ok(res, { flat: r.rows, grouped });
});

module.exports = router;
