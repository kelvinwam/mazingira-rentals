// tests/payments.test.js
const request = require('supertest');
const { app }   = require('../src/server');
const { query } = require('../src/database/connection');

const RUN   = Date.now().toString().slice(-7);
const PHONE = `074${RUN}`;

let landlordToken = '';
let apartmentId   = '';
let paymentId     = '';

beforeAll(async () => {
  const area = await query('SELECT id FROM areas LIMIT 1');
  const areaId = area.rows[0]?.id || '';

  const lr = await request(app).post('/v1/auth/register').send({
    phone: PHONE, password: 'Test1234!', role: 'LANDLORD', full_name: 'Payment Test Landlord',
  });
  landlordToken = lr.body.data?.accessToken || '';

  if (!areaId || !landlordToken) return;

  const listing = await request(app).post('/v1/landlord/listings')
    .set('Authorization', `Bearer ${landlordToken}`)
    .send({
      title:       'Payment test apartment near Machakos bus station',
      description: 'Clean one bedroom apartment suitable for a working professional, with water and electricity included.',
      price_kes:   12000,
      area_id:     areaId,
      latitude:    -1.5177,
      longitude:   37.2634,
    });
  apartmentId = listing.body.data?.id || '';

  // Activate it so boost can be applied
  if (apartmentId) {
    await query(`UPDATE apartments SET status='ACTIVE' WHERE id=$1`, [apartmentId]).catch(() => {});
  }
});

afterAll(async () => {
  if (apartmentId) {
    await query('DELETE FROM boost_payments WHERE apartment_id=$1', [apartmentId]).catch(() => {});
    await query('DELETE FROM apartments WHERE id=$1', [apartmentId]).catch(() => {});
  }
  await query('DELETE FROM users WHERE phone=$1', [`+254${PHONE.slice(1)}`]).catch(() => {});
});

// ── PACKAGES ──────────────────────────────────────────
describe('GET /v1/payments/packages', () => {
  it('returns 401 without auth', async () => {
    const r = await request(app).get('/v1/payments/packages');
    expect(r.status).toBe(401);
  });

  it('returns array of packages with days and amount fields', async () => {
    const r = await request(app).get('/v1/payments/packages')
      .set('Authorization', `Bearer ${landlordToken}`);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
    expect(r.body.data.length).toBeGreaterThan(0);
    expect(r.body.data[0]).toHaveProperty('days');
    expect(r.body.data[0]).toHaveProperty('amount');
  });
});

// ── INITIATE BOOST ────────────────────────────────────
describe('POST /v1/payments/boost', () => {
  it('rejects request missing days', async () => {
    if (!apartmentId) return;
    const r = await request(app).post('/v1/payments/boost')
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({ apartment_id: apartmentId, phone: '0712345678' });
    expect(r.status).toBe(400);
  });

  it('rejects invalid package (days not in [7,14,30])', async () => {
    if (!apartmentId) return;
    const r = await request(app).post('/v1/payments/boost')
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({ apartment_id: apartmentId, days: 999, phone: '0712345678' });
    expect(r.status).toBe(400);
  });

  it('rejects invalid phone number', async () => {
    if (!apartmentId) return;
    const r = await request(app).post('/v1/payments/boost')
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({ apartment_id: apartmentId, days: 7, phone: '0123456789' });
    expect(r.status).toBe(400);
  });

  it('initiates a boost and returns payment_id', async () => {
    if (!apartmentId) return;
    const r = await request(app).post('/v1/payments/boost')
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({ apartment_id: apartmentId, days: 7, phone: '0712345678' });
    expect(r.status).toBe(200);
    expect(r.body.data).toHaveProperty('payment_id');
    paymentId = r.body.data.payment_id;
  });
});

// ── CONFIRM PAYMENT ───────────────────────────────────
describe('POST /v1/payments/:id/confirm', () => {
  it('rejects missing mpesa code', async () => {
    if (!paymentId) return;
    const r = await request(app).post(`/v1/payments/${paymentId}/confirm`)
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({});
    expect(r.status).toBe(400);
  });

  it('activates boost with valid mpesa code', async () => {
    if (!paymentId || !apartmentId) return;
    const r = await request(app).post(`/v1/payments/${paymentId}/confirm`)
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({ mpesa_code: `TEST${RUN}` });
    expect(r.status).toBe(200);
    expect(r.body.success).toBe(true);

    // Verify boost was actually set on the apartment row
    const apt = await query('SELECT is_boosted FROM apartments WHERE id=$1', [apartmentId]);
    expect(apt.rows[0]?.is_boosted).toBe(true);
  });
});

// ── PAYMENT HISTORY ───────────────────────────────────
describe('GET /v1/payments/history', () => {
  it('returns landlord payment history', async () => {
    const r = await request(app).get('/v1/payments/history')
      .set('Authorization', `Bearer ${landlordToken}`);
    expect(r.status).toBe(200);
    expect(Array.isArray(r.body.data)).toBe(true);
  });
});
