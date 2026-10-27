import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser } from '@dzen/shared';

export interface AuthState {
  user: AuthUser | null;
  expired: boolean;
}

const initialState: AuthState = { user: null, expired: false };

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    userLoaded(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.expired = false;
    },
    loggedOut(state) {
      state.user = null;
      state.expired = false;
    },
    sessionExpired(state) {
      state.user = null;
      state.expired = true;
    },
  },
  selectors: {
    selectUser: (state) => state.user,
    selectSessionExpired: (state) => state.expired,
  },
});

export const { userLoaded, loggedOut, sessionExpired } = authSlice.actions;
export const { selectUser, selectSessionExpired } = authSlice.selectors;
