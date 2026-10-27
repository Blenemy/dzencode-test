import { createHash, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { CookieOptions, Request, Response } from 'express';
import { AuthErrorCode, type UserRole } from '@dzen/shared';
import { env } from '../config/env.js';
import { AppError } from '../middleware/error.js';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

const ACCESS_PATH = '/';
const REFRESH_PATH = '/api/auth';

export interface AccessClaims {
  userId: number;
  role: UserRole;
}

export interface RefreshClaims {
  userId: number;
  familyId: string;
  jti: string;
}

export interface IssuedRefresh {
  token: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
}

export interface TokenConfig {
  accessSecret: string;
  refreshSecret: string;
  accessTtl: number;
  refreshTtl: number;
  secureCookies: boolean;
}

export class TokenHelper {
  constructor(private readonly config: TokenConfig) {}

  get accessTtl(): number {
    return this.config.accessTtl;
  }

  signAccess(claims: AccessClaims): string {
    return jwt.sign({ sub: String(claims.userId), role: claims.role }, this.config.accessSecret, {
      expiresIn: this.config.accessTtl,
    });
  }

  issueRefresh(userId: number, familyId?: string): IssuedRefresh {
    const fid = familyId ?? randomUUID();
    const token = jwt.sign(
      { sub: String(userId), fid, jti: randomUUID() },
      this.config.refreshSecret,
      { expiresIn: this.config.refreshTtl },
    );

    return {
      token,
      tokenHash: this.hash(token),
      familyId: fid,
      expiresAt: new Date(Date.now() + this.config.refreshTtl * 1000),
    };
  }

  verifyAccess(token: string): AccessClaims {
    const payload = this.verify(token, this.config.accessSecret);
    const userId = parseUserId(payload['sub']);
    const role = payload['role'];

    if (userId === null || !isUserRole(role)) {
      throw new AppError(401, AuthErrorCode.TokenInvalid, 'Access token is malformed');
    }

    return { userId, role };
  }

  verifyRefresh(token: string): RefreshClaims {
    const payload = this.verify(token, this.config.refreshSecret);
    const userId = parseUserId(payload['sub']);
    const familyId = payload['fid'];
    const jti = payload['jti'];

    if (userId === null || typeof familyId !== 'string' || typeof jti !== 'string') {
      throw new AppError(401, AuthErrorCode.TokenInvalid, 'Refresh token is malformed');
    }

    return { userId, familyId, jti };
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    res.cookie(ACCESS_COOKIE, accessToken, this.cookieOptions(ACCESS_PATH, this.config.accessTtl));
    res.cookie(
      REFRESH_COOKIE,
      refreshToken,
      this.cookieOptions(REFRESH_PATH, this.config.refreshTtl),
    );
  }

  clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_COOKIE, this.cookieOptions(ACCESS_PATH));
    res.clearCookie(REFRESH_COOKIE, this.cookieOptions(REFRESH_PATH));
  }

  readAccess(req: Request): string | null {
    return readCookie(req.cookies, ACCESS_COOKIE);
  }

  readRefresh(req: Request): string | null {
    return readCookie(req.cookies, REFRESH_COOKIE);
  }

  private cookieOptions(path: string, maxAgeSeconds?: number): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.secureCookies,
      sameSite: 'lax',
      path,
      ...(maxAgeSeconds === undefined ? {} : { maxAge: maxAgeSeconds * 1000 }),
    };
  }

  private verify(token: string, secret: string): jwt.JwtPayload {
    try {
      const payload = jwt.verify(token, secret);
      if (typeof payload === 'string') {
        throw new AppError(401, AuthErrorCode.TokenInvalid, 'Token is malformed');
      }
      return payload;
    } catch (err) {
      if (err instanceof AppError) throw err;
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError(401, AuthErrorCode.TokenExpired, 'Token has expired');
      }
      throw new AppError(401, AuthErrorCode.TokenInvalid, 'Token is malformed');
    }
  }
}

function parseUserId(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'USER' || value === 'ADMIN';
}

export function readCookie(cookies: unknown, name: string): string | null {
  if (typeof cookies !== 'object' || cookies === null) return null;
  const value = (cookies as Record<string, unknown>)[name];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export const tokenHelper = new TokenHelper({
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessTtl: env.JWT_ACCESS_TTL,
  refreshTtl: env.JWT_REFRESH_TTL,
  secureCookies: env.COOKIE_SECURE,
});
