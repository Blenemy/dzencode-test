import type { ProductDto } from '@dzen/shared';
import type { Prisma } from '../../generated/prisma/client.js';

export const productInclude = {
  type: { select: { id: true, name: true } },
  order: { select: { id: true, title: true } },
  group: { select: { id: true, title: true } },
  user: { select: { id: true, name: true } },
  prices: { orderBy: { symbol: 'asc' } },
} satisfies Prisma.ProductInclude;

export type ProductRecord = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export function toProductDto(product: ProductRecord): ProductDto {
  return {
    id: product.id,
    serialNumber: product.serialNumber,
    isNew: product.isNew,
    photo: product.photo,
    title: product.title,
    type: product.type,
    specification: product.specification,
    status: product.status,
    guarantee: {
      start: product.guaranteeStart.toISOString(),
      end: product.guaranteeEnd.toISOString(),
    },
    price: product.prices.map((price) => ({
      value: price.value.toNumber(),
      symbol: price.symbol,
      isDefault: price.isDefault,
    })),
    order: product.order,
    group: product.group,
    user: product.user,
    date: product.date.toISOString(),
  };
}
