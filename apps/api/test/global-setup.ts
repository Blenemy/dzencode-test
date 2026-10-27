import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { testEnv } from './test-env.js';

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export default function setup(): void {
  execSync('npx prisma migrate deploy', {
    cwd: apiRoot,
    env: { ...process.env, ...testEnv, PRISMA_HIDE_UPDATE_MESSAGE: '1' },
    stdio: 'pipe',
  });
}
