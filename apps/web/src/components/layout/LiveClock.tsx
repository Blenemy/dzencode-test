'use client';

import { useSyncExternalStore } from 'react';
import { useLocale } from 'next-intl';
import { Icon } from '@/components/icons/Icon';
import { dayMonthCommaYear, timeOfDay, weekdayLong } from '@/lib/format-date';

function subscribe(onTick: () => void): () => void {
  const timer = window.setInterval(onTick, 1000);
  return () => window.clearInterval(timer);
}

const currentSecond = () => Math.floor(Date.now() / 1000) * 1000;
const noTimeOnServer = () => null;

export function LiveClock() {
  const locale = useLocale();
  const now = useSyncExternalStore(subscribe, currentSecond, noTimeOnServer);

  if (now === null) {
    return <div className="live-clock live-clock--pending" aria-hidden="true" />;
  }

  return (
    <time className="live-clock" dateTime={new Date(now).toISOString()}>
      <span className="live-clock__weekday">{weekdayLong(now, locale)}</span>
      <span className="live-clock__row">
        <span className="live-clock__date">{dayMonthCommaYear(now, locale)}</span>
        <Icon name="clock" size={13} className="live-clock__icon" />
        <span className="live-clock__time">{timeOfDay(now, locale)}</span>
      </span>
    </time>
  );
}
