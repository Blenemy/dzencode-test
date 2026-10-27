import {
  CommonErrorCode,
  InventoryErrorCode,
  InventoryEvent,
  type CreateProductData,
  type PageResponse,
  type ProductDto,
  type ProductQuery,
} from '@dzen/shared';
import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import type { EventBus } from '../../events/bus.js';
import {
  dateOnly,
  isForeignKeyViolation,
  isRecordMissing,
  isUniqueViolation,
} from '../../lib/prisma.js';
import { AppError } from '../../middleware/error.js';
import { productInclude, toProductDto } from './product.mapper.js';

function productNotFound(): AppError {
  return new AppError(404, CommonErrorCode.NotFound, 'Product not found');
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildWhere(query: ProductQuery): Prisma.ProductWhereInput {
  return {
    typeId: query.typeId,
    specification: query.specification,
    status: query.status,
    orderId: query.orderId,
    ...(query.q && {
      OR: [{ title: { contains: query.q } }, { serialNumber: { contains: query.q } }],
    }),
  };
}

export class ProductsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly events: EventBus,
  ) {}

  async list(query: ProductQuery): Promise<PageResponse<ProductDto>> {
    const where = buildWhere(query);

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: products.map(toProductDto),
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  async get(id: number): Promise<ProductDto> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
    if (!product) throw productNotFound();
    return toProductDto(product);
  }

  async create(input: CreateProductData, actorId: number): Promise<ProductDto> {
    try {
      const product = await this.prisma.product.create({
        data: {
          title: input.title,
          serialNumber: input.serialNumber,
          isNew: input.isNew,
          photo: input.photo ?? null,
          specification: input.specification,
          status: input.status,
          guaranteeStart: dateOnly(input.guaranteeStart),
          guaranteeEnd: dateOnly(input.guaranteeEnd),
          date: new Date(),
          type: { connect: { id: input.typeId } },
          order: { connect: { id: input.orderId } },
          ...(input.groupId && { group: { connect: { id: input.groupId } } }),
          ...(input.userId && { user: { connect: { id: input.userId } } }),
          prices: {
            create: [
              {
                symbol: 'USD',
                value: roundMoney(input.priceUsd),
                isDefault: input.defaultCurrency === 'USD',
              },
              {
                symbol: 'UAH',
                value: roundMoney(input.priceUah),
                isDefault: input.defaultCurrency === 'UAH',
              },
            ],
          },
        },
        include: productInclude,
      });

      const dto = toProductDto(product);
      this.events.publish(InventoryEvent.ProductCreated, { product: dto }, actorId);
      return dto;
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new AppError(409, InventoryErrorCode.SerialTaken, 'Serial number is already used');
      }
      if (isForeignKeyViolation(err) || isRecordMissing(err)) {
        throw new AppError(
          400,
          InventoryErrorCode.InvalidReference,
          'Order, type, group or user does not exist',
        );
      }
      throw err;
    }
  }

  async remove(id: number, actorId: number): Promise<void> {
    const deleted = await this.prisma.product
      .delete({ where: { id }, select: { id: true, orderId: true } })
      .catch((err: unknown) => {
        if (isRecordMissing(err)) return null;
        throw err;
      });

    if (!deleted) throw productNotFound();

    this.events.publish(
      InventoryEvent.ProductDeleted,
      { productId: deleted.id, orderId: deleted.orderId },
      actorId,
    );
  }
}
