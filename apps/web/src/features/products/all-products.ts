import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { PRODUCTS_PAGE_LIMIT_MAX, type PageResponse, type ProductDto } from '@dzen/shared';

type BaseQuery = BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>;
type Outcome<T> = { data: T } | { error: FetchBaseQueryError };

export interface ProductFilters {
  typeId?: number;
  specification?: string;
}

export async function fetchAllProducts(
  baseQuery: (arg: string) => ReturnType<BaseQuery>,
  filters: ProductFilters = {},
): Promise<Outcome<ProductDto[]>> {
  const products: ProductDto[] = [];

  for (let page = 1; ; page += 1) {
    const search = new URLSearchParams({
      page: String(page),
      limit: String(PRODUCTS_PAGE_LIMIT_MAX),
    });
    if (filters.typeId) search.set('typeId', String(filters.typeId));
    if (filters.specification) search.set('specification', filters.specification);

    const result = await baseQuery(`/products?${search}`);
    if (result.error) return { error: result.error };

    const data = result.data as PageResponse<ProductDto>;
    products.push(...data.items);
    if (data.items.length === 0 || products.length >= data.total) return { data: products };
  }
}
