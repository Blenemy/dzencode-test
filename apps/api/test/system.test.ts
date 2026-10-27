import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { disconnectDb } from '../src/lib/prisma.js';

const app = createApp();

afterAll(disconnectDb);

describe('system endpoints', () => {
  it('reports health with a live MySQL connection', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', checks: { mysql: { ok: true } } });
  });

  it('serves the OpenAPI spec with auth endpoints', async () => {
    const res = await request(app).get('/api/openapi.json');

    expect(res.status).toBe(200);
    expect(Object.keys(res.body.paths)).toEqual(
      expect.arrayContaining(['/health', '/auth/login', '/auth/register', '/auth/me']),
    );
  });

  it('answers unknown routes with a JSON 404', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
