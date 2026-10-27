import os from 'node:os';
import path from 'node:path';

export const TEST_ORIGIN = 'http://localhost:3000';

export const testEnv = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'fatal',
  DATABASE_URL:
    process.env.TEST_DATABASE_URL ??
    'mysql://root:root-dev-password@127.0.0.1:3307/inventory_test?allowPublicKeyRetrieval=true',
  CORS_ORIGIN: TEST_ORIGIN,
  TRUST_PROXY: '0',
  JWT_ACCESS_SECRET: 'test-access-secret-0123456789abcdef0123',
  JWT_REFRESH_SECRET: 'test-refresh-secret-0123456789abcdef012',
  JWT_ACCESS_TTL: '900',
  JWT_REFRESH_TTL: '2592000',
  COOKIE_SECURE: 'false',
  UPLOADS_DIR: path.join(os.tmpdir(), 'dzen-inventory-test-uploads'),
};
