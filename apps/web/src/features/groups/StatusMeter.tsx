'use client';

import { useTranslations } from 'next-intl';
import { PRODUCT_STATUSES, type StatsDto } from '@dzen/shared';
import { cx } from '@/lib/cx';

export function StatusMeter({ byStatus }: { byStatus: StatsDto['byStatus'] }) {
  const t = useTranslations('products');
  const counts = PRODUCT_STATUSES.map((status) => ({
    status,
    count: byStatus.find((row) => row.status === status)?.count ?? 0,
  }));
  const total = counts.reduce((sum, row) => sum + row.count, 0);
  const share = (count: number) => (total ? Math.round((count / total) * 100) : 0);

  return (
    <div className="status-meter">
      <div className="status-meter__bar" aria-hidden="true">
        {counts
          .filter((row) => row.count > 0)
          .map((row) => (
            <span
              key={row.status}
              className={cx('status-meter__segment', `status-meter__segment--${row.status}`)}
              style={{ flexGrow: row.count }}
            />
          ))}
      </div>
      <ul className="status-meter__legend">
        {counts.map((row) => (
          <li key={row.status} className="status-meter__item">
            <span
              className={cx('status-meter__key', `status-meter__key--${row.status}`)}
              aria-hidden="true"
            />
            <span className="status-meter__label">{t(`status.${row.status}`)}</span>
            <strong className="status-meter__count">{row.count}</strong>
            <span className="status-meter__share">{share(row.count)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
