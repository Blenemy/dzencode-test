import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { corsOrigins, env, uploadsDir } from './config/env.js';
import { checkOrigin } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { catalogRouter } from './modules/catalog/catalog.routes.js';
import { docsRouter } from './modules/docs/docs.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { ordersRouter } from './modules/orders/orders.routes.js';
import { productsRouter } from './modules/products/products.routes.js';
import { statsRouter } from './modules/stats/stats.routes.js';
import { uploadsRouter } from './modules/uploads/uploads.routes.js';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', env.TRUST_PROXY);

  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(cookieParser());
  app.use(checkOrigin);
  app.use(express.json({ limit: '1mb' }));

  app.use('/api', healthRouter);
  app.use('/api', authRouter);
  app.use('/api', docsRouter);
  app.use('/api', ordersRouter);
  app.use('/api', productsRouter);
  app.use('/api', catalogRouter);
  app.use('/api', statsRouter);
  app.use('/api', uploadsRouter);

  app.use('/uploads', express.static(uploadsDir, { maxAge: '30d', immutable: true }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
