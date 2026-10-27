'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import type { OrderDetailsDto } from '@dzen/shared';
import { Icon } from '@/components/icons/Icon';
import { ProductStatus, ProductSummary } from '@/features/products/ProductSummary';
import { useRouter } from '@/i18n/navigation';
import { errorStatus } from '@/lib/api-error';
import { useEntranceAnimation } from '@/lib/use-entrance';
import { useErrorMessage } from '@/lib/use-messages';
import { useHydrateOrder, useOrderQuery } from './orders.api';

const HIDDEN = { opacity: 0, x: 48 };
const SHOWN = { opacity: 1, x: 0 };
const SKELETON_ROWS = 3;

interface OrderDetailsPanelProps {
  id: number;
  initial: OrderDetailsDto | null;
}

export function OrderDetailsPanel({ id, initial }: OrderDetailsPanelProps) {
  useHydrateOrder(initial);
  const t = useTranslations('orders');
  const errorMessage = useErrorMessage();
  const router = useRouter();
  const animateEntrance = useEntranceAnimation();
  const [closing, setClosing] = useState(false);
  const { data, error, isFetching, refetch } = useOrderQuery(id);
  const gone = errorStatus(error) === 404;
  const titleId = `order-${id}-title`;

  useEffect(() => {
    if (gone) router.replace('/orders', { scroll: false });
  }, [gone, router]);

  return (
    <motion.section
      className="order-details"
      aria-labelledby={titleId}
      initial={animateEntrance ? HIDDEN : false}
      animate={closing ? HIDDEN : SHOWN}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onAnimationComplete={() => {
        if (closing) router.push('/orders', { scroll: false });
      }}
    >
      <button
        type="button"
        className="order-details__close"
        aria-label={t('close')}
        title={t('close')}
        onClick={() => setClosing(true)}
      >
        <Icon name="close" size={14} />
      </button>

      {data ? (
        <>
          <h2 id={titleId} className="order-details__title">
            {data.title}
          </h2>

          {data.products.length === 0 ? (
            <p className="order-details__empty">{t('noProducts')}</p>
          ) : (
            <ul className="order-details__products">
              <AnimatePresence initial={false}>
                {data.products.map((product) => (
                  <motion.li
                    key={product.id}
                    layout="position"
                    className="order-details__product"
                    exit={{ opacity: 0, x: -32, transition: { duration: 0.25 } }}
                  >
                    <ProductSummary product={product} />
                    <ProductStatus status={product.status} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </>
      ) : error && !gone ? (
        <div className="order-details__error alert alert-danger" role="alert">
          <p className="mb-2">
            {t('detailsFailed')}. {errorMessage(error)}
          </p>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {t('retry')}
          </button>
        </div>
      ) : (
        <div className="order-details__skeleton placeholder-glow" aria-hidden="true">
          <span id={titleId} className="placeholder col-7" />
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <span key={index} className="placeholder col-12" />
          ))}
        </div>
      )}
    </motion.section>
  );
}
