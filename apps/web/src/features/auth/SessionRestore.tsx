'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { refreshSession } from '@/store/session';
import './session-restore.scss';

export function SessionRestore() {
  const t = useTranslations('auth');
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let active = true;

    void refreshSession().then((restored) => {
      if (!active) return;
      if (restored) router.refresh();
      else router.replace({ pathname: '/login', query: { next: pathname } });
    });

    return () => {
      active = false;
    };
  }, [router, pathname]);

  return (
    <div className="session-restore" role="status">
      <span className="spinner-border text-primary" aria-hidden="true" />
      <p className="session-restore__text">{t('restoring')}</p>
    </div>
  );
}
