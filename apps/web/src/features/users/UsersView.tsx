'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { ChartCard } from '@/components/charts/ChartCard';
import { Avatar } from '@/components/layout/Avatar';
import { useUsersQuery, useWarehousesQuery } from '@/features/catalog/catalog.api';
import { cx } from '@/lib/cx';
import { useErrorMessage } from '@/lib/use-messages';
import { selectUser } from '@/store/auth.slice';
import { useAppSelector } from '@/store/hooks';
import {
  matchesWarehouse,
  useHydrateUsersPage,
  type UsersPageData,
  type WarehouseFilter,
} from './users-page';
import './users.scss';

const WarehouseMap = dynamic(() => import('./WarehouseMap').then((module) => module.WarehouseMap), {
  ssr: false,
  loading: () => (
    <div className="warehouse-map__canvas chart-card__placeholder" aria-hidden="true" />
  ),
});

export function UsersView({ initial }: { initial: UsersPageData }) {
  useHydrateUsersPage(initial);
  const t = useTranslations('users');
  const errorMessage = useErrorMessage();
  const me = useAppSelector(selectUser);
  const users = useUsersQuery();
  const warehouses = useWarehousesQuery();
  const [filter, setFilter] = useState<WarehouseFilter>(null);

  const visible = useMemo(
    () => (users.data ?? []).filter((user) => matchesWarehouse(user, filter)),
    [users.data, filter],
  );
  const withoutWarehouse = (users.data ?? []).filter((user) => user.warehouse === null).length;
  const error = users.error ?? warehouses.error;

  const toggle = (next: WarehouseFilter) =>
    setFilter((current) => (current === next ? null : next));

  return (
    <section className="users" aria-labelledby="users-title">
      <header className="users__header">
        <h1 id="users-title" className="users__title">
          {t('title')} <span>/ {users.data ? users.data.length : '…'}</span>
        </h1>
      </header>

      {error && !(users.data && warehouses.data) && (
        <div className="alert alert-danger d-flex align-items-center gap-3" role="alert">
          <span>
            {t('loadFailed')}. {errorMessage(error)}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-auto"
            onClick={() => {
              void users.refetch();
              void warehouses.refetch();
            }}
          >
            {t('retry')}
          </button>
        </div>
      )}

      {users.data && warehouses.data && (
        <>
          <div className="warehouse-filter" role="group" aria-label={t('filter')}>
            <button
              type="button"
              className={cx(
                'warehouse-filter__chip',
                filter === null && 'warehouse-filter__chip--active',
              )}
              aria-pressed={filter === null}
              onClick={() => setFilter(null)}
            >
              {t('all')}
              <span className="warehouse-filter__count">{users.data.length}</span>
            </button>
            {warehouses.data.map((warehouse) => (
              <button
                key={warehouse.id}
                type="button"
                className={cx(
                  'warehouse-filter__chip',
                  filter === warehouse.id && 'warehouse-filter__chip--active',
                )}
                aria-pressed={filter === warehouse.id}
                onClick={() => toggle(warehouse.id)}
              >
                {warehouse.city}
                <span className="warehouse-filter__count">{warehouse.usersCount}</span>
              </button>
            ))}
            {withoutWarehouse > 0 && (
              <button
                type="button"
                className={cx(
                  'warehouse-filter__chip',
                  filter === 'none' && 'warehouse-filter__chip--active',
                )}
                aria-pressed={filter === 'none'}
                onClick={() => toggle('none')}
              >
                {t('noWarehouse')}
                <span className="warehouse-filter__count">{withoutWarehouse}</span>
              </button>
            )}
          </div>

          <div className="users__grid">
            <ChartCard className="users__map" title={t('map')} hint={t('mapHint')}>
              <WarehouseMap
                warehouses={warehouses.data}
                selected={typeof filter === 'number' ? filter : null}
                onSelect={toggle}
              />
            </ChartCard>

            <ChartCard className="users__list" title={t('list')}>
              {visible.length === 0 ? (
                <p className="users__empty">{t('empty')}</p>
              ) : (
                <ul className="user-list">
                  <AnimatePresence initial={false} mode="popLayout">
                    {visible.map((user) => (
                      <motion.li
                        key={user.id}
                        layout
                        className="user-list__item"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Avatar user={user} size={44} />
                        <div className="user-list__info">
                          <span className="user-list__name">
                            {user.name}
                            {me?.id === user.id && (
                              <span className="user-list__badge">{t('you')}</span>
                            )}
                          </span>
                          <span className="user-list__email">{user.email}</span>
                        </div>
                        <div className="user-list__meta">
                          <span className="user-list__warehouse">
                            {user.warehouse ? user.warehouse.city : t('noWarehouse')}
                          </span>
                          <span className="user-list__products">
                            {t('productsCount', { count: user.productsCount })}
                          </span>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </ChartCard>
          </div>
        </>
      )}
    </section>
  );
}
