'use client';

import { useCallback, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AddButton } from '@/components/buttons/AddButton';
import { useDialog } from '@/components/dialog/use-dialog';
import { Pagination } from '@/components/pagination/Pagination';
import { useErrorMessage } from '@/lib/use-messages';
import { ProductFilters } from './ProductFilters';
import { useHydrateProductsPage, useProductsQuery, type ProductsPageData } from './products.api';
import {
  parseProductsArgs,
  PRODUCTS_PAGE_SIZE,
  toProductsSearch,
  type ProductsArgs,
} from './products-query';
import { ProductsTable } from './ProductsTable';
import { saveProductFilters } from './saved-filters';
import './products-page.scss';

const CreateProductDialog = dynamic(
  () => import('./CreateProductDialog').then((module) => module.CreateProductDialog),
  { ssr: false },
);

const SKELETON_ROWS = 5;

export function ProductsView({ initial }: { initial: ProductsPageData }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const productDialog = useDialog();
  const args = useMemo(() => parseProductsArgs(searchParams), [searchParams]);
  useHydrateProductsPage(args, initial);
  const t = useTranslations('products');
  const errorMessage = useErrorMessage();
  const { data, error, isLoading, isFetching, refetch } = useProductsQuery(args);
  const filtersSearch = toProductsSearch({ ...args, page: 1 });
  const filtered = Boolean(args.typeId || args.specification);

  const pageCount = data ? Math.max(1, Math.ceil(data.total / PRODUCTS_PAGE_SIZE)) : 1;
  const pageOutOfRange = Boolean(data && !isFetching && data.items.length === 0 && args.page > 1);

  const hrefFor = useCallback(
    (next: ProductsArgs) => {
      const search = toProductsSearch(next);
      return search ? `${pathname}?${search}` : pathname;
    },
    [pathname],
  );

  const navigate = useCallback(
    (next: ProductsArgs) => window.history.pushState(null, '', hrefFor(next)),
    [hrefFor],
  );

  const changePage = (page: number) => {
    navigate({ ...args, page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    saveProductFilters(filtersSearch);
  }, [filtersSearch]);

  useEffect(() => {
    if (pageOutOfRange) router.replace(hrefFor({ ...args, page: pageCount }), { scroll: false });
  }, [pageOutOfRange, router, hrefFor, args, pageCount]);

  return (
    <section className="products" aria-labelledby="products-title">
      <header className="products__header">
        <AddButton label={t('create')} onClick={productDialog.open} />
        <h1 id="products-title" className="products__title">
          {t('title')} <span className="products__total">/ {data ? data.total : '…'}</span>
        </h1>
        <ProductFilters args={args} onChange={navigate} />
      </header>

      {isLoading && (
        <div className="products__skeleton placeholder-glow" aria-hidden="true">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <span key={index} className="placeholder col-12" />
          ))}
        </div>
      )}

      {!data && error && (
        <div className="alert alert-danger d-flex align-items-center gap-3" role="alert">
          <span>
            {t('loadFailed')}. {errorMessage(error)}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-auto"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {t('retry')}
          </button>
        </div>
      )}

      {data?.items.length === 0 && !pageOutOfRange && (
        <div className="products__empty">
          <p className="mb-0">{t('empty')}</p>
          {filtered && (
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => navigate({ page: 1 })}
            >
              {t('filters.reset')}
            </button>
          )}
        </div>
      )}

      {data && data.items.length > 0 && (
        <ProductsTable products={data.items} fetching={isFetching} />
      )}

      <Pagination
        page={args.page}
        pageCount={pageCount}
        hrefFor={(page) => hrefFor({ ...args, page })}
        onChange={changePage}
      />

      {productDialog.mounted && (
        <CreateProductDialog
          show={productDialog.show}
          onHide={productDialog.close}
          onExited={productDialog.exited}
          onCreated={productDialog.close}
        />
      )}
    </section>
  );
}
