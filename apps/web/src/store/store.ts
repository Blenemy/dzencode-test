import { combineSlices, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { deletionSlice } from '@/features/deletion/deletion.slice';
import { listenToPreferences, preferencesSlice } from '@/features/preferences/preferences.slice';
import { api } from './api';
import { authSlice, loggedOut } from './auth.slice';
import { listenToInventoryEvents } from './realtime';
import { sessionsSlice } from './sessions.slice';

const rootReducer = combineSlices(api, authSlice, sessionsSlice, deletionSlice, preferencesSlice);

export type RootState = ReturnType<typeof rootReducer>;

export function makeStore(preloadedState?: Partial<RootState>) {
  const listener = createListenerMiddleware();

  listener.startListening({
    actionCreator: loggedOut,
    effect: (_action, listenerApi) => {
      listenerApi.dispatch(api.util.resetApiState());
    },
  });
  listenToInventoryEvents(listener);
  listenToPreferences(listener);

  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) => getDefault().prepend(listener.middleware).concat(api.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
