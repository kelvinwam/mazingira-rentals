// tests/listings.test.js
const request = require('supertest');
const { app }   = require('../src/server');
const { query } = require('../src/database/connection');

const RUN            = Date.now().toString().slice(-7);
const LANDLORD_PHONE = `072${RUN}`;
const TENANT_PHONE   = `073${RUN}`;

let landlordToken = '';
let tenantToken   = '';
let listingId     = '';
let areaId        = '';

beforeAll(async () => {
  // Fetch a real area from the DB
  const area = await query('SELECT id FROM areas LIMIT 1');
  areaId = area.rows[0]?.id || '';

  const [lr, tr] = await Promise.all([
    request(app).post('/v1/auth/register').send({
      phone: LANDLORD_PHONE, password: 'Test1234!', role: 'LANDLORD', full_name: 'Test Landlord',
    }),
    request(app).post('/v1/auth/register').send({
      phone: TENANT_PHONE, password: 'Test1234!', role: 'TENANT', full_name: 'Test Tenant',
    }),
  ]);
  landlordToken = lr.body.data?.accessToken || '';
  tenantToken   = tr.body.data?.accessToken || '';
});

afterAll(async () => {
  if (listingId) {
    await query('DELETE FROM apartments WHERE id=$1', [listingId]).catch(() => {});
  }
  await query('DELETE FROM users WHERE phone IN ($1,$2)', [
    `+254${LANDLORD_PHONE.slice(1)}`,
    `+254${TENANT_PHONE.slice(1)}`,
  ]).catch(() => {});
});

// ── PUBLIC BROWSE ─────────────────────────────────────
describe('GET /v1/listings', () => {
  it('returns listings without auth', async () => {
    const r = await request(app).get('/v1/listings');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
  });

  it('respects limit param', async () => {
    const r = await request(app).get('/v1/listings?page=1&limit=3');
    expect(r.status).toBe(200);
    expect(r.body.data.length).toBeLessThanOrEqual(3);
  });

  it('filters by area slug', async () => {
    const r = await request(app).get('/v1/listings?area=machakos-cbd');
    expect(r.status).toBe(200);
  });

  it('filters by price range', async () => {
    const r = await request(app).get('/v1/listings?min_price=5000&max_price=30000');
    expect(r.status).toBe(200);
  });
});

// ── CREATE LISTING ────────────────────────────────────
describe('POST /v1/landlord/listings', () => {
  it('returns 401 without auth', async () => {
    const r = await request(app).post('/v1/landlord/listings').send({});
    expect(r.status).toBe(401);
  });

  it('returns 403 when tenant tries to create a listing', async () => {
    const r = await request(app).post('/v1/landlord/listings')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({ title: 'Test listing', price_kes: 5000 });
    expect(r.status).toBe(403);
  });

  it('rejects negative price', async () => {
    const r = await request(app).post('/v1/landlord/listings')
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({ title: 'Nice flat near town centre with security guard', description: 'A'.repeat(55), price_kes: -100, area_id: areaId, latitude: -1.5, longitude: 37.2 });
    expect(r.status).toBe(400);
  });

  it('rejects title shorter than 10 chars', async () => {
    const r = await request(app).post('/v1/landlord/listings')
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({ title: 'Short', description: 'A'.repeat(55), price_kes: 8000, area_id: areaId, latitude: -1.5, longitude: 37.2 });
    expect(r.status).toBe(400);
  });

  it('rejects description shorter than 50 chars', async () => {
    const r = await request(app).post('/v1/landlord/listings')
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({ title: 'Nice flat near town centre with security guard', description: 'Too short', price_kes: 8000, area_id: areaId, latitude: -1.5, longitude: 37.2 });
    expect(r.status).toBe(400);
  });

  it('creates listing successfully with valid data', async () => {
    if (!areaId || !landlordToken) return;
    const r = await request(app).post('/v1/landlord/listings')
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({
        title:       'Spacious 2BR apartment near Machakos CBD test',
        description: 'Beautiful two bedroom apartment with modern finishes, ample parking, borehole water and 24hr security. Close to schools and shops.',
        price_kes:   18000,
        deposit_kes: 18000,
        bedrooms:    2,
        bathrooms:   1,
        area_id:     areaId,
        latitude:    -1.5177,
        longitude:   37.2634,
      });
    expect(r.status).toBe(201);
    expect(r.body.success).toBe(true);
    expect(r.body.data).toHaveProperty('id');
    listingId = r.body.data.id;
  });
});

// ── GET SINGLE LISTING ────────────────────────────────
describe('GET /v1/listings/:id', () => {
  it('returns 404 for non-existent UUID', async () => {
    const r = await request(app).get('/v1/listings/00000000-0000-0000-0000-000000000000');
    expect(r.status).toBe(404);
  });
});

// ── SEARCH ────────────────────────────────────────────
describe('GET /v1/search', () => {
  it('returns array for keyword search', async () => {
    const r = await request(app).get('/v1/search?q=apartment');
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
  });

  it('returns suggestions for autocomplete', async () => {
    const r = await request(app).get('/v1/search/suggest?q=mach');
    expect(r.status).toBe(200);
  });
});

// ── LANDLORD STATS ────────────────────────────────────
describe('GET /v1/landlord/stats', () => {
  it('returns stats object for authenticated landlord', async () => {
    const r = await request(app).get('/v1/landlord/stats')
      .set('Authorization', `Bearer ${landlordToken}`);
    expect(r.status).toBe(200);
    expect(r.body.data).toHaveProperty('listings');
    expect(r.body.data).toHaveProperty('views');
    expect(r.body.data).toHaveProperty('inquiries');
  });

  it('returns 401 without token', async () => {
    const r = await request(app).get('/v1/landlord/stats');
    expect(r.status).toBe(401);
  });
});
