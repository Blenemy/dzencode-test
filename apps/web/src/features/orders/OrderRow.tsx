'use client';

import { motion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import type { OrderSummaryDto } from '@dzen/shared';
import { Icon } from '@/components/icons/Icon';
import { Link } from '@/i18n/navigation';
import { cx } from '@/lib/cx';
import { daySlashMonthSlashYear, monthOfYear } from '@/lib/format-date';
import { formatAmount, totalIn } from '@/lib/format-money';

interface OrderRowProps {
  order: OrderSummaryDto;
  compact: boolean;
  active: boolean;
}

export function OrderRow({ order, compact, active }: OrderRowProps) {
  const t = useTranslations('orders');
  const locale = useLocale();
  const usd = totalIn(order.totals, 'USD');
  const uah = totalIn(order.totals, 'UAH');

  return (
    <motion.li
      layout="position"
      className={cx('order-row', compact && 'order-row--compact', active && 'order-row--active')}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40, transition: { duration: 0.25 } }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/orders/${order.id}`}
        scroll={false}
        className="order-row__link"
        aria-label={t('open', { title: order.title })}
        aria-current={active ? 'page' : undefined}
      />
      <span className="order-row__title">{order.title}</span>
      <span className="order-row__icon" aria-hidden="true">
        <Icon name="list" size={20} />
      </span>
      <span className="order-row__count">
        <span className="order-row__count-value">{order.productsCount}</span>
        <span className="order-row__count-label">
          {t('products', { count: order.productsCount })}
        </span>
      </span>
      <span className="order-row__date">
        <span className="order-row__date-short">{monthOfYear(order.date)}</span>
        <time className="order-row__date-full" dateTime={order.date}>
          {daySlashMonthSlashYear(order.date, locale)}
        </time>
      </span>
      <span className="order-row__sum">
        {usd > 0 && <span className="order-row__sum-secondary">{formatAmount(usd)} $</span>}
        <span className="order-row__sum-primary">
          {formatAmount(uah)} <span className="order-row__currency">UAH</span>
        </span>
      </span>
      {active && (
        <span className="order-row__arrow" aria-hidden="true">
          <Icon name="chevronRight" size={16} />
        </span>
      )}
    </motion.li>
  );
}
