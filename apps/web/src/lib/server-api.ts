import 'server-only';
import { cookies } from 'next/headers';
import type { AuthUser, AuthUserResponse } from '@dzen/shared';

const API_URL = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

export type ServerResult<T> = { ok: true; data: T } | { ok: false; status: number };

export async function serverGet<T>(path: string): Promise<ServerResult<T>> {
  const cookieHeader = (await cookies()).toString();

  try {
    const response = await fetch(`${API_URL}/api${path}`, {
      headers: { cookie: cookieHeader, accept: 'application/json' },
      cache: 'no-store',
    });
    if (!response.ok) return { ok: false, status: response.status };
    return { ok: true, data: (await response.json()) as T };
  } catch {
    return { ok: false, status: 503 };
  }
}

export type CurrentUser =
  { state: 'authenticated'; user: AuthUser } | { state: 'expired' } | { state: 'anonymous' };

export async function getCurrentUser(): Promise<CurrentUser> {
  const result = await serverGet<AuthUserResponse>('/auth/me');
  if (result.ok) return { state: 'authenticated', user: result.data.user };
  return result.status === 401 ? { state: 'expired' } : { state: 'anonymous' };
}
