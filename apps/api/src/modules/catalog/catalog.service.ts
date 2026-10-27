import type { ProductGroupDto, ProductTypeDto, UserDto, WarehouseDto } from '@dzen/shared';
import type { PrismaClient } from '../../generated/prisma/client.js';

export class CatalogService {
  constructor(private readonly prisma: PrismaClient) {}

  async productTypes(): Promise<ProductTypeDto[]> {
    const types = await this.prisma.productType.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    return types.map((type) => ({
      id: type.id,
      name: type.name,
      productsCount: type._count.products,
    }));
  }

  async specifications(typeId?: number): Promise<string[]> {
    const rows = await this.prisma.product.findMany({
      where: { typeId },
      distinct: ['specification'],
      select: { specification: true },
      orderBy: { specification: 'asc' },
    });
    return rows.map((row) => row.specification);
  }

  async groups(): Promise<ProductGroupDto[]> {
    const groups = await this.prisma.productGroup.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { title: 'asc' },
    });
    return groups.map((group) => ({
      id: group.id,
      title: group.title,
      description: group.description,
      productsCount: group._count.products,
    }));
  }

  async users(): Promise<UserDto[]> {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        warehouse: { select: { id: true, name: true, city: true } },
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });
    return users.map(({ _count, ...user }) => ({ ...user, productsCount: _count.products }));
  }

  async warehouses(): Promise<WarehouseDto[]> {
    const warehouses = await this.prisma.warehouse.findMany({
      include: { _count: { select: { users: true, orders: true } } },
      orderBy: { id: 'asc' },
    });
    return warehouses.map(({ _count, createdAt: _createdAt, ...warehouse }) => ({
      ...warehouse,
      usersCount: _count.users,
      ordersCount: _count.orders,
    }));
  }
}
