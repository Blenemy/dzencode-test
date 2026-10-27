import type { ListResponse, OrderSummaryDto } from '@dzen/shared';
import { fetchAllProducts } from '@/features/products/all-products';
import { api } from '@/store/api';
import { orderDocument, productDocument, type SearchDocument } from './search-engine';

export const searchApi = api.injectEndpoints({
  endpoints: (build) => ({
    searchDocuments: build.query<SearchDocument[], void>({
      async queryFn(_arg, _api, _extra, baseQuery) {
        const [orders, products] = await Promise.all([
          baseQuery('/orders'),
          fetchAllProducts((path) => baseQuery(path)),
        ]);
        if (orders.error) return { error: orders.error };
        if ('error' in products) return { error: products.error };

        const { items } = orders.data as ListResponse<OrderSummaryDto>;
        return {
          data: [...items.map(orderDocument), ...products.data.map(productDocument)],
        };
      },
      providesTags: [{ type: 'Orders', id: 'LIST' }, 'Products'],
    }),
  }),
});

export const { useSearchDocumentsQuery } = searchApi;
