import type { ProductDto, ProductStatus } from '@dzen/shared';
import { amountIn } from '@/lib/format-money';

export interface CsvLabels {
  headers: string[];
  status: Record<ProductStatus, string>;
  condition: { new: string; used: string };
  types: Record<string, string>;
}

export interface CsvRequest {
  products: ProductDto[];
  labels: CsvLabels;
  delimiter: ';' | ',';
  decimal: ',' | '.';
}

const FORMULA_START = /^[=+\-@\t\r]/;

function cell(value: string, delimiter: string): string {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return /["\r\n]/.test(safe) || safe.includes(delimiter) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function money(value: number, decimal: string): string {
  return value.toFixed(2).replace('.', decimal);
}

export function buildCsv({ products, labels, delimiter, decimal }: CsvRequest): string {
  const rows = products.map((product) => [
    String(product.id),
    product.title,
    product.serialNumber,
    labels.types[product.type.name] ?? product.type.name,
    product.specification,
    labels.status[product.status],
    product.isNew ? labels.condition.new : labels.condition.used,
    product.guarantee.start.slice(0, 10),
    product.guarantee.end.slice(0, 10),
    money(amountIn(product.price, 'USD'), decimal),
    money(amountIn(product.price, 'UAH'), decimal),
    product.group?.title ?? '',
    product.user?.name ?? '',
    product.order.title,
    product.date.slice(0, 10),
  ]);

  const lines = [labels.headers, ...rows].map((row) =>
    row.map((value) => cell(value, delimiter)).join(delimiter),
  );
  return `﻿${lines.join('\r\n')}`;
}
