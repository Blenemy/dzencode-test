import { CURRENCIES, type Currency, type CurrencyTotal, type StatsDto } from '@dzen/shared';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { toNumber } from '../../lib/prisma.js';

interface MonthCountRow {
  month: string;
  orders: unknown;
}

interface MonthValueRow {
  month: string;
  symbol: Currency;
  total: unknown;
}

interface CurrencyRow {
  symbol: Currency;
  total: unknown;
}

function totalsFrom(sums: Map<Currency, number>): CurrencyTotal[] {
  return CURRENCIES.map((symbol) => ({ symbol, value: sums.get(symbol) ?? 0 }));
}

export class StatsService {
  constructor(private readonly prisma: PrismaClient) {}

  async overview(): Promise<StatsDto> {
    const [
      orders,
      products,
      value,
      byType,
      types,
      byStatus,
      byGroup,
      groups,
      monthCounts,
      monthValues,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.product.count(),
      this.prisma.$queryRaw<CurrencyRow[]>`
        SELECT symbol, SUM(value) AS total FROM product_prices GROUP BY symbol
      `,
      this.prisma.product.groupBy({ by: ['typeId'], _count: { _all: true } }),
      this.prisma.productType.findMany({ select: { id: true, name: true } }),
      this.prisma.product.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.product.groupBy({ by: ['groupId'], _count: { _all: true } }),
      this.prisma.productGroup.findMany({ select: { id: true, title: true } }),
      this.prisma.$queryRaw<MonthCountRow[]>`
        SELECT DATE_FORMAT(date, '%Y-%m') AS month, COUNT(*) AS orders
        FROM orders
        GROUP BY month
        ORDER BY month
      `,
      this.prisma.$queryRaw<MonthValueRow[]>`
        SELECT DATE_FORMAT(o.date, '%Y-%m') AS month, pp.symbol AS symbol, SUM(pp.value) AS total
        FROM orders o
        JOIN products p ON p.order_id = o.id
        JOIN product_prices pp ON pp.product_id = p.id
        GROUP BY month, pp.symbol
      `,
    ]);

    const typeNames = new Map(types.map((type) => [type.id, type.name]));
    const groupTitles = new Map(groups.map((group) => [group.id, group.title]));

    const valuesByMonth = new Map<string, Map<Currency, number>>();
    for (const row of monthValues) {
      const sums = valuesByMonth.get(row.month) ?? new Map<Currency, number>();
      sums.set(row.symbol, toNumber(row.total));
      valuesByMonth.set(row.month, sums);
    }

    return {
      totals: {
        orders,
        products,
        value: totalsFrom(new Map(value.map((row) => [row.symbol, toNumber(row.total)]))),
      },
      byType: byType
        .map((row) => ({ type: typeNames.get(row.typeId) ?? '—', count: row._count._all }))
        .sort((a, b) => b.count - a.count),
      byStatus: byStatus.map((row) => ({ status: row.status, count: row._count._all })),
      byGroup: byGroup
        .map((row) => ({
          group: row.groupId === null ? null : (groupTitles.get(row.groupId) ?? null),
          count: row._count._all,
        }))
        .sort((a, b) => b.count - a.count),
      byMonth: monthCounts.map((row) => ({
        month: row.month,
        orders: toNumber(row.orders),
        value: totalsFrom(valuesByMonth.get(row.month) ?? new Map()),
      })),
    };
  }
}
