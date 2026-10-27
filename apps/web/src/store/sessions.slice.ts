import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface SessionsState {
  count: number | null;
  online: boolean;
}

const initialState: SessionsState = { count: null, online: false };

export const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    sessionsCounted(state, action: PayloadAction<number>) {
      state.count = action.payload;
      state.online = true;
    },
    connectionLost(state) {
      state.online = false;
    },
  },
  selectors: {
    selectSessionsCount: (state) => state.count,
    selectRealtimeOnline: (state) => state.online,
  },
});

export const { sessionsCounted, connectionLost } = sessionsSlice.actions;
export const { selectSessionsCount, selectRealtimeOnline } = sessionsSlice.selectors;
