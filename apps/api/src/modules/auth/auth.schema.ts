import type { Prisma } from '../../generated/prisma/client.js';

export { loginSchema, registerSchema, type LoginInput, type RegisterInput } from '@dzen/shared';

export interface SessionMeta {
  userAgent: string | null;
  ip: string | null;
}

export const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatar: true,
} satisfies Prisma.UserSelect;

export type AuthIdentity = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;
