import {
  CommonErrorCode,
  CURRENCIES,
  InventoryErrorCode,
  InventoryEvent,
  type CreateOrderData,
  type Currency,
  type CurrencyTotal,
  type ListResponse,
  type OrderDetailsDto,
  type OrderSummaryDto,
} from '@dzen/shared';
import { Prisma, type PrismaClient } from '../../generated/prisma/client.js';
import type { EventBus } from '../../events/bus.js';
import { dateOnly, isForeignKeyViolation, toNumber } from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.js';
import { productInclude, toProductDto } from '../products/product.mapper.js';

const summaryInclude = {
  warehouse: { select: { id: true, name: true, city: true } },
  _count: { select: { products: true } },
} satisfies Prisma.OrderInclude;

type OrderSummaryRecord = Prisma.OrderGetPayload<{ include: typeof summaryInclude }>;

interface TotalRow {
  orderId: number;
  symbol: Currency;
  total: unknown;
}

function orderNotFound(): AppError {
  return new AppError(404, CommonErrorCode.NotFound, 'Order not found');
}

function toTotals(sums: Map<Currency, number> | undefined): CurrencyTotal[] {
  return CURRENCIES.map((symbol) => ({ symbol, value: sums?.get(symbol) ?? 0 }));
}

function toSummary(order: OrderSummaryRecord, sums?: Map<Currency, number>): OrderSummaryDto {
  return {
    id: order.id,
    title: order.title,
    description: order.description,
    date: order.date.toISOString(),
    productsCount: order._count.products,
    totals: toTotals(sums),
    warehouse: order.warehouse,
  };
}

export class OrdersService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly events: EventBus,
  ) {}

  async list(): Promise<ListResponse<OrderSummaryDto>> {
    const [orders, totals] = await Promise.all([
      this.prisma.order.findMany({
        include: summaryInclude,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
      }),
      this.totalsByOrder(),
    ]);

    const items = orders.map((order) => toSummary(order, totals.get(order.id)));
    return { items, total: items.length };
  }

  async get(id: number): Promise<OrderDetailsDto> {
    const [order, totals] = await Promise.all([
      this.prisma.order.findUnique({
        where: { id },
        include: {
          ...summaryInclude,
          products: { include: productInclude, orderBy: { id: 'asc' } },
        },
      }),
      this.totalsByOrder(id),
    ]);

    if (!order) throw orderNotFound();

    return {
      ...toSummary(order, totals.get(id)),
      products: order.products.map(toProductDto),
    };
  }

  async create(input: CreateOrderData, actorId: number): Promise<OrderSummaryDto> {
    try {
      const order = await this.prisma.order.create({
        data: {
          title: input.title,
          description: input.description ?? null,
          date: input.date ? dateOnly(input.date) : new Date(),
          warehouseId: input.warehouseId ?? null,
          createdById: actorId,
        },
        include: summaryInclude,
      });

      const summary = toSummary(order);
      this.events.publish(InventoryEvent.OrderCreated, { order: summary }, actorId);
      return summary;
    } catch (err) {
      if (isForeignKeyViolation(err)) {
        throw new AppError(400, InventoryErrorCode.InvalidReference, 'Warehouse does not exist');
      }
      throw err;
    }
  }

  async remove(id: number, actorId: number): Promise<void> {
    const productIds = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        select: { products: { select: { id: true } } },
      });
      if (!order) return null;

      await tx.order.delete({ where: { id } });
      return order.products.map((product) => product.id);
    });

    if (!productIds) throw orderNotFound();

    this.events.publish(InventoryEvent.OrderDeleted, { orderId: id, productIds }, actorId);
  }

  private async totalsByOrder(orderId?: number): Promise<Map<number, Map<Currency, number>>> {
    const filter = orderId === undefined ? Prisma.empty : Prisma.sql`WHERE p.order_id = ${orderId}`;

    const rows = await this.prisma.$queryRaw<TotalRow[]>`
      SELECT p.order_id AS orderId, pp.symbol AS symbol, SUM(pp.value) AS total
      FROM product_prices pp
      JOIN products p ON p.id = pp.product_id
      ${filter}
      GROUP BY p.order_id, pp.symbol
    `;

    const totals = new Map<number, Map<Currency, number>>();
    for (const row of rows) {
      const id = toNumber(row.orderId);
      const sums = totals.get(id) ?? new Map<Currency, number>();
      sums.set(row.symbol, toNumber(row.total));
      totals.set(id, sums);
    }
    return totals;
  }
}
