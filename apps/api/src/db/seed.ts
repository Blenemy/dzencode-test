import { hash } from '@node-rs/argon2';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { disconnectDb, prisma } from '../lib/prisma.js';
import {
  createRandom,
  orderTitles,
  productGroups,
  productTypes,
  staff,
  USD_TO_UAH,
  warehouses,
} from './seed-data.js';

const random = createRandom(20171027);

function pick<T>(items: readonly T[]): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) throw new Error('cannot pick from an empty list');
  return item;
}

function between(min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + months);
  return next;
}

async function seedPeople(passwordHash: string): Promise<{ userIds: number[] }> {
  const warehouseCount = await prisma.warehouse.count();
  if (warehouseCount === 0) {
    await prisma.warehouse.createMany({ data: warehouses });
  }
  const warehouseIds = (await prisma.warehouse.findMany({ select: { id: true } })).map(
    (warehouse) => warehouse.id,
  );

  await prisma.user.upsert({
    where: { email: env.DEMO_EMAIL },
    update: { passwordHash, isActive: true },
    create: {
      email: env.DEMO_EMAIL,
      name: 'Демо Пользователь',
      passwordHash,
      warehouseId: warehouseIds[0] ?? null,
    },
  });

  const userIds: number[] = [];
  for (const [index, person] of staff.entries()) {
    const user = await prisma.user.upsert({
      where: { email: person.email },
      update: {},
      create: {
        ...person,
        passwordHash,
        warehouseId: warehouseIds[index % warehouseIds.length] ?? null,
      },
      select: { id: true },
    });
    userIds.push(user.id);
  }

  return { userIds };
}

async function seedInventory(userIds: number[]): Promise<number> {
  for (const type of productTypes) {
    await prisma.productType.upsert({
      where: { name: type.name },
      update: {},
      create: { name: type.name },
    });
  }
  if ((await prisma.productGroup.count()) === 0) {
    await prisma.productGroup.createMany({ data: productGroups });
  }

  const typeIds = new Map(
    (await prisma.productType.findMany()).map((type) => [type.name, type.id] as const),
  );
  const groupIds = (await prisma.productGroup.findMany({ select: { id: true } })).map(
    (group) => group.id,
  );
  const warehouseIds = (await prisma.warehouse.findMany({ select: { id: true } })).map(
    (warehouse) => warehouse.id,
  );

  const start = Date.UTC(2025, 0, 10);
  const end = Date.UTC(2026, 9, 20);
  const step = (end - start) / (orderTitles.length - 1);
  let serial = 0;
  let products = 0;

  for (const [index, title] of orderTitles.entries()) {
    const date = new Date(start + step * index + between(0, 5) * 86_400_000);

    const order = await prisma.order.create({
      data: {
        title,
        description: 'Поставка оборудования согласно заявке отдела закупок',
        date,
        warehouseId: pick(warehouseIds),
        createdById: pick(userIds),
      },
      select: { id: true },
    });

    const count = between(2, 8);
    for (let n = 0; n < count; n += 1) {
      const type = pick(productTypes);
      const typeId = typeIds.get(type.name);
      if (typeId === undefined) throw new Error(`type ${type.name} was not seeded`);

      serial += 1;
      const usd = between(type.usd[0] ?? 10, type.usd[1] ?? 100) + (random() < 0.5 ? 0.99 : 0);
      const uah = Math.round(usd * USD_TO_UAH * 100) / 100;

      await prisma.product.create({
        data: {
          serialNumber: `SN-${String(10 + (serial % 89)).padStart(2, '0')}.${String(
            3_456_789 + serial * 7_919,
          ).padStart(7, '0')}`,
          title: pick(type.titles),
          specification: pick(type.specifications),
          photo: type.photo,
          isNew: random() < 0.7,
          status: random() < 0.15 ? 'IN_REPAIR' : 'FREE',
          guaranteeStart: date,
          guaranteeEnd: addMonths(date, pick([12, 24, 36])),
          date,
          typeId,
          orderId: order.id,
          groupId: random() < 0.7 ? pick(groupIds) : null,
          userId: random() < 0.5 ? pick(userIds) : null,
          prices: {
            create: [
              { symbol: 'USD', value: usd, isDefault: false },
              { symbol: 'UAH', value: uah, isDefault: true },
            ],
          },
        },
      });
      products += 1;
    }
  }

  return products;
}

async function seed(): Promise<void> {
  const passwordHash = await hash(env.DEMO_PASSWORD);
  const { userIds } = await seedPeople(passwordHash);
  logger.info({ email: env.DEMO_EMAIL }, 'demo user is ready');

  if ((await prisma.order.count()) > 0) {
    logger.info('orders already exist, inventory seed skipped');
    return;
  }

  const products = await seedInventory(userIds);
  logger.info({ orders: orderTitles.length, products }, 'inventory seeded');
}

try {
  await seed();
} catch (err) {
  logger.error({ err }, 'seed failed');
  process.exitCode = 1;
} finally {
  await disconnectDb();
}
