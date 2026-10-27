'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useLocale, useTranslations } from 'next-intl';
import { ChartCard, StatTile } from '@/components/charts/ChartCard';
import { useGroupsQuery } from '@/features/catalog/catalog.api';
import { useProductTypeName } from '@/features/catalog/use-type-name';
import {
  useHydrateGroupsPage,
  useStatsQuery,
  type GroupsPageData,
} from '@/features/stats/stats.api';
import { cx } from '@/lib/cx';
import { amountIn, formatAmount } from '@/lib/format-money';
import { useErrorMessage } from '@/lib/use-messages';
import {
  MONTHLY_CHART_HEIGHT,
  toMonthPoints,
  typesChartHeight,
  type TypePoint,
} from './chart-data';
import { GroupBars, toGroupRows } from './GroupBars';
import { StatusMeter } from './StatusMeter';
import './groups.scss';

function ChartPlaceholder({ height }: { height: number }) {
  return <div className="chart-card__placeholder" style={{ height }} aria-hidden="true" />;
}

const TypesChart = dynamic(() => import('./TypesChart').then((module) => module.TypesChart), {
  ssr: false,
  loading: () => <ChartPlaceholder height={typesChartHeight(6)} />,
});

const MonthlyValueChart = dynamic(
  () => import('./MonthlyValueChart').then((module) => module.MonthlyValueChart),
  { ssr: false, loading: () => <ChartPlaceholder height={MONTHLY_CHART_HEIGHT} /> },
);

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
  const typeName = useProductTypeName();
  const typePoints = useMemo<TypePoint[]>(
    () => (data ? data.byType.map((row) => ({ name: typeName(row.type), count: row.count })) : []),
    [data, typeName],
  );
  const monthPoints = useMemo(
    () => (data ? toMonthPoints(data.byMonth, locale) : []),
    [data, locale],
  );

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

        <div className="groups__side">
          <ChartCard className="groups__by-status" title={t('byStatus')}>
            <StatusMeter byStatus={data.byStatus} />
          </ChartCard>

          <ChartCard
            title={t('byType')}
            tableLabel={t('table')}
            table={
              <table>
                <thead>
                  <tr>
                    <th scope="col">{t('columns.type')}</th>
                    <th scope="col">{t('columns.products')}</th>
                  </tr>
                </thead>
                <tbody>
                  {typePoints.map((point) => (
                    <tr key={point.name}>
                      <td>{point.name}</td>
                      <td>{point.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            }
          >
            <TypesChart data={typePoints} />
          </ChartCard>
        </div>

        <ChartCard
          className="groups__wide"
          title={t('byMonth')}
          hint={t('byMonthHint')}
          tableLabel={t('table')}
          table={
            <table>
              <thead>
                <tr>
                  <th scope="col">{t('columns.month')}</th>
                  <th scope="col">{t('columns.orders')}</th>
                  <th scope="col">UAH</th>
                  <th scope="col">USD</th>
                </tr>
              </thead>
              <tbody>
                {monthPoints.map((point) => (
                  <tr key={point.month}>
                    <td>{point.full}</td>
                    <td>{point.orders}</td>
                    <td>{formatAmount(point.uah)}</td>
                    <td>{formatAmount(point.usd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        >
          {monthPoints.length > 0 ? (
            <MonthlyValueChart data={monthPoints} />
          ) : (
            <p className="text-muted mb-0">{t('empty')}</p>
          )}
        </ChartCard>
      </div>
    </section>
  );
}
