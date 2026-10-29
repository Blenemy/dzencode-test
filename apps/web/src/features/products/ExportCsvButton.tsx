'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/Icon';
import { useProductTypeName } from '@/features/catalog/use-type-name';
import { toDateInputValue } from '@/lib/format-date';
import type { ProductFilters } from './all-products';
import type { CsvRequest } from './csv';
import { useLazyProductsExportQuery } from './products.api';

const COLUMNS = [
  'id',
  'title',
  'serial',
  'type',
  'specification',
  'status',
  'condition',
  'guaranteeStart',
  'guaranteeEnd',
  'priceUsd',
  'priceUah',
  'group',
  'user',
  'order',
  'date',
] as const;

function runCsvWorker(request: CsvRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./csv.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<string>) => {
      resolve(event.data);
      worker.terminate();
    };
    worker.onerror = (event) => {
      reject(new Error(event.message));
      worker.terminate();
    };
    worker.postMessage(request);
  });
}

function download(text: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

interface ExportCsvButtonProps {
  filters: ProductFilters;
  disabled?: boolean;
}

export function ExportCsvButton({ filters, disabled = false }: ExportCsvButtonProps) {
  const t = useTranslations('products');
  const locale = useLocale();
  const typeName = useProductTypeName();
  const [loadProducts] = useLazyProductsExportQuery();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const exportCsv = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const products = await loadProducts(filters).unwrap();
      const types = Object.fromEntries(
        products.map((product) => [product.type.name, typeName(product.type.name)]),
      );
      const csv = await runCsvWorker({
        products,
        labels: {
          headers: COLUMNS.map((column) => t(`csv.columns.${column}`)),
          status: { FREE: t('status.FREE'), IN_REPAIR: t('status.IN_REPAIR') },
          condition: { new: t('condition.new'), used: t('condition.used') },
          types,
        },
        delimiter: locale === 'ru' ? ';' : ',',
        decimal: locale === 'ru' ? ',' : '.',
      });
      download(csv, `products-${toDateInputValue(new Date())}.csv`);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="products__export">
      <button
        type="button"
        className="btn btn-sm btn-outline-primary products__export-button"
        onClick={exportCsv}
        disabled={busy || disabled}
        aria-busy={busy}
      >
        {busy ? (
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
        ) : (
          <Icon name="download" size={14} />
        )}
        {t('csv.button')}
      </button>
      {failed && (
        <span className="products__export-error" role="alert">
          {t('csv.failed')}
        </span>
      )}
    </div>
  );
}
