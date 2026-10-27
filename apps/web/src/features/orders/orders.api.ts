import type { ListResponse, OrderDetailsDto, OrderSummaryDto } from '@dzen/shared';
import { api, succeeded } from '@/store/api';
import { useHydrateOnce } from '@/store/hydrate';

export const ordersApi = api.injectEndpoints({
  endpoints: (build) => ({
    orders: build.query<ListResponse<OrderSummaryDto>, void>({
      query: () => '/orders',
      providesTags: (result) => [
        { type: 'Orders', id: 'LIST' },
        ...(result?.items ?? []).map(({ id }) => ({ type: 'Orders' as const, id })),
      ],
    }),
    order: build.query<OrderDetailsDto, number>({
      query: (id) => `/orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Orders', id }],
    }),
    deleteOrder: build.mutation<void, number>({
      query: (id) => ({ url: `/orders/${id}`, method: 'DELETE' }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        if (!(await succeeded(queryFulfilled))) return;
        dispatch(
          ordersApi.util.updateQueryData('orders', undefined, (draft) => {
            draft.items = draft.items.filter((order) => order.id !== id);
            draft.total = draft.items.length;
          }),
        );
      },
      invalidatesTags: ['Products', 'Stats', 'Catalog'],
    }),
  }),
});

export const { useOrdersQuery, useOrderQuery, useDeleteOrderMutation } = ordersApi;

export function useHydrateOrders(orders: ListResponse<OrderSummaryDto> | null): void {
  useHydrateOnce((store) => {
    if (!orders || ordersApi.endpoints.orders.select()(store.getState()).data) return;
    store.dispatch(
      ordersApi.util.upsertQueryEntries([
        { endpointName: 'orders', arg: undefined, value: orders },
      ]),
    );
  });
}

export function useHydrateOrder(order: OrderDetailsDto | null): void {
  useHydrateOnce((store) => {
    if (!order || ordersApi.endpoints.order.select(order.id)(store.getState()).data) return;
    store.dispatch(
      ordersApi.util.upsertQueryEntries([{ endpointName: 'order', arg: order.id, value: order }]),
    );
  });
}
