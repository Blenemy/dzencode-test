'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChartCard } from '@/components/charts/ChartCard';
import { SegmentedField } from '@/components/form/SegmentedField';
import { useLogoutEverywhereMutation, useLogoutMutation } from '@/features/auth/auth.api';
import {
  currencyChanged,
  motionChanged,
  selectCurrency,
  selectMotion,
} from '@/features/preferences/preferences.slice';
import { usePathname, useRouter } from '@/i18n/navigation';
import { toAppLocale, type AppLocale } from '@/i18n/routing';
import { useErrorMessage } from '@/lib/use-messages';
import { useTabId } from '@/lib/tab-id';
import { selectUser } from '@/store/auth.slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSessionsCount } from '@/store/sessions.slice';
import { ProfileForm } from './ProfileForm';
import './settings.scss';

const LANGUAGES: { value: AppLocale; label: string }[] = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

export function SettingsView() {
  const t = useTranslations('settings');
  const errorMessage = useErrorMessage();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const locale = toAppLocale(useLocale());
  const [, startTransition] = useTransition();
  const user = useAppSelector(selectUser);
  const currency = useAppSelector(selectCurrency);
  const motion = useAppSelector(selectMotion);
  const sessions = useAppSelector(selectSessionsCount);
  const tabId = useTabId();
  const [logout, logoutState] = useLogoutMutation();
  const [logoutEverywhere, everywhereState] = useLogoutEverywhereMutation();
  const signingOut = logoutState.isLoading || everywhereState.isLoading;

  const signOut = async (everywhere: boolean) => {
    const result = everywhere ? await logoutEverywhere() : await logout();
    if (!result.error) router.replace('/login');
  };

  return (
    <section className="settings" aria-labelledby="settings-title">
      <header className="settings__header">
        <h1 id="settings-title" className="settings__title">
          {t('title')}
        </h1>
      </header>

      <div className="settings__grid">
        <ChartCard title={t('profile')} hint={t('profileHint')}>
          {user && <ProfileForm user={user} />}
        </ChartCard>

        <div className="settings__side">
          <ChartCard title={t('interface')} hint={t('interfaceHint')}>
            <div className="settings__options">
              <SegmentedField
                label={t('language')}
                value={locale}
                options={LANGUAGES}
                onChange={(next) =>
                  startTransition(() => {
                    const query = Object.fromEntries(new URLSearchParams(window.location.search));
                    router.replace({ pathname, query }, { locale: next });
                  })
                }
              />
              <div>
                <SegmentedField
                  label={t('currency')}
                  value={currency}
                  options={[
                    { value: 'UAH', label: 'UAH' },
                    { value: 'USD', label: 'USD' },
                  ]}
                  onChange={(next) => dispatch(currencyChanged(next))}
                />
                <p className="settings__hint">{t('currencyHint')}</p>
              </div>
              <SegmentedField
                label={t('motion')}
                value={motion}
                options={[
                  { value: 'system', label: t('motionSystem') },
                  { value: 'reduced', label: t('motionReduced') },
                ]}
                onChange={(next) => dispatch(motionChanged(next))}
              />
            </div>
          </ChartCard>

          <ChartCard title={t('session')}>
            <dl className="settings__facts">
              <div>
                <dt>{t('tabs')}</dt>
                <dd>{sessions ?? '—'}</dd>
              </div>
              <div>
                <dt>{t('tabId')}</dt>
                <dd>
                  <code>{tabId ?? '—'}</code>
                </dd>
              </div>
            </dl>
            <p className="settings__hint">{t('tabIdHint')}</p>

            {everywhereState.error && (
              <div className="alert alert-danger" role="alert">
                {errorMessage(everywhereState.error)}
              </div>
            )}

            <div className="settings__actions">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => signOut(false)}
                disabled={signingOut}
              >
                {t('logout')}
              </button>
              <button
                type="button"
                className="btn btn-outline-danger"
                onClick={() => signOut(true)}
                disabled={signingOut}
              >
                {t('logoutEverywhere')}
              </button>
            </div>
            <p className="settings__hint">{t('logoutEverywhereHint')}</p>
          </ChartCard>
        </div>
      </div>
    </section>
  );
}
