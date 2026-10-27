'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';

type Translate = (key: string) => string;

export function useProductTypeName(): (name: string) => string {
  const t = useTranslations('productTypes');

  return useCallback(
    (name: string) => (t.has(name as never) ? (t as unknown as Translate)(name) : name),
    [t],
  );
}
