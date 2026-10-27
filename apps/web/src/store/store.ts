import { combineSlices, configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import { api } from './api';
import { authSlice, loggedOut } from './auth.slice';
import { sessionsSlice } from './sessions.slice';

const rootReducer = combineSlices(api, authSlice, sessionsSlice);

export type RootState = ReturnType<typeof rootReducer>;

export function makeStore(preloadedState?: Partial<RootState>) {
  const listener = createListenerMiddleware();

  listener.startListening({
    actionCreator: loggedOut,
    effect: (_action, listenerApi) => {
      listenerApi.dispatch(api.util.resetApiState());
    },
  });

  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) => getDefault().prepend(listener.middleware).concat(api.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
