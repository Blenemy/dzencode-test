import { Router } from 'express';
import { statsService } from '../../lib/container.js';
import { requireAuth } from '../../middleware/auth.js';

export const statsRouter: Router = Router();

statsRouter.get('/stats', requireAuth, async (_req, res) => {
  res.json(await statsService.overview());
});
