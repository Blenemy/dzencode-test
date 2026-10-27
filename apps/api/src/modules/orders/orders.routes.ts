import { Router } from 'express';
import { createOrderSchema, idParamSchema } from '@dzen/shared';
import { ordersService } from '../../lib/container.js';
import { parseOrThrow } from '../../lib/parse.js';
import { currentUser, requireAuth } from '../../middleware/auth.js';

export const ordersRouter: Router = Router();

ordersRouter.get('/orders', requireAuth, async (_req, res) => {
  res.json(await ordersService.list());
});

ordersRouter.get('/orders/:id', requireAuth, async (req, res) => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  res.json(await ordersService.get(id));
});

ordersRouter.post('/orders', requireAuth, async (req, res) => {
  const input = parseOrThrow(createOrderSchema, req.body);
  res.status(201).json(await ordersService.create(input, currentUser(req).id));
});

ordersRouter.delete('/orders/:id', requireAuth, async (req, res) => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  await ordersService.remove(id, currentUser(req).id);
  res.status(204).end();
});
