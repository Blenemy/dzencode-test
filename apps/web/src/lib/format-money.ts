import type { Currency, CurrencyTotal } from '@dzen/shared';

const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const withCents = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatAmount(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const formatter = Number.isInteger(rounded) ? whole : withCents;
  return formatter.format(rounded).replace(/,/g, ' ');
}

export function totalIn(totals: CurrencyTotal[], symbol: Currency): number {
  return totals.find((total) => total.symbol === symbol)?.value ?? 0;
}
