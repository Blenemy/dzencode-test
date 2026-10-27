import { z } from 'zod';

export const AuthCookie = {
  Access: 'access_token',
  Refresh: 'refresh_token',
  SessionHint: 'has_session',
} as const;

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 100;
export const NAME_MAX = 100;
export const EMAIL_MAX = 191;

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, { error: 'validation.required' })
  .max(EMAIL_MAX, { error: 'validation.emailMax' })
  .pipe(z.email({ error: 'validation.email' }));

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, { error: 'validation.required' }),
});

const nameField = z
  .string()
  .trim()
  .min(1, { error: 'validation.required' })
  .max(NAME_MAX, { error: 'validation.nameMax' });

export const registerSchema = z.object({
  name: nameField,
  email: emailField,
  password: z
    .string()
    .min(PASSWORD_MIN, { error: 'validation.passwordMin' })
    .max(PASSWORD_MAX, { error: 'validation.passwordMax' }),
});

export const updateProfileSchema = z.object({
  name: nameField,
  avatar: z
    .string()
    .max(255)
    .regex(/^\/uploads\/[A-Za-z0-9._-]+$/, { error: 'validation.photo' })
    .nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export type UserRole = 'USER' | 'ADMIN';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  avatar: string | null;
}

export interface AuthUserResponse {
  user: AuthUser;
}

export const AuthErrorCode = {
  Unauthorized: 'UNAUTHORIZED',
  InvalidCredentials: 'INVALID_CREDENTIALS',
  EmailTaken: 'EMAIL_TAKEN',
  TokenExpired: 'TOKEN_EXPIRED',
  TokenInvalid: 'TOKEN_INVALID',
  TokenReused: 'TOKEN_REUSED',
  UserInactive: 'USER_INACTIVE',
} as const;
