import { Router, type Request } from 'express';
import { AuthErrorCode, type AuthUserResponse } from '@dzen/shared';
import { authService } from '../../lib/container.js';
import { parseOrThrow } from '../../lib/parse.js';
import { tokenHelper } from '../../lib/tokens.js';
import { currentUser, requireAuth } from '../../middleware/auth.js';
import { AppError } from '../../middleware/error.js';
import { loginRateLimit, registerRateLimit } from '../../middleware/rate-limit.js';
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
  type SessionMeta,
} from './auth.schema.js';

export const authRouter: Router = Router();

function sessionMeta(req: Request): SessionMeta {
  return {
    userAgent: req.get('user-agent')?.slice(0, 255) ?? null,
    ip: req.ip ?? null,
  };
}

authRouter.post('/auth/login', loginRateLimit, async (req, res) => {
  const input = parseOrThrow(loginSchema, req.body);
  const session = await authService.login(input, sessionMeta(req));

  tokenHelper.setAuthCookies(res, session.accessToken, session.refreshToken);
  res.status(200).json({ user: session.user } satisfies AuthUserResponse);
});

authRouter.post('/auth/register', registerRateLimit, async (req, res) => {
  const input = parseOrThrow(registerSchema, req.body);
  const session = await authService.register(input, sessionMeta(req));

  tokenHelper.setAuthCookies(res, session.accessToken, session.refreshToken);
  res.status(201).json({ user: session.user } satisfies AuthUserResponse);
});

authRouter.post('/auth/refresh', async (req, res) => {
  const token = tokenHelper.readRefresh(req);

  if (!token) {
    tokenHelper.clearAuthCookies(res);
    throw new AppError(401, AuthErrorCode.Unauthorized, 'Authentication required');
  }

  try {
    const session = await authService.refresh(token, sessionMeta(req));
    tokenHelper.setAuthCookies(res, session.accessToken, session.refreshToken);
    res.status(200).json({ user: session.user } satisfies AuthUserResponse);
  } catch (err) {
    tokenHelper.clearAuthCookies(res);
    throw err;
  }
});

authRouter.post('/auth/logout', async (req, res) => {
  const token = tokenHelper.readRefresh(req);
  if (token) await authService.logout(token);

  tokenHelper.clearAuthCookies(res);
  res.status(200).json({ ok: true });
});

authRouter.get('/auth/me', requireAuth, async (req, res) => {
  const user = await authService.me(currentUser(req).id);
  res.status(200).json({ user } satisfies AuthUserResponse);
});

authRouter.patch('/auth/me', requireAuth, async (req, res) => {
  const input = parseOrThrow(updateProfileSchema, req.body);
  const user = await authService.updateProfile(currentUser(req).id, input);
  res.status(200).json({ user } satisfies AuthUserResponse);
});

authRouter.delete('/auth/sessions', requireAuth, async (req, res) => {
  await authService.logoutEverywhere(currentUser(req).id);
  tokenHelper.clearAuthCookies(res);
  res.status(200).json({ ok: true });
});
