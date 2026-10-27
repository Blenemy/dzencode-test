'use client';

import type { ReactNode } from 'react';
import { AnimatePresence } from 'motion/react';
import { useSelectedLayoutSegment } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { ListResponse, OrderSummaryDto } from '@dzen/shared';
import { cx } from '@/lib/cx';
import { useErrorMessage } from '@/lib/use-messages';
import { useHydrateOrders, useOrdersQuery } from './orders.api';
import { OrderRow } from './OrderRow';
import './orders.scss';

const SKELETON_ROWS = 4;

function toOrderId(segment: string | null): number | null {
  const id = Number(segment);
  return Number.isInteger(id) && id > 0 ? id : null;
}

interface OrdersViewProps {
  initial: ListResponse<OrderSummaryDto> | null;
  children: ReactNode;
}

export function OrdersView({ initial, children }: OrdersViewProps) {
  useHydrateOrders(initial);
  const t = useTranslations('orders');
  const errorMessage = useErrorMessage();
  const activeId = toOrderId(useSelectedLayoutSegment());
  const { data, error, isLoading, isFetching, refetch } = useOrdersQuery();
  const compact = activeId !== null;

  return (
    <section className={cx('orders', compact && 'orders--details')} aria-labelledby="orders-title">
      <header className="orders__header">
        <h1 id="orders-title" className="orders__title">
          {t('title')} <span className="orders__total">/ {data ? data.total : '…'}</span>
        </h1>
      </header>

      <div className="orders__body">
        <div className="orders__list">
          {isLoading && (
            <ul className="orders__rows" aria-hidden="true">
              {Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <li key={index} className="order-row order-row--placeholder placeholder-glow">
                  <span className="placeholder col-8" />
                </li>
              ))}
            </ul>
          )}

          {!data && error && (
            <div className="alert alert-danger d-flex align-items-center gap-3" role="alert">
              <span>
                {t('loadFailed')}. {errorMessage(error)}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger ms-auto"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                {t('retry')}
              </button>
            </div>
          )}

          {data?.items.length === 0 && <p className="orders__empty">{t('empty')}</p>}

          {data && data.items.length > 0 && (
            <ul className="orders__rows">
              <AnimatePresence initial={false}>
                {data.items.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    compact={compact}
                    active={order.id === activeId}
                  />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {children}
      </div>
    </section>
  );
}
