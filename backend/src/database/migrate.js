require('dotenv').config();
const { connectDB, query } = require('./connection');

const migrations = [
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,

  // Enums
  `DO $$ BEGIN CREATE TYPE user_role AS ENUM ('TENANT','LANDLORD','ADMIN');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  `DO $$ BEGIN CREATE TYPE listing_status AS ENUM ('PENDING','ACTIVE','REJECTED','ARCHIVED');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  `DO $$ BEGIN CREATE TYPE verification_level AS ENUM ('UNVERIFIED','PHONE_VERIFIED','IN_PERSON_VERIFIED');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  // Users — password-based, no OTP
  `CREATE TABLE IF NOT EXISTS users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    phone         VARCHAR(15) UNIQUE NOT NULL,
    full_name     VARCHAR(100),
    email         VARCHAR(150) UNIQUE,
    password_hash TEXT        NOT NULL,
    role          user_role   NOT NULL DEFAULT 'TENANT',
    is_active     BOOLEAN     DEFAULT TRUE,
    profile_photo TEXT,
    created_at    TIMESTAMP   DEFAULT NOW(),
    updated_at    TIMESTAMP   DEFAULT NOW()
  )`,

  // Areas
  `CREATE TABLE IF NOT EXISTS areas (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL UNIQUE,
    county        VARCHAR(100) DEFAULT 'Machakos',
    slug          VARCHAR(120) UNIQUE NOT NULL,
    center_lat    DECIMAL(10,8),
    center_lng    DECIMAL(11,8),
    is_active     BOOLEAN DEFAULT TRUE,
    created_at    TIMESTAMP DEFAULT NOW()
  )`,

  // Amenities
  `CREATE TABLE IF NOT EXISTS amenities (
    id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name     VARCHAR(80) NOT NULL UNIQUE,
    icon     VARCHAR(50),
    category VARCHAR(50)
  )`,

  // Listings
  `CREATE TABLE IF NOT EXISTS apartments (
    id                 UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id        UUID               NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    area_id            UUID               NOT NULL REFERENCES areas(id),
    title              VARCHAR(200)       NOT NULL,
    description        TEXT               NOT NULL,
    price_kes          INT                NOT NULL CHECK (price_kes > 0),
    deposit_kes        INT                NOT NULL DEFAULT 0,
    bedrooms           SMALLINT,
    bathrooms          SMALLINT,
    latitude           DECIMAL(10,8),
    longitude          DECIMAL(11,8),
    address_hint       VARCHAR(255),
    status             listing_status     DEFAULT 'PENDING',
    verification_level verification_level DEFAULT 'UNVERIFIED',
    is_available       BOOLEAN            DEFAULT TRUE,
    view_count         INT                DEFAULT 0,
    is_boosted         BOOLEAN            DEFAULT FALSE,
    admin_note         TEXT,
    created_at         TIMESTAMP          DEFAULT NOW(),
    updated_at         TIMESTAMP          DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_apartments_status   ON apartments(status)`,
  `CREATE INDEX IF NOT EXISTS idx_apartments_area     ON apartments(area_id)`,
  `CREATE INDEX IF NOT EXISTS idx_apartments_landlord ON apartments(landlord_id)`,

  // Listing images
  `CREATE TABLE IF NOT EXISTS apartment_images (
    id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    apartment_id  UUID      NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    url           TEXT      NOT NULL,
    is_primary    BOOLEAN   DEFAULT FALSE,
    display_order SMALLINT  DEFAULT 0,
    uploaded_at   TIMESTAMP DEFAULT NOW()
  )`,

  // Amenities join
  `CREATE TABLE IF NOT EXISTS apartment_amenities (
    apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
    amenity_id   UUID REFERENCES amenities(id)  ON DELETE CASCADE,
    PRIMARY KEY (apartment_id, amenity_id)
  )`,

  // Reviews — simple: any user can leave rating + comment on a listing
  `CREATE TABLE IF NOT EXISTS reviews (
    id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    apartment_id UUID      NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    reviewer_name VARCHAR(100) DEFAULT 'Anonymous',
    rating       SMALLINT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    is_visible   BOOLEAN   DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_reviews_apartment ON reviews(apartment_id)`,

  // Refresh tokens
  `CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT      NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id)`,

  // Engagement logs — unique view tracking
  `CREATE TABLE IF NOT EXISTS engagement_logs (
    id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    apartment_id UUID      REFERENCES apartments(id) ON DELETE CASCADE,
    ip_address   TEXT,
    event_type   TEXT      NOT NULL DEFAULT 'VIEW',
    created_at   TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_engagement_apt_ip ON engagement_logs(apartment_id, ip_address, event_type)`,
  `CREATE INDEX IF NOT EXISTS idx_engagement_created ON engagement_logs(created_at)`,
];

async function runMigrations() {
  try {
    await connectDB();
    console.log('\n🔄 Running migrations...');
    for (const sql of migrations) {
      await query(sql);
    }
    console.log(`✅ All ${migrations.length} migrations done\n`);
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error(err.stack);
    throw err;
  }
}

// Only auto-run when called directly: node src/database/migrate.js
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

// ── Stage 8 migrations (run safely with IF NOT EXISTS) ──────────────────────
const stage8migrations = [
  `ALTER TABLE apartments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING'`,
  `DO $$ BEGIN
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
       CREATE TYPE payment_status AS ENUM ('PENDING','COMPLETED','FAILED','REFUNDED');
     END IF;
   END $$`,
  `CREATE TABLE IF NOT EXISTS boost_payments (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    apartment_id   UUID        NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    landlord_id    UUID        NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    amount_kes     INTEGER     NOT NULL,
    boost_days     INTEGER     NOT NULL DEFAULT 7,
    mpesa_code     TEXT,
    phone          TEXT        NOT NULL,
    status         TEXT        NOT NULL DEFAULT 'PENDING',
    checkout_id    TEXT,
    boost_starts_at TIMESTAMP,
    boost_ends_at   TIMESTAMP,
    created_at     TIMESTAMP   DEFAULT NOW(),
    updated_at     TIMESTAMP   DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_boost_apartment ON boost_payments(apartment_id)`,
  `CREATE INDEX IF NOT EXISTS idx_boost_landlord  ON boost_payments(landlord_id)`,
  `ALTER TABLE apartments ADD COLUMN IF NOT EXISTS boost_ends_at TIMESTAMP`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type         TEXT      NOT NULL,
    title        TEXT      NOT NULL,
    body         TEXT      NOT NULL,
    data         JSONB     DEFAULT '{}',
    is_read      BOOLEAN   DEFAULT false,
    created_at   TIMESTAMP DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, is_read, created_at DESC)`,
];

async function runStage8Migrations() {
  try {
    await connectDB();
    for (const sql of stage8migrations) {
      await query(sql);
    }
    console.log('✅ Stage 8 migrations done');
  } catch (err) {
    console.error('Stage 8 migration error:', err.message);
  }
}

// Run both when called directly
if (require.main === module) {
  (async () => {
    await connectDB();
    console.log('\n🔄 Running all migrations...');
    for (const sql of migrations) { await query(sql); }
    for (const sql of stage8migrations) { await query(sql); }
    console.log(`✅ All migrations done\n`);
    process.exit(0);
  })().catch(err => { console.error('❌ Migration failed:', err.message); process.exit(1); });
}

module.exports = { runStage8Migrations };

// Run boost expiry check — called by server on startup and every hour
async function expireBoosts() {
  try {
    // Check the column exists before querying (safe on first run before migration)
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
      // Notify each landlord
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

module.exports.expireBoosts = expireBoosts;
