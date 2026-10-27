import type { Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { CommonErrorCode } from '@dzen/shared';
import { env } from '../config/env.js';
import { AppError } from './error.js';

const FIFTEEN_MIN_MS = 15 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export const loginRateLimit = createIpRateLimit(
  20,
  FIFTEEN_MIN_MS,
  'Too many login attempts, try again in a few minutes',
  true,
);

export const registerRateLimit = createIpRateLimit(
  5,
  HOUR_MS,
  'Too many sign-ups from this address, try again later',
);

export function createIpRateLimit(
  limit: number,
  windowMs: number,
  message: string,
  skipSuccessfulRequests = false,
) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skipSuccessfulRequests,
    skip: () => env.NODE_ENV === 'test',
    keyGenerator: clientIp,
    handler: (_req, _res, next) => {
      next(new AppError(429, CommonErrorCode.RateLimited, message));
    },
  });
}

function clientIp(req: Request): string {
  return req.ip ? ipKeyGenerator(req.ip) : 'unknown';
}
