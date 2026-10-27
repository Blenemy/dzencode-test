'use client';

import type { Currency, CurrencyTotal } from '@dzen/shared';
import { selectCurrency } from '@/features/preferences/preferences.slice';
import { cx } from '@/lib/cx';
import { amountIn, formatAmount } from '@/lib/format-money';
import { useAppSelector } from '@/store/hooks';
import './money.scss';

const UNIT: Record<Currency, string> = { UAH: 'UAH', USD: '$' };

export function useCurrencyOrder(): [Currency, Currency] {
  return useAppSelector(selectCurrency) === 'USD' ? ['USD', 'UAH'] : ['UAH', 'USD'];
}

export function formatMoney(value: number, currency: Currency): string {
  return `${formatAmount(value)} ${UNIT[currency]}`;
}

interface MoneyPairProps {
  amounts: CurrencyTotal[];
  align?: 'start' | 'end';
  className?: string;
}

export function MoneyPair({ amounts, align = 'start', className }: MoneyPairProps) {
  const [primary, secondary] = useCurrencyOrder();
  const secondaryValue = amountIn(amounts, secondary);

  return (
    <span className={cx('money', align === 'end' && 'money--end', className)}>
      {secondaryValue > 0 && (
        <span className="money__secondary">{formatMoney(secondaryValue, secondary)}</span>
      )}
      <span className="money__primary">
        {formatAmount(amountIn(amounts, primary))}{' '}
        <span className="money__unit">{UNIT[primary]}</span>
      </span>
    </span>
  );
}
