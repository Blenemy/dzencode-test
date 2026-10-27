'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { selectSessionExpired } from '@/store/auth.slice';
import { useAppSelector } from '@/store/hooks';

export function SessionWatcher() {
  const expired = useAppSelector(selectSessionExpired);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (expired) router.replace({ pathname: '/login', query: { next: pathname } });
  }, [expired, router, pathname]);

  return null;
}
