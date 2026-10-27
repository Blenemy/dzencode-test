import { logger } from '../lib/logger.js';
import type { EventBus } from './bus.js';

export function registerAuditLog(bus: EventBus): () => void {
  const log = logger.child({ service: 'audit' });

  return bus.subscribeAll((event) => {
    log.info({ event: event.name, actorId: event.actorId }, 'domain event');
  });
}
