'use client';

import { useId, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useProductTypesQuery, useSpecificationsQuery } from '@/features/catalog/catalog.api';
import { useProductTypeName } from '@/features/catalog/use-type-name';
import type { ProductsArgs } from './products-query';

interface ProductFiltersProps {
  args: ProductsArgs;
  onChange: (next: ProductsArgs) => void;
}

export function ProductFilters({ args, onChange }: ProductFiltersProps) {
  const t = useTranslations('products.filters');
  const typeName = useProductTypeName();
  const locale = useLocale();
  const id = useId();
  const { data: types } = useProductTypesQuery();
  const typeOptions = useMemo(
    () =>
      (types ?? [])
        .map((type) => ({ id: type.id, name: typeName(type.name) }))
        .sort((a, b) => a.name.localeCompare(b.name, locale)),
    [types, typeName, locale],
  );
  const specifications = useSpecificationsQuery(args.typeId ?? null);
  const knownSpecs = specifications.data ?? [];
  const staleSpec = args.specification && !knownSpecs.includes(args.specification);

  return (
    <div className="product-filters">
      <div className="product-filters__field">
        <label className="product-filters__label" htmlFor={`${id}-type`}>
          {t('type')}:
        </label>
        <select
          id={`${id}-type`}
          className="form-select product-filters__select"
          value={args.typeId ?? ''}
          onChange={(event) =>
            onChange({ typeId: Number(event.target.value) || undefined, page: 1 })
          }
        >
          <option value="">{t('all')}</option>
          {typeOptions.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      <div className="product-filters__field">
        <label className="product-filters__label" htmlFor={`${id}-spec`}>
          {t('specification')}:
        </label>
        <select
          id={`${id}-spec`}
          className="form-select product-filters__select"
          value={args.specification ?? ''}
          onChange={(event) =>
            onChange({
              typeId: args.typeId,
              specification: event.target.value || undefined,
              page: 1,
            })
          }
        >
          <option value="">{t('all')}</option>
          {knownSpecs.map((specification) => (
            <option key={specification} value={specification}>
              {specification}
            </option>
          ))}
          {staleSpec && <option value={args.specification}>{args.specification}</option>}
        </select>
      </div>

      {(args.typeId || args.specification) && (
        <button
          type="button"
          className="product-filters__reset"
          onClick={() => onChange({ page: 1 })}
        >
          {t('reset')}
        </button>
      )}
    </div>
  );
}
