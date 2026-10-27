import type { AuthUserResponse, LoginInput, RegisterInput } from '@dzen/shared';
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
        const { data } = await queryFulfilled;
        dispatch(userLoaded(data.user));
      },
    }),
    register: build.mutation<AuthUserResponse, RegisterInput>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      async onQueryStarted(_input, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(userLoaded(data.user));
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

export const { useMeQuery, useLoginMutation, useRegisterMutation, useLogoutMutation } = authApi;
