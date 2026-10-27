export type DepCheck = { ok: true } | { ok: false; error: string };

export interface HealthReport {
  status: 'ok' | 'degraded';
  service: 'api';
  version: string;
  uptimeSeconds: number;
  timestamp: string;
  checks: {
    mysql: DepCheck;
  };
}
