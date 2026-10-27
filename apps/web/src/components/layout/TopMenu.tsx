'use client';

import { useTranslations } from 'next-intl';
import { Logo } from '@/components/brand/Logo';
import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';
import { Icon } from '@/components/icons/Icon';
import { Link } from '@/i18n/navigation';
import { LiveClock } from './LiveClock';
import { LogoutButton } from './LogoutButton';
import { SessionsBadge } from './SessionsBadge';

export function TopMenu({ onOpenNavigation }: { onOpenNavigation: () => void }) {
  const t = useTranslations();

  return (
    <header className="top-menu">
      <button
        type="button"
        className="top-menu__icon-button top-menu__burger"
        onClick={onOpenNavigation}
        aria-label={t('nav.open')}
      >
        <Icon name="menu" size={22} />
      </button>

      <Link href="/orders" className="top-menu__brand" aria-label={t('topMenu.home')}>
        <Logo />
      </Link>

      <form className="top-menu__search" role="search" onSubmit={(event) => event.preventDefault()}>
        <Icon name="search" size={13} className="top-menu__search-icon" />
        <input
          className="top-menu__search-input"
          type="search"
          placeholder={t('topMenu.search')}
          aria-label={t('topMenu.search')}
        />
      </form>

      <div className="top-menu__aside">
        <LiveClock />
        <SessionsBadge />
        <LanguageSwitch />
        <LogoutButton />
      </div>
    </header>
  );
}
