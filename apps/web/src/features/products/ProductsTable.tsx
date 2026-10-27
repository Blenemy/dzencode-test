'use client';

import { useTranslations } from 'next-intl';
import type { ProductDto } from '@dzen/shared';
import { cx } from '@/lib/cx';
import { ProductRow } from './ProductRow';

const COLUMNS = [
  'product',
  'status',
  'guarantee',
  'condition',
  'price',
  'group',
  'user',
  'order',
  'date',
  'actions',
] as const;

interface ProductsTableProps {
  products: ProductDto[];
  fetching: boolean;
}

export function ProductsTable({ products, fetching }: ProductsTableProps) {
  const t = useTranslations('products');

  return (
    <div className="products__scroller">
      <table
        className={cx('products-table', fetching && 'products-table--fetching')}
        aria-busy={fetching}
      >
        <caption className="visually-hidden">{t('title')}</caption>
        <thead className="visually-hidden">
          <tr>
            {COLUMNS.map((column) => (
              <th key={column} scope="col">
                {t(`columns.${column}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <ProductRow key={product.id} product={product} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
