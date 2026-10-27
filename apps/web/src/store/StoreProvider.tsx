'use client';

import { useState, type ReactNode } from 'react';
import { Provider } from 'react-redux';
import type { AuthUser } from '@dzen/shared';
import { makeStore } from './store';

export function StoreProvider({ user, children }: { user: AuthUser | null; children: ReactNode }) {
  const [store] = useState(() => makeStore({ auth: { user, expired: false } }));
  return <Provider store={store}>{children}</Provider>;
}
