'use client';

import { useEffect } from 'react';
import { io, type Socket } from 'socket.io-client';
import {
  SOCKET_PATH,
  SocketErrorCode,
  SocketEvent,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from '@dzen/shared';
import { sessionExpired } from '@/store/auth.slice';
import { useAppDispatch } from '@/store/hooks';
import { inventoryEventReceived } from '@/store/realtime';
import { refreshSession } from '@/store/session';
import { connectionLost, sessionsCounted } from '@/store/sessions.slice';

const AUTH_ERRORS = new Set<string>(Object.values(SocketErrorCode));

export function RealtimeBridge() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || undefined,
      { path: SOCKET_PATH, withCredentials: true, transports: ['websocket'] },
    );

    socket.on(SocketEvent.SessionsCount, ({ count }) => dispatch(sessionsCounted(count)));
    socket.on(SocketEvent.Inventory, (event) => dispatch(inventoryEventReceived(event)));
    socket.on('disconnect', () => dispatch(connectionLost()));

    socket.on('connect_error', async (error) => {
      dispatch(connectionLost());
      if (!AUTH_ERRORS.has(error.message)) return;

      if (await refreshSession()) socket.connect();
      else dispatch(sessionExpired());
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [dispatch]);

  return null;
}
