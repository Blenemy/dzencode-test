'use client';

import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'products:filters';
const CHANGE_EVENT = 'products-filters-change';

function read(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function saveProductFilters(search: string): void {
  if (search === read()) return;
  try {
    if (search) window.localStorage.setItem(STORAGE_KEY, search);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useSavedProductFilters(): string {
  return useSyncExternalStore(subscribe, read, () => '');
}
