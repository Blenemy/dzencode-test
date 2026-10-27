import type { InventoryEventEnvelope } from './inventory.js';

export const SOCKET_PATH = '/api/socket.io';

export const SocketEvent = {
  SessionsCount: 'sessions:count',
  Inventory: 'inventory:event',
} as const;

export interface SessionsCountPayload {
  count: number;
}

export interface ServerToClientEvents {
  'sessions:count': (payload: SessionsCountPayload) => void;
  'inventory:event': (event: InventoryEventEnvelope) => void;
}

export type ClientToServerEvents = Record<string, never>;

export const SocketErrorCode = {
  Unauthorized: 'UNAUTHORIZED',
  TokenExpired: 'TOKEN_EXPIRED',
  TokenInvalid: 'TOKEN_INVALID',
} as const;
