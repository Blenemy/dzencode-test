import { createAction, type ListenerMiddlewareInstance } from '@reduxjs/toolkit';
import type { InventoryEventEnvelope } from '@dzen/shared';
import { api } from './api';

export const inventoryEventReceived = createAction<InventoryEventEnvelope>(
  'realtime/inventoryEventReceived',
);

const TAGS_BY_EVENT = {
  'order.created': ['Orders', 'Stats', 'Catalog'],
  'order.deleted': ['Orders', 'Products', 'Stats', 'Catalog'],
  'product.created': ['Orders', 'Products', 'Stats', 'Catalog'],
  'product.deleted': ['Orders', 'Products', 'Stats', 'Catalog'],
} as const;

export function listenToInventoryEvents(listener: ListenerMiddlewareInstance): void {
  listener.startListening({
    actionCreator: inventoryEventReceived,
    effect: (action, listenerApi) => {
      listenerApi.dispatch(api.util.invalidateTags([...TAGS_BY_EVENT[action.payload.name]]));
    },
  });
}
