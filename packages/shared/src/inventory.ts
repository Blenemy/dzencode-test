import { z } from 'zod';

export const PRODUCT_STATUSES = ['FREE', 'IN_REPAIR'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const CURRENCIES = ['USD', 'UAH'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const UPLOAD_MAX_BYTES = 2 * 1024 * 1024;
export const UPLOAD_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const PRODUCTS_PAGE_LIMIT_MAX = 100;

const id = z.number().int().positive();
const isoDateTime = z.string();

export const priceSchema = z.object({
  value: z.number(),
  symbol: z.enum(CURRENCIES),
  isDefault: z.boolean(),
});

export const currencyTotalSchema = z.object({
  symbol: z.enum(CURRENCIES),
  value: z.number(),
});

const titledRef = z.object({ id, title: z.string() });
const namedRef = z.object({ id, name: z.string() });
const warehouseRef = z.object({ id, name: z.string(), city: z.string() });

export const productSchema = z.object({
  id,
  serialNumber: z.string(),
  isNew: z.boolean(),
  photo: z.string().nullable(),
  title: z.string(),
  type: namedRef,
  specification: z.string(),
  status: z.enum(PRODUCT_STATUSES),
  guarantee: z.object({ start: isoDateTime, end: isoDateTime }),
  price: z.array(priceSchema),
  order: titledRef,
  group: titledRef.nullable(),
  user: namedRef.nullable(),
  date: isoDateTime,
});

export const orderSummarySchema = z.object({
  id,
  title: z.string(),
  description: z.string().nullable(),
  date: isoDateTime,
  productsCount: z.number().int(),
  totals: z.array(currencyTotalSchema),
  warehouse: warehouseRef.nullable(),
});

export const orderDetailsSchema = orderSummarySchema.extend({
  products: z.array(productSchema),
});

export const productTypeSchema = z.object({
  id,
  name: z.string(),
  productsCount: z.number().int(),
});

export const productGroupSchema = z.object({
  id,
  title: z.string(),
  description: z.string().nullable(),
  productsCount: z.number().int(),
});

export const userSchema = z.object({
  id,
  name: z.string(),
  email: z.string(),
  avatar: z.string().nullable(),
  warehouse: warehouseRef.nullable(),
  productsCount: z.number().int(),
});

export const warehouseSchema = z.object({
  id,
  name: z.string(),
  city: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  usersCount: z.number().int(),
  ordersCount: z.number().int(),
});

export const statsSchema = z.object({
  totals: z.object({
    orders: z.number().int(),
    products: z.number().int(),
    value: z.array(currencyTotalSchema),
  }),
  byType: z.array(z.object({ type: z.string(), count: z.number().int() })),
  byStatus: z.array(z.object({ status: z.enum(PRODUCT_STATUSES), count: z.number().int() })),
  byGroup: z.array(z.object({ group: z.string().nullable(), count: z.number().int() })),
  byMonth: z.array(
    z.object({ month: z.string(), orders: z.number().int(), value: z.array(currencyTotalSchema) }),
  ),
});

export const uploadResultSchema = z.object({ url: z.string() });

export type Price = z.infer<typeof priceSchema>;
export type CurrencyTotal = z.infer<typeof currencyTotalSchema>;
export type ProductDto = z.infer<typeof productSchema>;
export type OrderSummaryDto = z.infer<typeof orderSummarySchema>;
export type OrderDetailsDto = z.infer<typeof orderDetailsSchema>;
export type ProductTypeDto = z.infer<typeof productTypeSchema>;
export type ProductGroupDto = z.infer<typeof productGroupSchema>;
export type UserDto = z.infer<typeof userSchema>;
export type WarehouseDto = z.infer<typeof warehouseSchema>;
export type StatsDto = z.infer<typeof statsSchema>;
export type UploadResult = z.infer<typeof uploadResultSchema>;

export interface ListResponse<T> {
  items: T[];
  total: number;
}

export interface PageResponse<T> extends ListResponse<T> {
  page: number;
  limit: number;
}

const blankToUndefined = (value: unknown) =>
  value === '' || value === null || value === undefined ? undefined : value;

const optionalId = z.preprocess(
  blankToUndefined,
  z.coerce.number({ error: 'validation.number' }).int().positive().optional(),
);

const requiredId = z.coerce
  .number({ error: 'validation.required' })
  .int({ error: 'validation.required' })
  .positive({ error: 'validation.required' });

const requiredText = (max: number) =>
  z
    .string()
    .trim()
    .min(1, { error: 'validation.required' })
    .max(max, { error: 'validation.tooLong' });

const isoDate = z.iso.date({ error: 'validation.date' });

const money = z.coerce
  .number({ error: 'validation.number' })
  .positive({ error: 'validation.positive' })
  .max(10_000_000, { error: 'validation.tooLarge' });

export const createOrderSchema = z.object({
  title: requiredText(255),
  description: z.preprocess(
    blankToUndefined,
    z.string().trim().max(2000, { error: 'validation.tooLong' }).optional(),
  ),
  date: z.preprocess(blankToUndefined, isoDate.optional()),
  warehouseId: optionalId,
});

export const createProductSchema = z
  .object({
    title: requiredText(255),
    serialNumber: requiredText(64),
    typeId: requiredId,
    specification: requiredText(255),
    isNew: z.boolean(),
    status: z.enum(PRODUCT_STATUSES, { error: 'validation.required' }),
    guaranteeStart: isoDate,
    guaranteeEnd: isoDate,
    priceUsd: money,
    priceUah: money,
    defaultCurrency: z.enum(CURRENCIES).default('UAH'),
    orderId: requiredId,
    groupId: optionalId,
    userId: optionalId,
    photo: z.preprocess(
      blankToUndefined,
      z
        .string()
        .max(255)
        .regex(/^\/(uploads|products)\/[A-Za-z0-9._-]+$/, { error: 'validation.photo' })
        .optional(),
    ),
  })
  .refine((input) => input.guaranteeEnd >= input.guaranteeStart, {
    path: ['guaranteeEnd'],
    error: 'validation.guaranteeRange',
  });

export const productQuerySchema = z.object({
  typeId: optionalId,
  specification: z.preprocess(blankToUndefined, z.string().trim().max(255).optional()),
  status: z.preprocess(blankToUndefined, z.enum(PRODUCT_STATUSES).optional()),
  orderId: optionalId,
  q: z.preprocess(blankToUndefined, z.string().trim().max(100).optional()),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(PRODUCTS_PAGE_LIMIT_MAX).default(20),
});

export const specificationQuerySchema = z.object({ typeId: optionalId });

export const idParamSchema = z.object({ id: requiredId });

export type CreateOrderInput = z.input<typeof createOrderSchema>;
export type CreateOrderData = z.output<typeof createOrderSchema>;
export type CreateProductInput = z.input<typeof createProductSchema>;
export type CreateProductData = z.output<typeof createProductSchema>;
export type ProductQuery = z.output<typeof productQuerySchema>;

export const InventoryEvent = {
  OrderCreated: 'order.created',
  OrderDeleted: 'order.deleted',
  ProductCreated: 'product.created',
  ProductDeleted: 'product.deleted',
} as const;

export interface InventoryEventPayloads {
  'order.created': { order: OrderSummaryDto };
  'order.deleted': { orderId: number; productIds: number[] };
  'product.created': { product: ProductDto };
  'product.deleted': { productId: number; orderId: number };
}

export type InventoryEventName = keyof InventoryEventPayloads;

export interface InventoryEventEnvelope<K extends InventoryEventName = InventoryEventName> {
  name: K;
  payload: InventoryEventPayloads[K];
  actorId: number | null;
  occurredAt: string;
}

export const InventoryErrorCode = {
  InvalidReference: 'INVALID_REFERENCE',
  SerialTaken: 'SERIAL_TAKEN',
  FileTooLarge: 'FILE_TOO_LARGE',
  UnsupportedFile: 'UNSUPPORTED_FILE',
} as const;
