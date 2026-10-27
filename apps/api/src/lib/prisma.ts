import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { Prisma, PrismaClient } from '../generated/prisma/client.js';
import { env } from '../config/env.js';

const adapter = new PrismaMariaDb(env.DATABASE_URL);

export const prisma = new PrismaClient({ adapter });

export async function disconnectDb(): Promise<void> {
  await prisma.$disconnect();
}

function hasCode(err: unknown, code: string): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === code;
}

export function isUniqueViolation(err: unknown): boolean {
  return hasCode(err, 'P2002');
}

export function isForeignKeyViolation(err: unknown): boolean {
  return hasCode(err, 'P2003');
}

export function isRecordMissing(err: unknown): boolean {
  return hasCode(err, 'P2025') || hasCode(err, 'P2018');
}

export function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  return Number(String(value));
}

export function dateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
