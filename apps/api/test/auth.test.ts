import request from 'supertest';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';
import { disconnectDb, prisma } from '../src/lib/prisma.js';
import { REUSE_WINDOW_MS } from '../src/modules/auth/auth.service.js';
import { cookieValue, readCookies, resetDatabase } from './helpers.js';
import { TEST_ORIGIN } from './test-env.js';

const app = createApp();

const credentials = {
  name: 'Тестовый Пользователь',
  email: 'tester@example.com',
  password: 'password123',
};

function post(path: string) {
  return request(app).post(path).set('Origin', TEST_ORIGIN);
}

function register(body: object = credentials) {
  return post('/api/auth/register').send(body);
}

function refreshWith(token: string) {
  return post('/api/auth/refresh').set('Cookie', `refresh_token=${token}`);
}

beforeEach(resetDatabase);

afterEach(() => {
  vi.useRealTimers();
});

afterAll(async () => {
  await resetDatabase();
  await disconnectDb();
});

describe('POST /api/auth/register', () => {
  it('creates a user and sets both auth cookies', async () => {
    const res = await register({ ...credentials, email: '  Tester@Example.COM ' });

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({
      id: expect.any(Number),
      email: 'tester@example.com',
      name: credentials.name,
      role: 'USER',
      avatar: null,
    });

    const cookies = readCookies(res);
    expect(cookies.get('access_token')?.attributes).toMatchObject({ path: '/', httponly: true });
    expect(cookies.get('refresh_token')?.attributes).toMatchObject({
      path: '/api/auth',
      httponly: true,
    });
    expect(cookies.get('has_session')?.value).toBe('1');
    expect(cookies.get('has_session')?.attributes['httponly']).toBeUndefined();

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: credentials.email } });
    expect(stored.passwordHash).toMatch(/^\$argon2id\$/);
  });

  it('rejects a duplicate email', async () => {
    await register();
    const res = await register();

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('reports every invalid field', async () => {
    const res = await register({ name: ' ', email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    const fields = res.body.error.details.issues.map((issue: { field: string }) => issue.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await register();
  });

  it('signs in with valid credentials', async () => {
    const res = await post('/api/auth/login').send({
      email: credentials.email,
      password: credentials.password,
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
    expect(cookieValue(res, 'access_token')).toBeTruthy();
    expect(cookieValue(res, 'refresh_token')).toBeTruthy();
  });

  it('answers the same way for a wrong password and an unknown email', async () => {
    const wrongPassword = await post('/api/auth/login').send({
      email: credentials.email,
      password: 'wrong-password',
    });
    const unknownEmail = await post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: credentials.password,
    });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(unknownEmail.body.error).toEqual(wrongPassword.body.error);
  });

  it('refuses a disabled account', async () => {
    await prisma.user.update({ where: { email: credentials.email }, data: { isActive: false } });

    const res = await post('/api/auth/login').send({
      email: credentials.email,
      password: credentials.password,
    });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('USER_INACTIVE');
  });

  it('rejects requests from a foreign origin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'https://evil.example')
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('BAD_ORIGIN');
  });
});

describe('GET /api/auth/me', () => {
  it('requires an access token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects a forged token', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'access_token=forged');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('TOKEN_INVALID');
  });

  it('returns the current user', async () => {
    const access = cookieValue(await register(), 'access_token');
    const res = await request(app).get('/api/auth/me').set('Cookie', `access_token=${access}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
  });
});

describe('PATCH /api/auth/me', () => {
  it('updates the name and avatar and rejects foreign avatar paths', async () => {
    const access = cookieValue(await register(), 'access_token');
    const patch = (body: object) =>
      request(app)
        .patch('/api/auth/me')
        .set('Origin', TEST_ORIGIN)
        .set('Cookie', `access_token=${access}`)
        .send(body);

    const res = await patch({ name: '  Новое Имя ', avatar: '/uploads/face.webp' });
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ name: 'Новое Имя', avatar: '/uploads/face.webp' });

    const invalid = await patch({ name: 'Имя', avatar: 'https://evil.example/x.png' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.details.issues).toEqual([
      { field: 'avatar', message: 'validation.photo' },
    ]);
  });
});

describe('DELETE /api/auth/sessions', () => {
  it('revokes every refresh token of the user', async () => {
    const first = await register();
    const access = cookieValue(first, 'access_token');
    const firstRefresh = cookieValue(first, 'refresh_token');
    const secondRefresh = cookieValue(
      await post('/api/auth/login').send({
        email: credentials.email,
        password: credentials.password,
      }),
      'refresh_token',
    );

    const res = await request(app)
      .delete('/api/auth/sessions')
      .set('Origin', TEST_ORIGIN)
      .set('Cookie', `access_token=${access}`);
    expect(res.status).toBe(200);
    expect(readCookies(res).get('refresh_token')?.value).toBe('');

    expect((await refreshWith(firstRefresh)).status).toBe(401);
    expect((await refreshWith(secondRefresh)).status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('rotates the refresh token', async () => {
    const first = cookieValue(await register(), 'refresh_token');

    const res = await refreshWith(first);

    expect(res.status).toBe(200);
    const second = cookieValue(res, 'refresh_token');
    expect(second).not.toBe(first);

    const rows = await prisma.refreshToken.findMany({ orderBy: { id: 'asc' } });
    expect(rows).toHaveLength(2);
    expect(rows[0]?.revokedAt).not.toBeNull();
    expect(rows[0]?.replacedById).toBe(rows[1]?.id);
    expect(rows[0]?.familyId).toBe(rows[1]?.familyId);
    expect(rows[1]?.revokedAt).toBeNull();
  });

  it('gives a second tab the same session inside the reuse window', async () => {
    const first = cookieValue(await register(), 'refresh_token');

    const tabA = await refreshWith(first);
    const tabB = await refreshWith(first);

    expect(tabA.status).toBe(200);
    expect(tabB.status).toBe(200);
    expect(cookieValue(tabB, 'refresh_token')).toBe(cookieValue(tabA, 'refresh_token'));
  });

  it('revokes the whole family when an old token is replayed later', async () => {
    const first = cookieValue(await register(), 'refresh_token');
    const second = cookieValue(await refreshWith(first), 'refresh_token');

    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.now() + REUSE_WINDOW_MS + 5_000);

    const replay = await refreshWith(first);
    expect(replay.status).toBe(401);
    expect(replay.body.error.code).toBe('TOKEN_REUSED');

    const victim = await refreshWith(second);
    expect(victim.status).toBe(401);

    const alive = await prisma.refreshToken.count({ where: { revokedAt: null } });
    expect(alive).toBe(0);
  });

  it('clears cookies when there is no refresh token', async () => {
    const res = await post('/api/auth/refresh');

    expect(res.status).toBe(401);
    expect(readCookies(res).get('refresh_token')?.value).toBe('');
  });
});

describe('POST /api/auth/logout', () => {
  it('revokes the refresh token and clears cookies', async () => {
    const refresh = cookieValue(await register(), 'refresh_token');

    const res = await post('/api/auth/logout').set('Cookie', `refresh_token=${refresh}`);
    expect(res.status).toBe(200);
    expect(readCookies(res).get('access_token')?.value).toBe('');

    const after = await refreshWith(refresh);
    expect(after.status).toBe(401);
  });
});
