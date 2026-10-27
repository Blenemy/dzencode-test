export interface TooltipRow {
  label: string;
  value: string;
  color?: string;
}

export function ChartTooltip({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__title">{title}</div>
      {rows.map((row) => (
        <div key={row.label} className="chart-tooltip__row">
          {row.color && (
            <span className="chart-tooltip__key" style={{ background: row.color }} aria-hidden />
          )}
          <strong className="chart-tooltip__value">{row.value}</strong>
          <span className="chart-tooltip__label">{row.label}</span>
        </div>
      ))}
    </div>
  );
}
