import {
  createSlice,
  isAnyOf,
  type ListenerMiddlewareInstance,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { CURRENCIES, type Currency } from '@dzen/shared';

export const MOTION_PREFERENCES = ['system', 'reduced'] as const;
export type MotionPreference = (typeof MOTION_PREFERENCES)[number];

export interface PreferencesState {
  currency: Currency;
  motion: MotionPreference;
}

export const DEFAULT_PREFERENCES: PreferencesState = { currency: 'UAH', motion: 'system' };

const STORAGE_KEY = 'inventory:preferences';

export const preferencesSlice = createSlice({
  name: 'preferences',
  initialState: DEFAULT_PREFERENCES,
  reducers: {
    preferencesRestored: (_state, action: PayloadAction<PreferencesState>) => action.payload,
    currencyChanged(state, action: PayloadAction<Currency>) {
      state.currency = action.payload;
    },
    motionChanged(state, action: PayloadAction<MotionPreference>) {
      state.motion = action.payload;
    },
  },
  selectors: {
    selectCurrency: (state) => state.currency,
    selectMotion: (state) => state.motion,
  },
});

export const { preferencesRestored, currencyChanged, motionChanged } = preferencesSlice.actions;
export const { selectCurrency, selectMotion } = preferencesSlice.selectors;

export function readStoredPreferences(): PreferencesState {
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!raw || typeof raw !== 'object') return DEFAULT_PREFERENCES;
    const stored = raw as Partial<Record<keyof PreferencesState, unknown>>;
    return {
      currency:
        CURRENCIES.find((value) => value === stored.currency) ?? DEFAULT_PREFERENCES.currency,
      motion:
        MOTION_PREFERENCES.find((value) => value === stored.motion) ?? DEFAULT_PREFERENCES.motion,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function isPreferencesKey(key: string | null): boolean {
  return key === STORAGE_KEY;
}

export function listenToPreferences(listener: ListenerMiddlewareInstance): void {
  listener.startListening({
    matcher: isAnyOf(currencyChanged, motionChanged),
    effect: (_action, listenerApi) => {
      try {
        const { preferences } = listenerApi.getState() as { preferences: PreferencesState };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
      } catch {
        return;
      }
    },
  });
}
