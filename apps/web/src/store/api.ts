import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { sessionExpired } from './auth.slice';
import { refreshSession } from './session';

const rawBaseQuery = fetchBaseQuery({ baseUrl: '/api', credentials: 'include' });

const WITHOUT_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  const url = typeof args === 'string' ? args : args.url;
  if (result.error?.status !== 401 || WITHOUT_REFRESH.some((path) => url.startsWith(path))) {
    return result;
  }

  if (await refreshSession()) {
    result = await rawBaseQuery(args, api, extraOptions);
  } else {
    api.dispatch(sessionExpired());
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Me', 'Orders', 'Products', 'Catalog', 'Stats'],
  endpoints: () => ({}),
});
