import type { Response } from 'supertest';
import { prisma } from '../src/lib/prisma.js';

export interface ParsedCookie {
  value: string;
  attributes: Record<string, string | true>;
}

export async function resetDatabase(): Promise<void> {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
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
