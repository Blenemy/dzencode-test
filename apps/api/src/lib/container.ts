import { prisma, disconnectDb } from './prisma.js';
import { tokenHelper } from './tokens.js';
import { env, uploadsDir } from '../config/env.js';
import { registerAuditLog } from '../events/audit.subscriber.js';
import { EventBus } from '../events/bus.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { CatalogService } from '../modules/catalog/catalog.service.js';
import { HealthService } from '../modules/health/health.service.js';
import { OrdersService } from '../modules/orders/orders.service.js';
import { ProductsService } from '../modules/products/products.service.js';
import { StatsService } from '../modules/stats/stats.service.js';
import { UploadsService } from '../modules/uploads/uploads.service.js';

export const eventBus = new EventBus();
registerAuditLog(eventBus);

export const healthService = new HealthService(prisma, env.APP_VERSION);
export const authService = new AuthService(prisma, tokenHelper);
export const ordersService = new OrdersService(prisma, eventBus);
export const productsService = new ProductsService(prisma, eventBus);
export const catalogService = new CatalogService(prisma);
export const statsService = new StatsService(prisma);
export const uploadsService = new UploadsService(uploadsDir);

export async function disconnectApi(): Promise<void> {
  await disconnectDb();
}
