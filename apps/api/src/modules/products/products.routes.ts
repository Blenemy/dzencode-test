import { Router } from 'express';
import { createProductSchema, idParamSchema, productQuerySchema } from '@dzen/shared';
import { productsService } from '../../lib/container.js';
import { parseOrThrow } from '../../lib/parse.js';
import { currentUser, requireAuth } from '../../middleware/auth.js';

export const productsRouter: Router = Router();

productsRouter.get('/products', requireAuth, async (req, res) => {
  const query = parseOrThrow(productQuerySchema, req.query);
  res.json(await productsService.list(query));
});

productsRouter.get('/products/:id', requireAuth, async (req, res) => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  res.json(await productsService.get(id));
});

productsRouter.post('/products', requireAuth, async (req, res) => {
  const input = parseOrThrow(createProductSchema, req.body);
  res.status(201).json(await productsService.create(input, currentUser(req).id));
});

productsRouter.delete('/products/:id', requireAuth, async (req, res) => {
  const { id } = parseOrThrow(idParamSchema, req.params);
  await productsService.remove(id, currentUser(req).id);
  res.status(204).end();
});
