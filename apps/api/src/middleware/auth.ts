import type { Request, RequestHandler } from 'express';
import { AuthErrorCode, CommonErrorCode, type UserRole } from '@dzen/shared';
import { corsOrigins } from '../config/env.js';
import { tokenHelper } from '../lib/tokens.js';
import { AppError } from './error.js';

export interface RequestUser {
  id: number;
  role: UserRole;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: RequestUser;
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = tokenHelper.readAccess(req);

  if (!token) {
    return next(new AppError(401, AuthErrorCode.Unauthorized, 'Authentication required'));
  }

  const claims = tokenHelper.verifyAccess(token);
  req.user = { id: claims.userId, role: claims.role };
  next();
};

export function currentUser(req: Request): RequestUser {
  if (!req.user) {
    throw new AppError(401, AuthErrorCode.Unauthorized, 'Authentication required');
  }
  return req.user;
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const checkOrigin: RequestHandler = (req, _res, next) => {
  if (SAFE_METHODS.has(req.method)) return next();

  const origin = req.get('origin');
  if (!origin) return next();

  if (!corsOrigins.includes(origin)) {
    return next(new AppError(403, CommonErrorCode.BadOrigin, 'Cross-site request rejected'));
  }

  next();
};
