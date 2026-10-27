import { prisma, disconnectDb } from './prisma.js';
import { tokenHelper } from './tokens.js';
import { env } from '../config/env.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { HealthService } from '../modules/health/health.service.js';

export const healthService = new HealthService(prisma, env.APP_VERSION);
export const authService = new AuthService(prisma, tokenHelper);

export async function disconnectApi(): Promise<void> {
  await disconnectDb();
}
