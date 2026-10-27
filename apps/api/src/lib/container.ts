import { prisma, disconnectDb } from './prisma.js';
import { env } from '../config/env.js';
import { HealthService } from '../modules/health/health.service.js';

export const healthService = new HealthService(prisma, env.APP_VERSION);

export async function disconnectApi(): Promise<void> {
  await disconnectDb();
}
