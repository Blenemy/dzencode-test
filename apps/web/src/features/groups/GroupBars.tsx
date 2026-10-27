'use client';

import { useTranslations } from 'next-intl';
import type { ProductGroupDto } from '@dzen/shared';
import { cx } from '@/lib/cx';

export interface GroupBarRow {
  key: string;
  title: string;
  description: string | null;
  count: number;
  ungrouped?: boolean;
}

export function toGroupRows(
  groups: ProductGroupDto[],
  totalProducts: number,
  ungroupedTitle: string,
): GroupBarRow[] {
  const rows: GroupBarRow[] = [...groups]
    .sort((a, b) => b.productsCount - a.productsCount)
    .map((group) => ({
      key: String(group.id),
      title: group.title,
      description: group.description,
      count: group.productsCount,
    }));
  const ungrouped = totalProducts - rows.reduce((sum, row) => sum + row.count, 0);
  if (ungrouped > 0) {
    rows.push({
      key: 'none',
      title: ungroupedTitle,
      description: null,
      count: ungrouped,
      ungrouped: true,
    });
  }
  return rows;
}

export function GroupBars({ rows }: { rows: GroupBarRow[] }) {
  const t = useTranslations('groups');
  const max = Math.max(1, ...rows.map((row) => row.count));

  return (
    <ul className="group-bars">
      {rows.map((row) => (
        <li
          key={row.key}
          className={cx('group-bars__row', row.ungrouped && 'group-bars__row--muted')}
        >
          <div className="group-bars__head">
            <span className="group-bars__title">{row.title}</span>
            <span className="group-bars__value">{t('productsCount', { count: row.count })}</span>
          </div>
          {row.description && <p className="group-bars__description">{row.description}</p>}
          <span className="group-bars__bar" style={{ width: `${(row.count / max) * 100}%` }} />
        </li>
      ))}
    </ul>
  );
}
