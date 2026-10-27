'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { ProductDto } from '@dzen/shared';
import { TrashButton } from '@/components/buttons/TrashButton';
import { deleteRequested } from '@/features/deletion/deletion.slice';
import { Link } from '@/i18n/navigation';
import { daySlashMonthSlashYear, monthOfYear, numericDate } from '@/lib/format-date';
import { amountIn, formatAmount } from '@/lib/format-money';
import { useAppDispatch } from '@/store/hooks';
import { ProductStatus, ProductSummary } from './ProductSummary';

const EMPTY = '—';

export function ProductRow({ product }: { product: ProductDto }) {
  const t = useTranslations('products');
  const locale = useLocale();
  const dispatch = useAppDispatch();
  const usd = amountIn(product.price, 'USD');
  const uah = amountIn(product.price, 'UAH');

  return (
    <tr className="product-row">
      <td className="product-row__summary">
        <ProductSummary product={product} />
      </td>
      <td className="product-row__status" data-label={t('columns.status')}>
        <ProductStatus status={product.status} />
      </td>
      <td className="product-row__guarantee" data-label={t('columns.guarantee')}>
        <span className="product-row__line">
          <span className="product-row__muted">{t('guaranteeFrom')}</span>{' '}
          {numericDate(product.guarantee.start)}
        </span>
        <span className="product-row__line">
          <span className="product-row__muted">{t('guaranteeTo')}</span>{' '}
          {numericDate(product.guarantee.end)}
        </span>
      </td>
      <td className="product-row__condition" data-label={t('columns.condition')}>
        {product.isNew ? t('condition.new') : t('condition.used')}
      </td>
      <td className="product-row__price" data-label={t('columns.price')}>
        <span className="product-row__line product-row__muted">{formatAmount(usd)} $</span>
        <span className="product-row__line">
          {formatAmount(uah)} <span className="product-row__muted">UAH</span>
        </span>
      </td>
      <td className="product-row__group" data-label={t('columns.group')}>
        {product.group ? <span className="product-row__ref">{product.group.title}</span> : EMPTY}
      </td>
      <td className="product-row__user" data-label={t('columns.user')}>
        {product.user ? <span className="product-row__ref">{product.user.name}</span> : EMPTY}
      </td>
      <td className="product-row__order" data-label={t('columns.order')}>
        <Link
          className="product-row__ref product-row__link"
          href={`/orders/${product.order.id}`}
          prefetch={false}
          title={t('openOrder', { title: product.order.title })}
        >
          {product.order.title}
        </Link>
      </td>
      <td className="product-row__date" data-label={t('columns.date')}>
        <span className="product-row__line product-row__muted product-row__date-short">
          {monthOfYear(product.date)}
        </span>
        <time className="product-row__line" dateTime={product.date}>
          {daySlashMonthSlashYear(product.date, locale)}
        </time>
      </td>
      <td className="product-row__action">
        <TrashButton
          label={t('delete', { title: product.title })}
          onClick={() => dispatch(deleteRequested({ kind: 'product', product }))}
        />
      </td>
    </tr>
  );
}
