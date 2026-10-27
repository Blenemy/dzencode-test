import type { StatsDto } from '@dzen/shared';
import { monthShort } from '@/lib/format-date';
import { amountIn } from '@/lib/format-money';

export const MONTHLY_CHART_HEIGHT = 280;
const TYPE_ROW_HEIGHT = 38;

export interface TypePoint {
  name: string;
  count: number;
}

export interface MonthPoint {
  month: string;
  short: string;
  full: string;
  uah: number;
  usd: number;
  orders: number;
}

export function typesChartHeight(rows: number): number {
  return rows * TYPE_ROW_HEIGHT + 8;
}

function nextMonth(month: string): string {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + 1);
  return date.toISOString().slice(0, 7);
}

export function toMonthPoints(byMonth: StatsDto['byMonth'], locale: string): MonthPoint[] {
  const first = byMonth.at(0)?.month;
  const last = byMonth.at(-1)?.month;
  if (!first || !last) return [];

  const known = new Map(byMonth.map((row) => [row.month, row]));
  const points: MonthPoint[] = [];

  for (let month = first; month <= last; month = nextMonth(month)) {
    const row = known.get(month);
    const name = monthShort(`${month}-01T00:00:00Z`, locale, 'UTC');
    const year = month.slice(0, 4);
    points.push({
      month,
      short: `${name} ${year.slice(2)}`,
      full: `${name} ${year}`,
      uah: row ? amountIn(row.value, 'UAH') : 0,
      usd: row ? amountIn(row.value, 'USD') : 0,
      orders: row?.orders ?? 0,
    });
  }

  return points;
}
