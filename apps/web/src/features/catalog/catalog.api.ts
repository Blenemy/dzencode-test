import type { ProductGroupDto, ProductTypeDto, UserDto, WarehouseDto } from '@dzen/shared';
import { specificationsApiPath } from '@/features/products/products-query';
import { api } from '@/store/api';

export const catalogApi = api.injectEndpoints({
  endpoints: (build) => ({
    productTypes: build.query<ProductTypeDto[], void>({
      query: () => '/product-types',
      providesTags: ['Catalog'],
    }),
    specifications: build.query<string[], number | null>({
      query: (typeId) => specificationsApiPath(typeId),
      providesTags: ['Catalog'],
    }),
    warehouses: build.query<WarehouseDto[], void>({
      query: () => '/warehouses',
      providesTags: ['Catalog'],
    }),
    groups: build.query<ProductGroupDto[], void>({
      query: () => '/groups',
      providesTags: ['Catalog'],
    }),
    users: build.query<UserDto[], void>({
      query: () => '/users',
      providesTags: ['Catalog'],
    }),
  }),
});

export const {
  useProductTypesQuery,
  useSpecificationsQuery,
  useWarehousesQuery,
  useGroupsQuery,
  useUsersQuery,
} = catalogApi;
