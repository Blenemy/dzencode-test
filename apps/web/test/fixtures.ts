import type { OrderSummaryDto, ProductDto } from '@dzen/shared';

export function product(overrides: Partial<ProductDto> = {}): ProductDto {
  return {
    id: 1,
    serialNumber: 'SN-0001',
    isNew: true,
    photo: null,
    title: 'Product',
    type: { id: 1, name: 'Monitors' },
    specification: '27 inch',
    status: 'FREE',
    guarantee: { start: '2026-01-01T00:00:00.000Z', end: '2027-01-01T00:00:00.000Z' },
    price: [
      { value: 100, symbol: 'USD', isDefault: false },
      { value: 4150.5, symbol: 'UAH', isDefault: true },
    ],
    order: { id: 1, title: 'Order' },
    group: null,
    user: null,
    date: '2026-01-15T10:00:00.000Z',
    ...overrides,
  };
}

export function order(overrides: Partial<OrderSummaryDto> = {}): OrderSummaryDto {
  return {
    id: 1,
    title: 'Order',
    description: null,
    date: '2026-01-15T10:00:00.000Z',
    productsCount: 0,
    totals: [],
    warehouse: null,
    ...overrides,
  };
}
