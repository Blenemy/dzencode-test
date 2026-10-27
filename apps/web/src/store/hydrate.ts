'use client';

import { useState } from 'react';
import { useAppStore } from './hooks';
import type { AppStore } from './store';

export function useHydrateOnce(hydrate: (store: AppStore) => void): void {
  const store = useAppStore();
  useState(() => {
    hydrate(store);
    return true;
  });
}
