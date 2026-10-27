'use client';

import type { MouseEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/Icon';
import { cx } from '@/lib/cx';
import './pagination.scss';

type PageSlot = number | 'gap';

const WINDOW = 4;

function visiblePages(page: number, pageCount: number): PageSlot[] {
  const start = Math.max(1, Math.min(page - 1, pageCount - WINDOW + 1));
  const end = Math.min(pageCount, Math.max(page + 1, WINDOW));
  const around = Array.from({ length: end - start + 1 }, (_, index) => start + index);
  const pages = [...new Set([1, ...around, pageCount])].sort((a, b) => a - b);

  return pages.flatMap<PageSlot>((value, index) => {
    const previous = pages[index - 1];
    if (previous === undefined || value - previous === 1) return [value];
    return value - previous === 2 ? [previous + 1, value] : ['gap', value];
  });
}

interface PaginationProps {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageCount, hrefFor, onChange }: PaginationProps) {
  const t = useTranslations('pagination');
  if (pageCount <= 1) return null;

  const follow = (target: number) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    onChange(target);
  };

  const step = (target: number, label: string, icon: 'chevronLeft' | 'chevronRight') => {
    const disabled = target < 1 || target > pageCount;
    return (
      <li className={cx('page-item', disabled && 'disabled')}>
        {disabled ? (
          <span className="page-link" aria-label={label}>
            <Icon name={icon} size={12} />
          </span>
        ) : (
          <a
            className="page-link"
            href={hrefFor(target)}
            onClick={follow(target)}
            aria-label={label}
          >
            <Icon name={icon} size={12} />
          </a>
        )}
      </li>
    );
  };

  return (
    <nav className="pager" aria-label={t('label')}>
      <ul className="pagination pager__list">
        {step(page - 1, t('previous'), 'chevronLeft')}
        {visiblePages(page, pageCount).map((slot, index) =>
          slot === 'gap' ? (
            <li key={`gap-${index}`} className="page-item disabled" aria-hidden="true">
              <span className="page-link">…</span>
            </li>
          ) : (
            <li key={slot} className={cx('page-item', slot === page && 'active')}>
              <a
                className="page-link"
                href={hrefFor(slot)}
                onClick={follow(slot)}
                aria-label={t('page', { page: slot })}
                aria-current={slot === page ? 'page' : undefined}
              >
                {slot}
              </a>
            </li>
          ),
        )}
        {step(page + 1, t('next'), 'chevronRight')}
      </ul>
    </nav>
  );
}
