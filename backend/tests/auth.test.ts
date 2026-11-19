import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Admin } from '../src/models/Admin';
import { ADMIN, app, loggedInAgent, resetDb, startDb, stopDb } from './helpers';

beforeAll(startDb);
afterAll(stopDb);
beforeEach(resetDb);

describe('auth', () => {
  it('logs in with valid credentials and sets an HttpOnly cookie, never returning the hash', async () => {
    const agent = await loggedInAgent();
    const res = await agent.get('/api/auth/me').expect(200);
    expect(res.body.data.admin.email).toBe(ADMIN.email);
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/);

    const raw = await request(app).post('/api/auth/login').send({ email: ADMIN.email, password: ADMIN.password });
    const cookie = String(raw.headers['set-cookie']);
    expect(cookie).toMatch(/dt_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
  });

  it('stores only a bcrypt hash', async () => {
    await loggedInAgent();
    const admin = await Admin.findOne({ email: ADMIN.email }).select('+passwordHash').lean();
    expect(admin?.passwordHash).toMatch(/^\$2[aby]\$12\$/);
    expect(admin?.passwordHash).not.toContain(ADMIN.password);
  });

  it('rejects wrong password and unknown email with the same 401 message', async () => {
    await loggedInAgent();
    const bad = await request(app).post('/api/auth/login').send({ email: ADMIN.email, password: 'wrong-password' });
    const unknown = await request(app).post('/api/auth/login').send({ email: 'nobody@test.dev', password: 'whatever-123' });
    expect(bad.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(bad.body.message).toBe(unknown.body.message);
  });

  it('validates the login body', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('blocks protected endpoints without a session', async () => {
    for (const path of ['/api/doctors', '/api/patients', '/api/dashboard/overview', '/api/auth/me']) {
      const res = await request(app).get(path);
      expect(res.status, path).toBe(401);
      expect(res.body.success).toBe(false);
    }
  });

  it('rejects a tampered token', async () => {
    const res = await request(app).get('/api/doctors').set('Cookie', 'dt_session=abc.def.ghi');
    expect(res.status).toBe(401);
  });

  it('logout clears the session', async () => {
    const agent = await loggedInAgent();
    await agent.post('/api/auth/logout').expect(200);
    await agent.get('/api/auth/me').expect(401);
  });

  it('rejects state-changing requests from a foreign Origin', async () => {
    const agent = await loggedInAgent();
    const res = await agent.post('/api/doctors').set('Origin', 'https://evil.example').send({});
    expect(res.status).toBe(403);
  });

  it('exposes a public health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });
});
