import { Router } from 'express';
import { specificationQuerySchema } from '@dzen/shared';
import { catalogService } from '../../lib/container.js';
import { parseOrThrow } from '../../lib/parse.js';
import { requireAuth } from '../../middleware/auth.js';

export const catalogRouter: Router = Router();

catalogRouter.get('/product-types', requireAuth, async (_req, res) => {
  res.json(await catalogService.productTypes());
});

catalogRouter.get('/specifications', requireAuth, async (req, res) => {
  const { typeId } = parseOrThrow(specificationQuerySchema, req.query);
  res.json(await catalogService.specifications(typeId));
});

catalogRouter.get('/groups', requireAuth, async (_req, res) => {
  res.json(await catalogService.groups());
});

catalogRouter.get('/users', requireAuth, async (_req, res) => {
  res.json(await catalogService.users());
});

catalogRouter.get('/warehouses', requireAuth, async (_req, res) => {
  res.json(await catalogService.warehouses());
});
