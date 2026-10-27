import type { AuthUserResponse, LoginInput, RegisterInput, UpdateProfileInput } from '@dzen/shared';
import { api } from '@/store/api';
import { loggedOut, userLoaded } from '@/store/auth.slice';

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    me: build.query<AuthUserResponse, void>({
      query: () => '/auth/me',
      providesTags: ['Me'],
    }),
    login: build.mutation<AuthUserResponse, LoginInput>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      async onQueryStarted(_input, { dispatch, queryFulfilled }) {
        const result = await queryFulfilled.catch(() => null);
        if (result) dispatch(userLoaded(result.data.user));
      },
    }),
    register: build.mutation<AuthUserResponse, RegisterInput>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      async onQueryStarted(_input, { dispatch, queryFulfilled }) {
        const result = await queryFulfilled.catch(() => null);
        if (result) dispatch(userLoaded(result.data.user));
      },
    }),
    updateProfile: build.mutation<AuthUserResponse, UpdateProfileInput>({
      query: (body) => ({ url: '/auth/me', method: 'PATCH', body }),
      async onQueryStarted(_input, { dispatch, queryFulfilled }) {
        const result = await queryFulfilled.catch(() => null);
        if (result) dispatch(userLoaded(result.data.user));
      },
      invalidatesTags: ['Catalog'],
    }),
    logoutEverywhere: build.mutation<{ ok: boolean }, void>({
      query: () => ({ url: '/auth/sessions', method: 'DELETE' }),
      async onQueryStarted(_input, { dispatch, queryFulfilled }) {
        const result = await queryFulfilled.catch(() => null);
        if (result) dispatch(loggedOut());
      },
    }),
    logout: build.mutation<{ ok: boolean }, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      async onQueryStarted(_input, { dispatch, queryFulfilled }) {
        await queryFulfilled.catch(() => undefined);
        dispatch(loggedOut());
      },
    }),
  }),
});

export const {
  useMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useUpdateProfileMutation,
  useLogoutMutation,
  useLogoutEverywhereMutation,
} = authApi;
