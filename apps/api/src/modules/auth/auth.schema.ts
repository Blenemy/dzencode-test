import type { Prisma } from '../../generated/prisma/client.js';

export {
  loginSchema,
  registerSchema,
  updateProfileSchema,
  type LoginInput,
  type RegisterInput,
  type UpdateProfileInput,
} from '@dzen/shared';

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
