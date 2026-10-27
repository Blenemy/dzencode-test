'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  isPreferencesKey,
  preferencesRestored,
  readStoredPreferences,
  selectMotion,
} from './preferences.slice';

export function PreferencesSync() {
  const dispatch = useAppDispatch();
  const motion = useAppSelector(selectMotion);

  useEffect(() => {
    dispatch(preferencesRestored(readStoredPreferences()));

    const onStorage = (event: StorageEvent) => {
      if (isPreferencesKey(event.key)) dispatch(preferencesRestored(readStoredPreferences()));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [dispatch]);

  useEffect(() => {
    document.documentElement.dataset.motion = motion;
  }, [motion]);

  return null;
}
