// scripts/add-indexes.js
// Run once: node scripts/add-indexes.js
// Safe to run multiple times — all use CREATE INDEX IF NOT EXISTS
require('dotenv').config();
const { query, connectDB } = require('../src/database/connection');

const INDEXES = [
  // engagement_logs — most critical, will be millions of rows
  `CREATE INDEX IF NOT EXISTS idx_engagement_apartment_created
   ON engagement_logs(apartment_id, created_at DESC)`,

  `CREATE INDEX IF NOT EXISTS idx_engagement_ip_created
   ON engagement_logs(ip_address, created_at DESC)`,

  `CREATE INDEX IF NOT EXISTS idx_engagement_type
   ON engagement_logs(event_type, created_at DESC)`,

  // apartments — browsing and filtering
  `CREATE INDEX IF NOT EXISTS idx_apartments_status_available
   ON apartments(status, is_available)`,

  `CREATE INDEX IF NOT EXISTS idx_apartments_landlord
   ON apartments(landlord_id)`,

  `CREATE INDEX IF NOT EXISTS idx_apartments_area
   ON apartments(area_id)`,

  `CREATE INDEX IF NOT EXISTS idx_apartments_price
   ON apartments(price_kes)`,

  `CREATE INDEX IF NOT EXISTS idx_apartments_boosted
   ON apartments(is_boosted, boost_ends_at)`,

  `CREATE INDEX IF NOT EXISTS idx_apartments_created
   ON apartments(created_at DESC)`,

  // Full-text search index
  `CREATE INDEX IF NOT EXISTS idx_apartments_fts
   ON apartments USING gin(
     to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''))
   )`,

  // inquiries
  `CREATE INDEX IF NOT EXISTS idx_inquiries_landlord
   ON inquiries(landlord_id, created_at DESC)`,

  `CREATE INDEX IF NOT EXISTS idx_inquiries_tenant
   ON inquiries(tenant_id, created_at DESC)`,

  `CREATE INDEX IF NOT EXISTS idx_inquiries_apartment
   ON inquiries(apartment_id)`,

  // reviews
  `CREATE INDEX IF NOT EXISTS idx_reviews_apartment
   ON reviews(apartment_id, is_visible, created_at DESC)`,

  // notifications
  `CREATE INDEX IF NOT EXISTS idx_notifications_user
   ON notifications(user_id, is_read, created_at DESC)`,

  // refresh tokens
  `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash
   ON refresh_tokens(token_hash)`,

  `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user
   ON refresh_tokens(user_id, expires_at)`,

  // boost payments
  `CREATE INDEX IF NOT EXISTS idx_boost_payments_landlord
   ON boost_payments(landlord_id, created_at DESC)`,

  // wishlist
  `CREATE INDEX IF NOT EXISTS idx_wishlist_user
   ON wishlist(user_id)`,

  `CREATE INDEX IF NOT EXISTS idx_wishlist_apartment
   ON wishlist(apartment_id)`,
];

async function run() {
  await connectDB();
  console.log('🔧 Adding performance indexes...\n');
  let success = 0;
  let failed  = 0;
  for (const sql of INDEXES) {
    const name = sql.match(/idx_\w+/)?.[0] || 'unknown';
    try {
      await query(sql);
      console.log(`  ✅ ${name}`);
      success++;
    } catch (err) {
      console.error(`  ❌ ${name}: ${err.message}`);
      failed++;
    }
  }
  console.log(`\n✅ Done — ${success} indexes created, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
