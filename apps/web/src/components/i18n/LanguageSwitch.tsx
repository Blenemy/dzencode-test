'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import './language-switch.scss';

export function LanguageSwitch() {
  const t = useTranslations('topMenu');
  const active = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <div className="language-switch" role="group" aria-label={t('language')}>
      {routing.locales.map((locale) => (
        <button
          key={locale}
          type="button"
          className={`language-switch__option${locale === active ? ' language-switch__option--active' : ''}`}
          aria-pressed={locale === active}
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              const query = Object.fromEntries(new URLSearchParams(window.location.search));
              router.replace({ pathname, query }, { locale });
            })
          }
        >
          {locale}
        </button>
      ))}
    </div>
  );
}
