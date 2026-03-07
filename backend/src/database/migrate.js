require('dotenv').config();
const { connectDB, query } = require('./connection');

const migrations = [
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,

  `DO $$ BEGIN CREATE TYPE user_role AS ENUM ('TENANT','LANDLORD','ADMIN');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  `DO $$ BEGIN CREATE TYPE listing_status AS ENUM ('PENDING','ACTIVE','REJECTED','SUSPENDED','ARCHIVED');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  `DO $$ BEGIN CREATE TYPE verification_level AS ENUM ('UNVERIFIED','PHONE_VERIFIED','IN_PERSON_VERIFIED');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  `DO $$ BEGIN CREATE TYPE inquiry_type AS ENUM ('CALL_CLICK','WHATSAPP_CLICK','IN_APP_MESSAGE');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  `DO $$ BEGIN CREATE TYPE report_reason AS ENUM ('SCAM','WRONG_LOCATION','FAKE_IMAGES','WRONG_PRICE','ALREADY_RENTED','OTHER');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  // Users — password_hash replaces OTP
  `CREATE TABLE IF NOT EXISTS users (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    phone             VARCHAR(15) UNIQUE NOT NULL,
    full_name         VARCHAR(100),
    email             VARCHAR(150) UNIQUE,
    role              user_role   NOT NULL DEFAULT 'TENANT',
    is_active         BOOLEAN     DEFAULT TRUE,
    is_phone_verified BOOLEAN     DEFAULT TRUE,
    password_hash     TEXT,
    profile_photo     TEXT,
    created_at        TIMESTAMP   DEFAULT NOW(),
    updated_at        TIMESTAMP   DEFAULT NOW()
  )`,

  // Areas
  `CREATE TABLE IF NOT EXISTS areas (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL UNIQUE,
    county        VARCHAR(100) DEFAULT 'Machakos',
    slug          VARCHAR(120) UNIQUE NOT NULL,
    center_lat    DECIMAL(10,8),
    center_lng    DECIMAL(11,8),
    is_active     BOOLEAN      DEFAULT TRUE,
    listing_count INT          DEFAULT 0,
    avg_price_kes INT          DEFAULT 0,
    created_at    TIMESTAMP    DEFAULT NOW()
  )`,

  // Amenities
  `CREATE TABLE IF NOT EXISTS amenities (
    id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name     VARCHAR(80) NOT NULL UNIQUE,
    icon     VARCHAR(50),
    category VARCHAR(50)
  )`,

  // Apartments — added avg_rating and review_count columns
  `CREATE TABLE IF NOT EXISTS apartments (
    id                 UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
    landlord_id        UUID               NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    area_id            UUID               NOT NULL REFERENCES areas(id),
    title              VARCHAR(200)       NOT NULL,
    description        TEXT               NOT NULL CHECK (char_length(description) >= 50),
    price_kes          INT                NOT NULL CHECK (price_kes > 0),
    deposit_kes        INT                NOT NULL DEFAULT 0,
    bedrooms           SMALLINT,
    bathrooms          SMALLINT,
    floor_level        SMALLINT,
    latitude           DECIMAL(10,8)      NOT NULL,
    longitude          DECIMAL(11,8)      NOT NULL,
    address_hint       VARCHAR(255),
    status             listing_status     DEFAULT 'PENDING',
    verification_level verification_level DEFAULT 'UNVERIFIED',
    is_available       BOOLEAN            DEFAULT TRUE,
    last_confirmed_at  TIMESTAMP,
    view_count         INT                DEFAULT 0,
    wishlist_count     INT                DEFAULT 0,
    inquiry_count      INT                DEFAULT 0,
    avg_rating         DECIMAL(3,1),
    review_count       INT                DEFAULT 0,
    is_boosted         BOOLEAN            DEFAULT FALSE,
    boost_expires_at   TIMESTAMP,
    admin_note         TEXT,
    price_flagged      BOOLEAN            DEFAULT FALSE,
    created_at         TIMESTAMP          DEFAULT NOW(),
    updated_at         TIMESTAMP          DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_apartments_status   ON apartments(status)`,
  `CREATE INDEX IF NOT EXISTS idx_apartments_area     ON apartments(area_id)`,
  `CREATE INDEX IF NOT EXISTS idx_apartments_landlord ON apartments(landlord_id)`,

  // Apartment images
  `CREATE TABLE IF NOT EXISTS apartment_images (
    id            UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    apartment_id  UUID      NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    url           TEXT      NOT NULL,
    thumbnail_url TEXT,
    public_id     TEXT,
    is_primary    BOOLEAN   DEFAULT FALSE,
    display_order SMALLINT  DEFAULT 0,
    uploaded_at   TIMESTAMP DEFAULT NOW()
  )`,

  // Apartment amenities
  `CREATE TABLE IF NOT EXISTS apartment_amenities (
    apartment_id UUID REFERENCES apartments(id) ON DELETE CASCADE,
    amenity_id   UUID REFERENCES amenities(id)  ON DELETE CASCADE,
    PRIMARY KEY (apartment_id, amenity_id)
  )`,

  // Wishlists
  `CREATE TABLE IF NOT EXISTS wishlists (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    apartment_id UUID NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    created_at   TIMESTAMP DEFAULT NOW(),
    UNIQUE (tenant_id, apartment_id)
  )`,

  // Inquiries
  `CREATE TABLE IF NOT EXISTS inquiries (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID         REFERENCES users(id),
    landlord_id     UUID         NOT NULL REFERENCES users(id),
    apartment_id    UUID         NOT NULL REFERENCES apartments(id),
    type            inquiry_type NOT NULL,
    last_message    TEXT,
    last_message_at TIMESTAMP,
    created_at      TIMESTAMP    DEFAULT NOW()
  )`,

  // Messages
  `CREATE TABLE IF NOT EXISTS messages (
    id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID      NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
    sender_id  UUID      NOT NULL REFERENCES users(id),
    body       TEXT      NOT NULL,
    is_read    BOOLEAN   DEFAULT FALSE,
    sent_at    TIMESTAMP DEFAULT NOW()
  )`,

  // Reviews — user_id nullable (anonymous reviews allowed)
  `CREATE TABLE IF NOT EXISTS reviews (
    id           UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    apartment_id UUID      NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
    user_id      UUID      REFERENCES users(id) ON DELETE SET NULL,
    rating       SMALLINT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
    body         TEXT      CHECK (body IS NULL OR char_length(body) >= 5),
    is_visible   BOOLEAN   DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_reviews_apartment ON reviews(apartment_id)`,

  // Engagement logs
  `CREATE TABLE IF NOT EXISTS engagement_logs (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        REFERENCES users(id),
    apartment_id UUID        NOT NULL REFERENCES apartments(id),
    event_type   VARCHAR(50) NOT NULL,
    session_id   VARCHAR(100),
    ip_address   INET,
    created_at   TIMESTAMP   DEFAULT NOW()
  )`,

  // Reports
  `CREATE TABLE IF NOT EXISTS reported_listings (
    id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id  UUID          REFERENCES users(id),
    apartment_id UUID          NOT NULL REFERENCES apartments(id),
    reason       report_reason NOT NULL,
    details      TEXT,
    is_resolved  BOOLEAN       DEFAULT FALSE,
    resolved_by  UUID          REFERENCES users(id),
    created_at   TIMESTAMP     DEFAULT NOW()
  )`,

  // Price flags
  `CREATE TABLE IF NOT EXISTS price_flags (
    id             UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    apartment_id   UUID      NOT NULL REFERENCES apartments(id),
    listed_price   INT       NOT NULL,
    area_avg_price INT       NOT NULL,
    deviation_pct  DECIMAL(5,2),
    flagged_at     TIMESTAMP DEFAULT NOW(),
    is_resolved    BOOLEAN   DEFAULT FALSE
  )`,

  // Refresh tokens
  `CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT      NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )`,

  `CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id)`,

  // Payments (Phase 2 scaffold)
  `CREATE TABLE IF NOT EXISTS payments (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        REFERENCES users(id),
    apartment_id UUID        REFERENCES apartments(id),
    amount_kes   INT         NOT NULL,
    mpesa_ref    VARCHAR(100),
    purpose      VARCHAR(50),
    status       VARCHAR(20) DEFAULT 'PENDING',
    created_at   TIMESTAMP   DEFAULT NOW()
  )`,
];

async function runMigrations() {
  try {
    await connectDB();
    console.log('\n🔄 Running migrations...\n');
    for (let i = 0; i < migrations.length; i++) {
      await query(migrations[i]);
      process.stdout.write(`   ${i + 1}/${migrations.length} done\r`);
    }
    console.log(`\n✅ All ${migrations.length} migrations completed\n`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    process.exit(1);
  }
}

runMigrations();