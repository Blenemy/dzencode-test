'use client';

import { useTranslations } from 'next-intl';
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { chartTokens } from '@/components/charts/chart-tokens';
import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { typesChartHeight, type TypePoint } from './chart-data';

export function TypesChart({ data }: { data: TypePoint[] }) {
  const t = useTranslations('groups');
  const height = typesChartHeight(data.length);

  return (
    <ResponsiveContainer width="100%" height={height} initialDimension={{ width: 480, height }}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 0 }}>
        <XAxis type="number" hide domain={[0, 'dataMax']} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          width={104}
          axisLine={false}
          tickLine={false}
          tick={{ fill: chartTokens.textPrimary, fontSize: 12 }}
        />
        <Tooltip
          cursor={{ fill: chartTokens.cursor }}
          content={({ active, payload }) => {
            const point = payload?.[0]?.payload as TypePoint | undefined;
            if (!active || !point) return null;
            return (
              <ChartTooltip
                title={point.name}
                rows={[
                  {
                    label: t('columns.products'),
                    value: String(point.count),
                    color: chartTokens.series,
                  },
                ]}
              />
            );
          }}
        />
        <Bar dataKey="count" fill={chartTokens.series} barSize={16} radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="count"
            position="right"
            offset={8}
            fill={chartTokens.textPrimary}
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
