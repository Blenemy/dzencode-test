import { api, succeeded } from '@/store/api';
import { ordersApi } from '@/features/orders/orders.api';

export interface DeleteProductArgs {
  id: number;
  orderId: number;
}

export const productsApi = api.injectEndpoints({
  endpoints: (build) => ({
    deleteProduct: build.mutation<void, DeleteProductArgs>({
      query: ({ id }) => ({ url: `/products/${id}`, method: 'DELETE' }),
      async onQueryStarted({ id, orderId }, { dispatch, queryFulfilled }) {
        if (!(await succeeded(queryFulfilled))) return;
        dispatch(
          ordersApi.util.updateQueryData('order', orderId, (draft) => {
            draft.products = draft.products.filter((product) => product.id !== id);
            draft.productsCount = draft.products.length;
          }),
        );
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

export const { useDeleteProductMutation } = productsApi;
