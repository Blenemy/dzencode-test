import { useId, type ReactNode } from 'react';
import { cx } from '@/lib/cx';
import './charts.scss';

interface ChartCardProps {
  title: string;
  hint?: string;
  tableLabel?: string;
  table?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function ChartCard({ title, hint, tableLabel, table, className, children }: ChartCardProps) {
  const titleId = useId();

  return (
    <article className={cx('chart-card', className)} aria-labelledby={titleId}>
      <header className="chart-card__header">
        <h2 id={titleId} className="chart-card__title">
          {title}
        </h2>
        {hint && <p className="chart-card__hint">{hint}</p>}
      </header>
      <div className="chart-card__body">{children}</div>
      {table && tableLabel && (
        <details className="chart-card__table">
          <summary className="chart-card__summary">{tableLabel}</summary>
          {table}
        </details>
      )}
    </article>
  );
}

export function StatTile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="stat-tile">
      <span className="stat-tile__label">{label}</span>
      <span className="stat-tile__value">{value}</span>
      {note && <span className="stat-tile__note">{note}</span>}
    </div>
  );
}
