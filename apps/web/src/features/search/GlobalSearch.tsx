'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/Icon';
import { useRouter } from '@/i18n/navigation';
import { cx } from '@/lib/cx';
import type { SearchRequest, SearchResponse, SearchResult, SearchResults } from './search-engine';
import { useSearchDocumentsQuery } from './search.api';
import './global-search.scss';

const DEBOUNCE_MS = 120;

export function GlobalSearch({ className }: { className?: string }) {
  const t = useTranslations('search');
  const router = useRouter();
  const listId = useId();
  const workerRef = useRef<Worker | null>(null);
  const requestRef = useRef(0);
  const [activated, setActivated] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [highlight, setHighlight] = useState(0);
  const { data: documents, isError } = useSearchDocumentsQuery(undefined, { skip: !activated });

  useEffect(() => {
    if (!activated) return;
    const worker = new Worker(new URL('./search.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<SearchResponse>) => {
      if (event.data.id === requestRef.current) setResults(event.data.results);
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [activated]);

  useEffect(() => {
    if (!documents) return;
    const message: SearchRequest = { type: 'index', documents };
    workerRef.current?.postMessage(message);
  }, [documents]);

  useEffect(() => {
    const term = query.trim();
    if (!documents || !term) return;
    const timer = window.setTimeout(() => {
      requestRef.current += 1;
      const message: SearchRequest = { type: 'query', id: requestRef.current, query: term };
      workerRef.current?.postMessage(message);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query, documents]);

  const term = query.trim();
  const shown = term ? results : null;
  const options: SearchResult[] = shown ? [...shown.orders, ...shown.products] : [];
  const expanded = open && term.length > 0;
  const status = isError
    ? t('failed')
    : !documents
      ? t('preparing')
      : shown && options.length === 0
        ? t('empty')
        : null;
  const optionId = (index: number) => `${listId}-option-${index}`;

  const choose = (option: SearchResult) => {
    setOpen(false);
    setQuery('');
    router.push(option.href, { scroll: false });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setHighlight((current) => Math.min(current + 1, Math.max(options.length - 1, 0)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const option = options[highlight];
      if (expanded && option) choose(option);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const renderGroup = (title: string, items: SearchResult[], offset: number) =>
    items.length > 0 && (
      <li role="presentation">
        <span className="global-search__group">{title}</span>
        <ul role="group" aria-label={title} className="global-search__options">
          {items.map((item, index) => {
            const position = offset + index;
            return (
              <li
                key={`${item.kind}-${item.id}`}
                id={optionId(position)}
                role="option"
                aria-selected={position === highlight}
                className={cx(
                  'global-search__option',
                  position === highlight && 'global-search__option--active',
                )}
                onMouseEnter={() => setHighlight(position)}
                onClick={() => choose(item)}
              >
                <Icon
                  name={item.kind === 'order' ? 'list' : 'image'}
                  size={14}
                  className="global-search__kind"
                />
                <span className="global-search__text">
                  <span className="global-search__title">{item.title}</span>
                  {item.subtitle && (
                    <span className="global-search__subtitle">{item.subtitle}</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </li>
    );

  return (
    <div className={cx('global-search', className)} role="search">
      <Icon name="search" size={13} className="global-search__icon" />
      <input
        className="global-search__input"
        type="search"
        role="combobox"
        placeholder={t('placeholder')}
        aria-label={t('label')}
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={expanded && options[highlight] ? optionId(highlight) : undefined}
        autoComplete="off"
        value={query}
        onFocus={() => {
          setActivated(true);
          setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          setQuery(event.target.value);
          setHighlight(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {expanded && (
        <div className="global-search__panel" onMouseDown={(event) => event.preventDefault()}>
          {status && (
            <p className="global-search__status" role="status">
              {status}
            </p>
          )}
          <ul id={listId} role="listbox" aria-label={t('label')} className="global-search__list">
            {shown && renderGroup(t('orders'), shown.orders, 0)}
            {shown && renderGroup(t('products'), shown.products, shown.orders.length)}
          </ul>
        </div>
      )}
    </div>
  );
}
