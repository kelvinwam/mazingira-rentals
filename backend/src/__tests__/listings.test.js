/**
 * Tests for the listings verification workflow.
 * Uses in-memory mock pool to avoid needing a live PostgreSQL instance.
 */

jest.mock('../db/pool');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

process.env.JWT_SECRET = 'test_secret';
process.env.DATABASE_URL = 'postgresql://test';

const app = require('../app');

const makeToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, 'test_secret', { expiresIn: '1h' });

const landlordToken = makeToken({ id: 2, email: 'landlord@test.com', role: 'landlord' });
const adminToken = makeToken({ id: 1, email: 'admin@test.com', role: 'admin' });
const tenantToken = makeToken({ id: 3, email: 'tenant@test.com', role: 'tenant' });

beforeEach(() => {
  pool.query.mockReset();
});

const samplePendingListing = {
  id: 10,
  landlord_id: 2,
  title: 'Cozy Apartment',
  description: 'A nice place',
  price: 12000,
  location: 'Machakos Town',
  bedrooms: 2,
  bathrooms: 1,
  amenities: 'WiFi, Parking',
  image_url: null,
  status: 'pending',
  verified_at: null,
  created_at: new Date().toISOString(),
};

const sampleVerifiedListing = { ...samplePendingListing, id: 11, status: 'verified', verified_at: new Date().toISOString() };

describe('Health check', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Public listings endpoint', () => {
  beforeEach(() => {
    pool.query.mockResolvedValue({ rows: [sampleVerifiedListing] });
  });

  it('GET /api/listings returns verified listings', async () => {
    const res = await request(app).get('/api/listings');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/listings/:id returns a verified listing', async () => {
    pool.query.mockResolvedValueOnce({ rows: [sampleVerifiedListing] });
    const res = await request(app).get('/api/listings/11');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('verified');
  });

  it('GET /api/listings/:id returns 404 for non-existent listing', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).get('/api/listings/999');
    expect(res.status).toBe(404);
  });
});

describe('Landlord listing creation', () => {
  it('POST /api/listings requires authentication', async () => {
    const res = await request(app).post('/api/listings').send({ title: 'Test' });
    expect(res.status).toBe(401);
  });

  it('POST /api/listings forbidden for tenant', async () => {
    const res = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${tenantToken}`)
      .send({ title: 'Test' });
    expect(res.status).toBe(403);
  });

  it('POST /api/listings creates a pending listing for landlord', async () => {
    pool.query.mockResolvedValueOnce({ rows: [samplePendingListing] });
    const res = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({
        title: 'Cozy Apartment',
        description: 'A nice place',
        price: 12000,
        location: 'Machakos Town',
        bedrooms: 2,
        bathrooms: 1,
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
  });

  it('POST /api/listings returns 400 for missing required fields', async () => {
    const res = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({ title: '', price: -5 });
    expect(res.status).toBe(400);
  });
});

describe('Landlord: view own listings', () => {
  it('GET /api/listings/landlord/my-listings returns all statuses for landlord', async () => {
    pool.query.mockResolvedValueOnce({ rows: [samplePendingListing, sampleVerifiedListing] });
    const res = await request(app)
      .get('/api/listings/landlord/my-listings')
      .set('Authorization', `Bearer ${landlordToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('GET /api/listings/landlord/my-listings forbidden for tenant', async () => {
    const res = await request(app)
      .get('/api/listings/landlord/my-listings')
      .set('Authorization', `Bearer ${tenantToken}`);
    expect(res.status).toBe(403);
  });
});

describe('Admin: view all listings', () => {
  it('GET /api/listings/admin/all requires admin role', async () => {
    const res = await request(app)
      .get('/api/listings/admin/all')
      .set('Authorization', `Bearer ${landlordToken}`);
    expect(res.status).toBe(403);
  });

  it('GET /api/listings/admin/all returns all listings for admin', async () => {
    pool.query.mockResolvedValueOnce({ rows: [samplePendingListing, sampleVerifiedListing] });
    const res = await request(app)
      .get('/api/listings/admin/all')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });
});

describe('Admin: verify listing', () => {
  it('PATCH /api/listings/admin/:id/verify verifies a listing', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [samplePendingListing] }) // select listing
      .mockResolvedValueOnce({ rows: [{ ...samplePendingListing, status: 'verified', verified_at: new Date().toISOString() }] }) // update listing
      .mockResolvedValueOnce({ rows: [] }); // insert log

    const res = await request(app)
      .patch('/api/listings/admin/10/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notes: 'Verified via phone call' });

    expect(res.status).toBe(200);
    expect(res.body.listing.status).toBe('verified');
    expect(res.body.message).toMatch(/verified/i);
  });

  it('PATCH /api/listings/admin/:id/verify returns 404 for missing listing', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .patch('/api/listings/admin/999/verify')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
  });

  it('PATCH /api/listings/admin/:id/verify requires admin role', async () => {
    const res = await request(app)
      .patch('/api/listings/admin/10/verify')
      .set('Authorization', `Bearer ${landlordToken}`);
    expect(res.status).toBe(403);
  });
});

describe('Admin: reject listing', () => {
  it('PATCH /api/listings/admin/:id/reject rejects a listing', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [samplePendingListing] })
      .mockResolvedValueOnce({ rows: [{ ...samplePendingListing, status: 'rejected' }] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .patch('/api/listings/admin/10/reject')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notes: 'Could not verify property' });

    expect(res.status).toBe(200);
    expect(res.body.listing.status).toBe('rejected');
    expect(res.body.message).toMatch(/rejected/i);
  });
});

describe('Admin: verification logs', () => {
  it('GET /api/listings/admin/:id/logs returns verification history', async () => {
    pool.query.mockResolvedValueOnce({
      rows: [
        { id: 1, listing_id: 10, admin_id: 1, action: 'verified', notes: 'Verified via phone', created_at: new Date().toISOString(), admin_name: 'Admin User' },
      ],
    });

    const res = await request(app)
      .get('/api/listings/admin/10/logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body[0].action).toBe('verified');
  });
});

describe('Landlord: delete own listing', () => {
  it('DELETE /api/listings/:id deletes landlord own listing', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 10 }] });
    const res = await request(app)
      .delete('/api/listings/10')
      .set('Authorization', `Bearer ${landlordToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it('DELETE /api/listings/:id returns 404 if not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .delete('/api/listings/999')
      .set('Authorization', `Bearer ${landlordToken}`);
    expect(res.status).toBe(404);
  });
});
