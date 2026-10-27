import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { io as connect, type Socket } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  SOCKET_PATH,
  type ClientToServerEvents,
  type InventoryEventEnvelope,
  type ServerToClientEvents,
} from '@dzen/shared';
import { createApp } from '../src/app.js';
import { eventBus } from '../src/lib/container.js';
import { disconnectDb } from '../src/lib/prisma.js';
import { tokenHelper } from '../src/lib/tokens.js';
import { createRealtimeServer, type Realtime } from '../src/realtime/socket-server.js';
import { TEST_ORIGIN } from './test-env.js';

type Client = Socket<ServerToClientEvents, ClientToServerEvents>;

let server: Server;
let realtime: Realtime;
let url = '';
const clients: Client[] = [];

function open(cookie: string): Client {
  const client: Client = connect(url, {
    path: SOCKET_PATH,
    transports: ['websocket'],
    reconnection: false,
    extraHeaders: { Cookie: cookie, Origin: TEST_ORIGIN },
  });
  clients.push(client);
  return client;
}

function signedCookie(): string {
  return `access_token=${tokenHelper.signAccess({ userId: 1, role: 'USER' })}`;
}

function nextCount(client: Client, expected: number): Promise<void> {
  return new Promise((resolve) => {
    const listener = ({ count }: { count: number }) => {
      if (count !== expected) return;
      client.off('sessions:count', listener);
      resolve();
    };
    client.on('sessions:count', listener);
  });
}

beforeAll(async () => {
  server = createServer(createApp());
  realtime = createRealtimeServer(server, {
    tokens: tokenHelper,
    events: eventBus,
    allowedOrigins: [TEST_ORIGIN],
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterEach(() => {
  for (const client of clients.splice(0)) client.close();
});

afterAll(async () => {
  await realtime.close();
  await disconnectDb();
});

describe('realtime', () => {
  it('counts open tabs and updates everyone when a tab closes', async () => {
    const first = open(signedCookie());
    await nextCount(first, 1);

    const sawTwo = nextCount(first, 2);
    const second = open(signedCookie());
    await Promise.all([sawTwo, nextCount(second, 2)]);

    const sawOne = nextCount(first, 1);
    second.close();
    await sawOne;
    expect(realtime.activeSessions()).toBe(1);
  });

  it('rejects a tab without a valid access token', async () => {
    const reasons = await Promise.all(
      ['', 'access_token=forged'].map(
        (cookie) =>
          new Promise<string>((resolve) => {
            open(cookie).on('connect_error', (err) => resolve(err.message));
          }),
      ),
    );

    expect(reasons).toEqual(['UNAUTHORIZED', 'TOKEN_INVALID']);
    expect(realtime.activeSessions()).toBe(0);
  });

  it('pushes domain events to connected tabs', async () => {
    const client = open(signedCookie());
    await nextCount(client, 1);

    const received = new Promise<InventoryEventEnvelope>((resolve) => {
      client.on('inventory:event', resolve);
    });
    eventBus.publish('order.deleted', { orderId: 7, productIds: [1, 2] }, 1);

    await expect(received).resolves.toMatchObject({
      name: 'order.deleted',
      payload: { orderId: 7, productIds: [1, 2] },
      actorId: 1,
    });
  });
});
