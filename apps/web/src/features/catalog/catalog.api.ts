import type { ProductTypeDto } from '@dzen/shared';
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
  }),
});

export const { useProductTypesQuery, useSpecificationsQuery } = catalogApi;
