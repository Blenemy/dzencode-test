'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { SessionWatcher } from '@/features/auth/SessionWatcher';
import { RealtimeBridge } from '@/features/realtime/RealtimeBridge';
import { NavigationMenu } from './NavigationMenu';
import { TopMenu } from './TopMenu';
import './app-shell.scss';

export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations('nav');
  const [navigationOpen, setNavigationOpen] = useState(false);

  return (
    <div className="app-shell">
      <RealtimeBridge />
      <SessionWatcher />
      <a className="visually-hidden-focusable app-shell__skip" href="#main">
        {t('skip')}
      </a>
      <TopMenu onOpenNavigation={() => setNavigationOpen(true)} />
      <NavigationMenu open={navigationOpen} onClose={() => setNavigationOpen(false)} />
      <main id="main" className="app-shell__main">
        {children}
      </main>
    </div>
  );
}
