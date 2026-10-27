'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChartCard, StatTile } from '@/components/charts/ChartCard';
import { useGroupsQuery } from '@/features/catalog/catalog.api';
import {
  useHydrateGroupsPage,
  useStatsQuery,
  type GroupsPageData,
} from '@/features/stats/stats.api';
import { cx } from '@/lib/cx';
import { amountIn, formatAmount } from '@/lib/format-money';
import { useErrorMessage } from '@/lib/use-messages';
import { GroupBars, toGroupRows } from './GroupBars';
import { StatusMeter } from './StatusMeter';
import './groups.scss';

export function GroupsView({ initial }: { initial: GroupsPageData }) {
  useHydrateGroupsPage(initial);
  const t = useTranslations('groups');
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const stats = useStatsQuery();
  const groups = useGroupsQuery();
  const data = stats.data;
  const fetching = stats.isFetching || groups.isFetching;
  const error = stats.error ?? groups.error;

  const groupRows = useMemo(
    () =>
      groups.data && data ? toGroupRows(groups.data, data.totals.products, t('ungrouped')) : [],
    [groups.data, data, t],
  );
  const integer = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  if (!data || !groups.data) {
    return (
      <section className="groups" aria-labelledby="groups-title">
        <header className="groups__header">
          <h1 id="groups-title" className="groups__title">
            {t('title')} <span>/ …</span>
          </h1>
        </header>
        {error ? (
          <div className="alert alert-danger d-flex align-items-center gap-3" role="alert">
            <span>
              {t('loadFailed')}. {errorMessage(error)}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger ms-auto"
              onClick={() => {
                void stats.refetch();
                void groups.refetch();
              }}
            >
              {t('retry')}
            </button>
          </div>
        ) : (
          <div className="groups__skeleton placeholder-glow" aria-hidden="true">
            <span className="placeholder col-12" />
            <span className="placeholder col-12" />
          </div>
        )}
      </section>
    );
  }

  return (
    <section
      className={cx('groups', fetching && 'groups--fetching')}
      aria-labelledby="groups-title"
      aria-busy={fetching}
    >
      <header className="groups__header">
        <h1 id="groups-title" className="groups__title">
          {t('title')} <span>/ {groups.data.length}</span>
        </h1>
      </header>

      <div className="groups__kpis">
        <StatTile label={t('kpi.orders')} value={integer.format(data.totals.orders)} />
        <StatTile label={t('kpi.products')} value={integer.format(data.totals.products)} />
        <StatTile
          label={t('kpi.value')}
          value={`${formatAmount(amountIn(data.totals.value, 'UAH'))} UAH`}
          note={`${formatAmount(amountIn(data.totals.value, 'USD'))} $`}
        />
      </div>

      <div className="groups__grid">
        <ChartCard
          className="groups__by-group"
          title={t('byGroup')}
          hint={t('byGroupHint')}
          tableLabel={t('table')}
          table={
            <table>
              <thead>
                <tr>
                  <th scope="col">{t('columns.group')}</th>
                  <th scope="col">{t('columns.products')}</th>
                  <th scope="col">{t('columns.share')}</th>
                </tr>
              </thead>
              <tbody>
                {groupRows.map((row) => (
                  <tr key={row.key}>
                    <td>{row.title}</td>
                    <td>{row.count}</td>
                    <td>
                      {data.totals.products
                        ? Math.round((row.count / data.totals.products) * 100)
                        : 0}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          <GroupBars rows={groupRows} />
        </ChartCard>

        <ChartCard className="groups__by-status" title={t('byStatus')}>
          <StatusMeter byStatus={data.byStatus} />
        </ChartCard>
      </div>
    </section>
  );
}
