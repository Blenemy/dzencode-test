import type { Response } from 'supertest';
import { prisma } from '../src/lib/prisma.js';
import { tokenHelper } from '../src/lib/tokens.js';

export interface ParsedCookie {
  value: string;
  attributes: Record<string, string | true>;
}

export async function resetDatabase(): Promise<void> {
  await prisma.productPrice.deleteMany();
  await prisma.product.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productGroup.deleteMany();
  await prisma.productType.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.warehouse.deleteMany();
}

export async function signedInUser(): Promise<{ userId: number; cookie: string }> {
  const user = await prisma.user.create({
    data: { email: `user-${Date.now()}@example.com`, name: 'Tester', passwordHash: 'unused' },
  });
  const token = tokenHelper.signAccess({ userId: user.id, role: user.role });
  return { userId: user.id, cookie: `access_token=${token}` };
}

let serial = 0;

export async function createProduct(data: {
  orderId: number;
  typeId: number;
  specification?: string;
  usd?: number;
  uah?: number;
}) {
  serial += 1;
  return prisma.product.create({
    data: {
      serialNumber: `SN-TEST-${serial}`,
      title: `Product ${serial}`,
      specification: data.specification ?? 'Default spec',
      guaranteeStart: new Date('2026-01-01'),
      guaranteeEnd: new Date('2027-01-01'),
      date: new Date('2026-01-01'),
      orderId: data.orderId,
      typeId: data.typeId,
      prices: {
        create: [
          { symbol: 'USD', value: data.usd ?? 10, isDefault: false },
          { symbol: 'UAH', value: data.uah ?? 415, isDefault: true },
        ],
      },
    },
  });
}

export function readCookies(res: Response): Map<string, ParsedCookie> {
  const header = res.headers['set-cookie'] as unknown;
  const lines = Array.isArray(header) ? (header as string[]) : [];
  const cookies = new Map<string, ParsedCookie>();

  for (const line of lines) {
    const [pair = '', ...rest] = line.split(';').map((part) => part.trim());
    const separator = pair.indexOf('=');
    const name = pair.slice(0, separator);
    const attributes: ParsedCookie['attributes'] = {};

    for (const attribute of rest) {
      const eq = attribute.indexOf('=');
      if (eq === -1) attributes[attribute.toLowerCase()] = true;
      else attributes[attribute.slice(0, eq).toLowerCase()] = attribute.slice(eq + 1);
    }

    cookies.set(name, { value: decodeURIComponent(pair.slice(separator + 1)), attributes });
  }

  return cookies;
}

export function cookieValue(res: Response, name: string): string {
  const cookie = readCookies(res).get(name);
  if (!cookie || !cookie.value) throw new Error(`cookie ${name} was not set`);
  return cookie.value;
}
