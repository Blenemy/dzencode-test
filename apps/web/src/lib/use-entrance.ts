'use client';

import { useEffect, useState } from 'react';

let hydrated = false;

export function useEntranceAnimation(): boolean {
  const [animate] = useState(() => hydrated);

  useEffect(() => {
    hydrated = true;
  }, []);

  return animate;
}
