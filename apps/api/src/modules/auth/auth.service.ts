import { hash, verify } from '@node-rs/argon2';
import { AuthErrorCode } from '@dzen/shared';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { isUniqueViolation } from '../../lib/prisma.js';
import { logger } from '../../lib/logger.js';
import type { TokenHelper } from '../../lib/tokens.js';
import { AppError } from '../../middleware/error.js';
import {
  publicUserSelect,
  type AuthIdentity,
  type LoginInput,
  type RegisterInput,
  type SessionMeta,
  type UpdateProfileInput,
} from './auth.schema.js';

const DUMMY_HASH = await hash('no-such-user-placeholder');

export const REUSE_WINDOW_MS = 10_000;

export interface IssuedSession {
  user: AuthIdentity;
  accessToken: string;
  refreshToken: string;
}

interface LockedRefreshRow {
  id: number;
  userId: number;
  familyId: string;
  expiresAt: Date | string;
  revokedAt: Date | string | null;
  replacedById: number | null;
}

type RejectOutcome = {
  kind: 'reject';
  status: number;
  code: string;
  message: string;
  logReuse?: { userId: number; familyId: string };
};

type RefreshOutcome =
  | { kind: 'session'; session: IssuedSession }
  | { kind: 'replay'; session: IssuedSession }
  | RejectOutcome;

type RefreshDb = Pick<PrismaClient, 'refreshToken'>;

function reject(
  status: number,
  code: string,
  message: string,
  logReuse?: RejectOutcome['logReuse'],
): RejectOutcome {
  return { kind: 'reject', status, code, message, ...(logReuse && { logReuse }) };
}

async function revokeFamily(db: RefreshDb, row: LockedRefreshRow): Promise<void> {
  await db.refreshToken.updateMany({
    where: { familyId: row.familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

const recentlyIssued = new Map<number, { session: IssuedSession; storedAt: number }>();

function rememberIssued(rowId: number, session: IssuedSession): void {
  const now = Date.now();
  for (const [id, entry] of recentlyIssued) {
    if (now - entry.storedAt > REUSE_WINDOW_MS) recentlyIssued.delete(id);
  }
  recentlyIssued.set(rowId, { session, storedAt: now });
}

function replayIssued(rowId: number): IssuedSession | null {
  const entry = recentlyIssued.get(rowId);
  if (!entry) return null;
  if (Date.now() - entry.storedAt > REUSE_WINDOW_MS) {
    recentlyIssued.delete(rowId);
    return null;
  }
  return entry.session;
}

function asTime(value: Date | string): number {
  return new Date(value).getTime();
}

async function safeVerify(hashed: string, password: string): Promise<boolean> {
  try {
    return await verify(hashed, password);
  } catch {
    return false;
  }
}

export class AuthService {
  private readonly log = logger.child({ service: 'auth' });

  constructor(
    private readonly prisma: PrismaClient,
    private readonly tokens: TokenHelper,
  ) {}

  async login(input: LoginInput, meta: SessionMeta): Promise<IssuedSession> {
    const found = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { ...publicUserSelect, passwordHash: true, isActive: true },
    });

    const isPasswordValid = await safeVerify(found?.passwordHash ?? DUMMY_HASH, input.password);

    if (!found || !isPasswordValid) {
      throw new AppError(401, AuthErrorCode.InvalidCredentials, 'Invalid email or password');
    }

    if (!found.isActive) {
      throw new AppError(403, AuthErrorCode.UserInactive, 'Account is disabled');
    }

    const { passwordHash: _passwordHash, isActive: _isActive, ...user } = found;

    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    } catch (err) {
      this.log.warn({ err, userId: user.id }, 'failed to update lastLoginAt');
    }

    return this.issueSession(user, meta);
  }

  async register(input: RegisterInput, meta: SessionMeta): Promise<IssuedSession> {
    const passwordHash = await hash(input.password);

    try {
      const user = await this.prisma.user.create({
        data: { email: input.email, name: input.name, passwordHash },
        select: publicUserSelect,
      });
      return await this.issueSession(user, meta);
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new AppError(409, AuthErrorCode.EmailTaken, 'This email is already registered');
      }
      throw err;
    }
  }

  async me(userId: number): Promise<AuthIdentity> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: publicUserSelect,
    });

    if (!user) {
      throw new AppError(401, AuthErrorCode.Unauthorized, 'Authentication required');
    }

    return user;
  }

  async refresh(token: string, meta: SessionMeta): Promise<IssuedSession> {
    const claims = this.tokens.verifyRefresh(token);
    const tokenHash = this.tokens.hash(token);

    const outcome = await this.prisma.$transaction(async (tx): Promise<RefreshOutcome> => {
      const rows = await tx.$queryRaw<LockedRefreshRow[]>`
        SELECT id, user_id AS userId, family_id AS familyId, expires_at AS expiresAt,
               revoked_at AS revokedAt, replaced_by_id AS replacedById
        FROM refresh_tokens
        WHERE token_hash = ${tokenHash}
        FOR UPDATE
      `;

      const row = rows[0];
      if (!row || claims.userId !== row.userId || claims.familyId !== row.familyId) {
        return reject(401, AuthErrorCode.TokenInvalid, 'Session is invalid');
      }

      if (row.revokedAt) {
        return this.resolveRevoked(tx, row, row.revokedAt);
      }

      if (asTime(row.expiresAt) < Date.now()) {
        return reject(401, AuthErrorCode.TokenExpired, 'Token has expired');
      }

      const found = await tx.user.findUnique({
        where: { id: row.userId },
        select: { ...publicUserSelect, isActive: true },
      });

      if (!found) {
        return reject(401, AuthErrorCode.Unauthorized, 'Authentication required');
      }

      if (!found.isActive) {
        await revokeFamily(tx, row);
        return reject(403, AuthErrorCode.UserInactive, 'Account is disabled');
      }

      const { isActive: _isActive, ...user } = found;
      return { kind: 'session', session: await this.rotate(tx, row, user, meta) };
    });

    if (outcome.kind !== 'reject') return outcome.session;

    if (outcome.logReuse) {
      this.log.warn(outcome.logReuse, 'refresh token reuse detected');
    }

    throw new AppError(outcome.status, outcome.code, outcome.message);
  }

  async updateProfile(userId: number, input: UpdateProfileInput): Promise<AuthIdentity> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { name: input.name, avatar: input.avatar },
      select: publicUserSelect,
    });
  }

  async logoutEverywhere(userId: number): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logout(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.tokens.hash(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async insertRefresh(db: RefreshDb, userId: number, meta: SessionMeta, familyId?: string) {
    const issued = this.tokens.issueRefresh(userId, familyId);
    const row = await db.refreshToken.create({
      data: {
        userId,
        tokenHash: issued.tokenHash,
        familyId: issued.familyId,
        expiresAt: issued.expiresAt,
        userAgent: meta.userAgent,
        ip: meta.ip,
      },
      select: { id: true },
    });
    return { issued, rowId: row.id };
  }

  private async issueSession(user: AuthIdentity, meta: SessionMeta): Promise<IssuedSession> {
    const { issued } = await this.insertRefresh(this.prisma, user.id, meta);

    return {
      user,
      accessToken: this.tokens.signAccess({ userId: user.id, role: user.role }),
      refreshToken: issued.token,
    };
  }

  private async resolveRevoked(
    db: RefreshDb,
    row: LockedRefreshRow,
    revokedAt: Date | string,
  ): Promise<RefreshOutcome> {
    const ageMs = Date.now() - asTime(revokedAt);

    if (ageMs <= REUSE_WINDOW_MS && row.replacedById !== null) {
      const successor = await db.refreshToken.findUnique({
        where: { id: row.replacedById },
        select: { id: true, revokedAt: true },
      });

      if (successor && !successor.revokedAt) {
        const replay = replayIssued(successor.id);
        if (replay) return { kind: 'replay', session: replay };
      }
    }

    await revokeFamily(db, row);

    return reject(401, AuthErrorCode.TokenReused, 'Session was revoked, sign in again', {
      userId: row.userId,
      familyId: row.familyId,
    });
  }

  private async rotate(
    db: RefreshDb,
    row: LockedRefreshRow,
    user: AuthIdentity,
    meta: SessionMeta,
  ): Promise<IssuedSession> {
    const { issued, rowId } = await this.insertRefresh(db, user.id, meta, row.familyId);

    await db.refreshToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date(), replacedById: rowId },
    });

    const session: IssuedSession = {
      user,
      accessToken: this.tokens.signAccess({ userId: user.id, role: user.role }),
      refreshToken: issued.token,
    };

    rememberIssued(rowId, session);

    return session;
  }
}
