'use client';

import { useState, type ReactNode } from 'react';
import { MotionConfig } from 'motion/react';
import { useTranslations } from 'next-intl';
import { SessionWatcher } from '@/features/auth/SessionWatcher';
import { DeleteDialogHost } from '@/features/deletion/DeleteDialogHost';
import { PreferencesSync } from '@/features/preferences/PreferencesSync';
import { selectMotion } from '@/features/preferences/preferences.slice';
import { useAppSelector } from '@/store/hooks';
import { RealtimeBridge } from '@/features/realtime/RealtimeBridge';
import { NavigationMenu } from './NavigationMenu';
import { TopMenu } from './TopMenu';
import './app-shell.scss';

export function AppShell({ children }: { children: ReactNode }) {
  const t = useTranslations('nav');
  const [navigationOpen, setNavigationOpen] = useState(false);
  const motion = useAppSelector(selectMotion);

  return (
    <MotionConfig reducedMotion={motion === 'reduced' ? 'always' : 'user'}>
      <div className="app-shell">
        <RealtimeBridge />
        <PreferencesSync />
        <SessionWatcher />
        <a className="visually-hidden-focusable app-shell__skip" href="#main">
          {t('skip')}
        </a>
        <TopMenu onOpenNavigation={() => setNavigationOpen(true)} />
        <NavigationMenu open={navigationOpen} onClose={() => setNavigationOpen(false)} />
        <main id="main" className="app-shell__main">
          {children}
        </main>
        <DeleteDialogHost />
      </div>
    </MotionConfig>
  );
}
