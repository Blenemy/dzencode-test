import type { DepCheck, HealthReport } from '@dzen/shared';
import type { PrismaClient } from '../../generated/prisma/client.js';

export class HealthService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly version: string,
  ) {}

  async check(): Promise<HealthReport> {
    const mysql = await this.checkMysql();

    return {
      status: mysql.ok ? 'ok' : 'degraded',
      service: 'api',
      version: this.version,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: { mysql },
    };
  }

  private async checkMysql(): Promise<DepCheck> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'mysql unreachable' };
    }
  }
}
