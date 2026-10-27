'use client';

import { useState } from 'react';

type DialogPhase = 'closed' | 'open' | 'closing';

export function useDialog() {
  const [phase, setPhase] = useState<DialogPhase>('closed');

  return {
    mounted: phase !== 'closed',
    show: phase === 'open',
    open: () => setPhase('open'),
    close: () => setPhase((current) => (current === 'open' ? 'closing' : current)),
    exited: () => setPhase((current) => (current === 'closing' ? 'closed' : current)),
  };
}
