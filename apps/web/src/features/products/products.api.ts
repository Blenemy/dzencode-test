import type {
  CreateProductData,
  PageResponse,
  ProductDto,
  ProductTypeDto,
  UploadResult,
} from '@dzen/shared';
import { catalogApi } from '@/features/catalog/catalog.api';
import { ordersApi } from '@/features/orders/orders.api';
import { api, succeeded } from '@/store/api';
import { useHydrateOnce } from '@/store/hydrate';
import { productsApiPath, type ProductsArgs } from './products-query';

export interface DeleteProductArgs {
  id: number;
  orderId: number;
}

export const productsApi = api.injectEndpoints({
  endpoints: (build) => ({
    products: build.query<PageResponse<ProductDto>, ProductsArgs>({
      query: (args) => productsApiPath(args),
      providesTags: [{ type: 'Products', id: 'LIST' }],
    }),
    createProduct: build.mutation<ProductDto, CreateProductData>({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      invalidatesTags: (product) => [
        { type: 'Orders', id: 'LIST' },
        ...(product ? [{ type: 'Orders' as const, id: product.order.id }] : []),
        'Products',
        'Stats',
        'Catalog',
      ],
    }),
    uploadImage: build.mutation<UploadResult, File>({
      query: (file) => {
        const body = new FormData();
        body.append('file', file);
        return { url: '/uploads', method: 'POST', body };
      },
    }),
    deleteProduct: build.mutation<void, DeleteProductArgs>({
      query: ({ id }) => ({ url: `/products/${id}`, method: 'DELETE' }),
      async onQueryStarted({ id, orderId }, { dispatch, getState, queryFulfilled }) {
        if (!(await succeeded(queryFulfilled))) return;
        dispatch(
          ordersApi.util.updateQueryData('order', orderId, (draft) => {
            draft.products = draft.products.filter((product) => product.id !== id);
            draft.productsCount = draft.products.length;
          }),
        );
        for (const args of productsApi.util.selectCachedArgsForQuery(getState(), 'products')) {
          dispatch(
            productsApi.util.updateQueryData('products', args, (draft) => {
              const before = draft.items.length;
              draft.items = draft.items.filter((product) => product.id !== id);
              draft.total -= before - draft.items.length;
            }),
          );
        }
      },
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: 'Orders', id: 'LIST' },
        { type: 'Orders', id: orderId },
        'Products',
        'Stats',
        'Catalog',
      ],
    }),
  }),
});

export const {
  useProductsQuery,
  useCreateProductMutation,
  useUploadImageMutation,
  useDeleteProductMutation,
} = productsApi;

export interface ProductsPageData {
  products: PageResponse<ProductDto> | null;
  types: ProductTypeDto[] | null;
  specifications: string[] | null;
}

export function useHydrateProductsPage(args: ProductsArgs, initial: ProductsPageData): void {
  useHydrateOnce((store) => {
    const state = store.getState();
    const typeId = args.typeId ?? null;

    if (initial.products && !productsApi.endpoints.products.select(args)(state).data) {
      store.dispatch(
        productsApi.util.upsertQueryEntries([
          { endpointName: 'products', arg: args, value: initial.products },
        ]),
      );
    }
    if (initial.types && !catalogApi.endpoints.productTypes.select()(state).data) {
      store.dispatch(
        catalogApi.util.upsertQueryEntries([
          { endpointName: 'productTypes', arg: undefined, value: initial.types },
        ]),
      );
    }
    if (initial.specifications && !catalogApi.endpoints.specifications.select(typeId)(state).data) {
      store.dispatch(
        catalogApi.util.upsertQueryEntries([
          { endpointName: 'specifications', arg: typeId, value: initial.specifications },
        ]),
      );
    }
  });
}
