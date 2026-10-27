import { existsSync } from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import type { InventoryEventEnvelope } from '@dzen/shared';
import { createApp } from '../src/app.js';
import { uploadsDir } from '../src/config/env.js';
import { eventBus } from '../src/lib/container.js';
import { disconnectDb, prisma } from '../src/lib/prisma.js';
import { createProduct, resetDatabase, signedInUser } from './helpers.js';
import { TEST_ORIGIN } from './test-env.js';

const app = createApp();

const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

let cookie = '';

beforeEach(async () => {
  await resetDatabase();
  ({ cookie } = await signedInUser());
});

afterAll(async () => {
  await resetDatabase();
  await disconnectDb();
});

async function orderWithType(title = 'Order') {
  const type = await prisma.productType.create({ data: { name: `Type ${Date.now()}` } });
  const order = await prisma.order.create({ data: { title, date: new Date('2026-03-01') } });
  return { type, order };
}

describe('inventory API', () => {
  it('lists orders with product counts and totals in every currency', async () => {
    const { type, order } = await orderWithType('Filled');
    await createProduct({ orderId: order.id, typeId: type.id, usd: 100, uah: 4150 });
    await createProduct({ orderId: order.id, typeId: type.id, usd: 50.5, uah: 2095.75 });
    const empty = await prisma.order.create({
      data: { title: 'Empty', date: new Date('2026-01-01') },
    });

    const res = await request(app).get('/api/orders').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    const filled = res.body.items.find((item: { id: number }) => item.id === order.id);
    const blank = res.body.items.find((item: { id: number }) => item.id === empty.id);
    expect(filled).toMatchObject({
      productsCount: 2,
      totals: [
        { symbol: 'USD', value: 150.5 },
        { symbol: 'UAH', value: 6245.75 },
      ],
    });
    expect(blank).toMatchObject({
      productsCount: 0,
      totals: [
        { symbol: 'USD', value: 0 },
        { symbol: 'UAH', value: 0 },
      ],
    });
  });

  it('deletes an order with its products and publishes order.deleted', async () => {
    const { type, order } = await orderWithType();
    const first = await createProduct({ orderId: order.id, typeId: type.id });
    const second = await createProduct({ orderId: order.id, typeId: type.id });

    const events: InventoryEventEnvelope<'order.deleted'>[] = [];
    const unsubscribe = eventBus.subscribe('order.deleted', (event) => events.push(event));

    const res = await request(app)
      .delete(`/api/orders/${order.id}`)
      .set('Origin', TEST_ORIGIN)
      .set('Cookie', cookie);
    unsubscribe();

    expect(res.status).toBe(204);
    expect(await prisma.product.count()).toBe(0);
    expect(await prisma.productPrice.count()).toBe(0);
    expect(events).toHaveLength(1);
    expect(events[0]?.payload).toEqual({
      orderId: order.id,
      productIds: [first.id, second.id].sort((a, b) => a - b),
    });
  });

  it('filters products by type and specification and paginates the result', async () => {
    const { type, order } = await orderWithType();
    const other = await prisma.productType.create({ data: { name: 'Other' } });
    for (let n = 0; n < 3; n += 1) {
      await createProduct({ orderId: order.id, typeId: type.id, specification: '27" IPS' });
    }
    await createProduct({ orderId: order.id, typeId: type.id, specification: '24" VA' });
    await createProduct({ orderId: order.id, typeId: other.id, specification: '27" IPS' });

    const res = await request(app)
      .get('/api/products')
      .query({ typeId: type.id, specification: '27" IPS', limit: 2 })
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.items).toHaveLength(2);
    for (const item of res.body.items) {
      expect(item.type.id).toBe(type.id);
      expect(item.specification).toBe('27" IPS');
    }
  });

  it('creates a product with both prices and the chosen default currency', async () => {
    const { type, order } = await orderWithType();

    const res = await request(app)
      .post('/api/products')
      .set('Origin', TEST_ORIGIN)
      .set('Cookie', cookie)
      .send({
        title: 'Dell UltraSharp U2723QE',
        serialNumber: 'SN-12.3456789',
        typeId: type.id,
        specification: '27" IPS, 3840×2160',
        isNew: true,
        status: 'FREE',
        guaranteeStart: '2026-01-01',
        guaranteeEnd: '2028-01-01',
        priceUsd: 599.99,
        priceUah: 24899.585,
        defaultCurrency: 'USD',
        orderId: order.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.price).toEqual([
      { symbol: 'USD', value: 599.99, isDefault: true },
      { symbol: 'UAH', value: 24899.59, isDefault: false },
    ]);
    expect(res.body.order).toEqual({ id: order.id, title: order.title });
  });

  it('accepts real images and rejects files that only pretend to be one', async () => {
    const accepted = await request(app)
      .post('/api/uploads')
      .set('Origin', TEST_ORIGIN)
      .set('Cookie', cookie)
      .attach('file', PNG_1X1, { filename: 'photo.png', contentType: 'image/png' });

    expect(accepted.status).toBe(201);
    expect(accepted.body.url).toMatch(/^\/uploads\/[\w-]+\.png$/);
    expect(existsSync(path.join(uploadsDir, path.basename(accepted.body.url)))).toBe(true);

    const disguised = await request(app)
      .post('/api/uploads')
      .set('Origin', TEST_ORIGIN)
      .set('Cookie', cookie)
      .attach('file', Buffer.from('<script>alert(1)</script>'), {
        filename: 'photo.png',
        contentType: 'image/png',
      });

    expect(disguised.status).toBe(415);
    expect(disguised.body.error.code).toBe('UNSUPPORTED_FILE');
  });
});
