'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Currency } from '@dzen/shared';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { chartTokens } from '@/components/charts/chart-tokens';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { formatAmount } from '@/lib/format-money';
import { MONTHLY_CHART_HEIGHT, type MonthPoint } from './chart-data';

export function MonthlyValueChart({ data, currency }: { data: MonthPoint[]; currency: Currency }) {
  const key = currency === 'USD' ? 'usd' : 'uah';
  const other: Currency = currency === 'USD' ? 'UAH' : 'USD';
  const t = useTranslations('groups');
  const locale = useLocale();
  const compact = useMemo(
    () => new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }),
    [locale],
  );

  return (
    <ResponsiveContainer
      width="100%"
      height={MONTHLY_CHART_HEIGHT}
      initialDimension={{ width: 900, height: MONTHLY_CHART_HEIGHT }}
    >
      <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={chartTokens.grid} />
        <XAxis
          dataKey="short"
          tickLine={false}
          axisLine={{ stroke: chartTokens.grid }}
          tick={{ fill: chartTokens.textMuted, fontSize: 11 }}
          minTickGap={16}
        />
        <YAxis
          tickFormatter={(value: number) => compact.format(value)}
          width={56}
          tickLine={false}
          axisLine={false}
          tick={{ fill: chartTokens.textMuted, fontSize: 11 }}
        />
        <Tooltip
          cursor={{ stroke: chartTokens.crosshair, strokeWidth: 1 }}
          content={({ active, payload }) => {
            const point = payload?.[0]?.payload as MonthPoint | undefined;
            if (!active || !point) return null;
            return (
              <ChartTooltip
                title={point.full}
                rows={[
                  { label: currency, value: formatAmount(point[key]), color: chartTokens.series },
                  { label: other, value: formatAmount(point[other === 'USD' ? 'usd' : 'uah']) },
                  { label: t('columns.orders'), value: String(point.orders) },
                ]}
              />
            );
          }}
        />
        <Area
          type="monotone"
          dataKey={key}
          stroke={chartTokens.series}
          strokeWidth={2}
          fill={chartTokens.series}
          fillOpacity={0.1}
          dot={false}
          activeDot={{
            r: 5,
            fill: chartTokens.series,
            stroke: chartTokens.surface,
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
