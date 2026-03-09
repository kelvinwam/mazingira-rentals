const { query } = require('../database/connection');

async function expireBoosts() {
  try {
    const colCheck = await query(
      `SELECT 1 FROM information_schema.columns
       WHERE table_name='apartments' AND column_name='boost_ends_at' LIMIT 1`
    );
    if (!colCheck.rows[0]) return;

    const expired = await query(
      `UPDATE apartments SET is_boosted=false
       WHERE is_boosted=true AND boost_ends_at IS NOT NULL AND boost_ends_at < NOW()
       RETURNING id, landlord_id, title`
    );
    if (expired.rows.length > 0) {
      console.log(`⏰ Expired ${expired.rows.length} boost(s)`);
      for (const apt of expired.rows) {
        await query(
          `INSERT INTO notifications (user_id, type, title, body)
           VALUES ($1, 'BOOST_EXPIRED', '⏰ Boost Expired', $2)`,
          [apt.landlord_id, `Your boost for "${apt.title}" has ended. Boost again to stay at the top.`]
        ).catch(() => {});
      }
    }
  } catch (err) {
    console.error('Boost expiry check error:', err.message);
  }
}

module.exports = { expireBoosts };