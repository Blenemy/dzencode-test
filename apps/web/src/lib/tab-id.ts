'use client';

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'inventory:tab-id';

let cached: string | null = null;

function read(): string | null {
  if (cached) return cached;
  try {
    cached = window.sessionStorage.getItem(STORAGE_KEY);
    if (!cached) {
      cached = window.crypto.randomUUID().slice(0, 8);
      window.sessionStorage.setItem(STORAGE_KEY, cached);
    }
  } catch {
    cached = null;
  }
  return cached;
}

function subscribe(): () => void {
  return () => undefined;
}

export function useTabId(): string | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
