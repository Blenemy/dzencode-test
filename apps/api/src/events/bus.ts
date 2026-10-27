import { EventEmitter } from 'node:events';
import type {
  InventoryEventEnvelope,
  InventoryEventName,
  InventoryEventPayloads,
} from '@dzen/shared';
import { logger } from '../lib/logger.js';

const ANY_EVENT = '*';

type Handler<K extends InventoryEventName> = (event: InventoryEventEnvelope<K>) => void;

export class EventBus {
  private readonly emitter = new EventEmitter();
  private readonly log = logger.child({ service: 'events' });

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  publish<K extends InventoryEventName>(
    name: K,
    payload: InventoryEventPayloads[K],
    actorId: number | null,
  ): InventoryEventEnvelope<K> {
    const event: InventoryEventEnvelope<K> = {
      name,
      payload,
      actorId,
      occurredAt: new Date().toISOString(),
    };
    this.emitter.emit(name, event);
    this.emitter.emit(ANY_EVENT, event);
    return event;
  }

  subscribe<K extends InventoryEventName>(name: K, handler: Handler<K>): () => void {
    return this.listen(name, handler);
  }

  subscribeAll(handler: (event: InventoryEventEnvelope) => void): () => void {
    return this.listen(ANY_EVENT, handler);
  }

  private listen<E>(channel: string, handler: (event: E) => void): () => void {
    const guarded = (event: E) => {
      try {
        handler(event);
      } catch (err) {
        this.log.error({ err, channel }, 'event handler failed');
      }
    };
    this.emitter.on(channel, guarded);
    return () => {
      this.emitter.off(channel, guarded);
    };
  }
}
