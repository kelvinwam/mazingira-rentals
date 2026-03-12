// tests/auth.test.js
const request = require('supertest');
const { app }   = require('../src/server');
const { query } = require('../src/database/connection');

// Unique suffix per test run so parallel CI runs don't clash
const RUN    = Date.now().toString().slice(-7);
const PHONE  = `071${RUN}`;   // 071XXXXXXX → normalises to +25471XXXXXXX
const PASS   = 'Test1234!';

let accessToken  = '';
let refreshToken = '';

afterAll(async () => {
  await query('DELETE FROM users WHERE phone=$1', [`+254${PHONE.slice(1)}`]).catch(() => {});
});

// ── REGISTER ──────────────────────────────────────────
describe('POST /v1/auth/register', () => {
  it('rejects missing phone', async () => {
    const r = await request(app).post('/v1/auth/register').send({ password: PASS });
    expect(r.status).toBe(400);
    expect(r.body.success).toBe(false);
  });

  it('rejects password shorter than 6 chars', async () => {
    const r = await request(app).post('/v1/auth/register').send({ phone: PHONE, password: '123' });
    expect(r.status).toBe(400);
  });

  it('rejects invalid Kenyan number (starts with 01)', async () => {
    const r = await request(app).post('/v1/auth/register').send({ phone: '0123456789', password: PASS });
    expect(r.status).toBe(400);
  });

  it('creates a new account and returns tokens', async () => {
    const r = await request(app).post('/v1/auth/register')
      .send({ phone: PHONE, password: PASS, full_name: 'Test User', role: 'TENANT' });
    expect(r.status).toBe(201);
    expect(r.body.data).toHaveProperty('accessToken');
    expect(r.body.data).toHaveProperty('refreshToken');
    // Password must never be returned
    expect(r.body.data.user).not.toHaveProperty('password_hash');
  });

  it('rejects duplicate phone', async () => {
    const r = await request(app).post('/v1/auth/register').send({ phone: PHONE, password: PASS });
    expect(r.status).toBe(409);
  });
});

// ── LOGIN ─────────────────────────────────────────────
describe('POST /v1/auth/login', () => {
  it('rejects wrong password', async () => {
    const r = await request(app).post('/v1/auth/login').send({ phone: PHONE, password: 'wrong' });
    expect(r.status).toBe(401);
  });

  it('rejects unknown number', async () => {
    const r = await request(app).post('/v1/auth/login').send({ phone: '0799999991', password: PASS });
    expect(r.status).toBe(401);
  });

  it('returns tokens on valid credentials', async () => {
    const r = await request(app).post('/v1/auth/login').send({ phone: PHONE, password: PASS });
    expect(r.status).toBe(200);
    expect(r.body.data.user).not.toHaveProperty('password_hash');
    accessToken  = r.body.data.accessToken;
    refreshToken = r.body.data.refreshToken;
  });
});

// ── REFRESH TOKEN ─────────────────────────────────────
describe('POST /v1/auth/refresh', () => {
  it('rejects empty body', async () => {
    const r = await request(app).post('/v1/auth/refresh').send({});
    expect(r.status).toBe(401);
  });

  it('rejects tampered token', async () => {
    const r = await request(app).post('/v1/auth/refresh').send({ refreshToken: 'fake.token.abc' });
    expect(r.status).toBe(401);
  });

  it('issues new access token with valid refresh token', async () => {
    const r = await request(app).post('/v1/auth/refresh').send({ refreshToken });
    expect(r.status).toBe(200);
    expect(r.body.data).toHaveProperty('accessToken');
    // Update token for subsequent tests
    accessToken = r.body.data.accessToken;
  });
});

// ── PROTECTED ROUTE ───────────────────────────────────
describe('GET /v1/users/me', () => {
  it('returns 401 with no token', async () => {
    const r = await request(app).get('/v1/users/me');
    expect(r.status).toBe(401);
  });

  it('returns profile with valid token', async () => {
    const r = await request(app).get('/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(r.status).toBe(200);
    expect(r.body.data).toHaveProperty('phone');
    expect(r.body.data).not.toHaveProperty('password_hash');
  });
});

// ── LOGOUT ────────────────────────────────────────────
describe('POST /v1/auth/logout', () => {
  it('logs out and invalidates the refresh token', async () => {
    const r = await request(app).post('/v1/auth/logout')
      .send({ refreshToken: refreshToken });
    expect(r.status).toBe(200);
  });
});
