import type { Server as HttpServer } from 'node:http';
import { parseCookie } from 'cookie';
import { Server, type Socket } from 'socket.io';
import {
  SOCKET_PATH,
  SocketErrorCode,
  SocketEvent,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from '@dzen/shared';
import type { EventBus } from '../events/bus.js';
import { logger } from '../lib/logger.js';
import { ACCESS_COOKIE, type TokenHelper } from '../lib/tokens.js';
import { AppError } from '../middleware/error.js';

interface SocketData {
  userId: number;
}

export type RealtimeServer = Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>;
type RealtimeSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>;

export interface RealtimeOptions {
  tokens: TokenHelper;
  events: EventBus;
  allowedOrigins: string[];
}

function rejection(code: string): Error & { data: { code: string } } {
  return Object.assign(new Error(code), { data: { code } });
}

export function createRealtimeServer(httpServer: HttpServer, options: RealtimeOptions) {
  const log = logger.child({ service: 'realtime' });

  const io: RealtimeServer = new Server(httpServer, {
    path: SOCKET_PATH,
    serveClient: false,
    cors: { origin: options.allowedOrigins, credentials: true },
    allowRequest: (req, callback) => {
      const origin = req.headers.origin;
      callback(null, !origin || options.allowedOrigins.includes(origin));
    },
  });

  io.use((socket: RealtimeSocket, next) => {
    const token = parseCookie(socket.handshake.headers.cookie ?? '')[ACCESS_COOKIE];
    if (!token) return next(rejection(SocketErrorCode.Unauthorized));

    try {
      socket.data.userId = options.tokens.verifyAccess(token).userId;
      next();
    } catch (err) {
      next(rejection(err instanceof AppError ? err.code : SocketErrorCode.TokenInvalid));
    }
  });

  const activeSessions = () => io.of('/').sockets.size;

  const broadcastSessions = () => {
    io.emit(SocketEvent.SessionsCount, { count: activeSessions() });
  };

  io.on('connection', (socket: RealtimeSocket) => {
    log.debug({ userId: socket.data.userId, sessions: activeSessions() }, 'tab connected');
    broadcastSessions();

    socket.on('disconnect', () => {
      broadcastSessions();
    });
  });

  const stopForwarding = options.events.subscribeAll((event) => {
    io.emit(SocketEvent.Inventory, event);
  });

  return {
    io,
    activeSessions,
    async close(): Promise<void> {
      stopForwarding();
      await io.close();
    },
  };
}

export type Realtime = ReturnType<typeof createRealtimeServer>;
