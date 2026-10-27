'use client';

import { useTranslations } from 'next-intl';
import { Logo } from '@/components/brand/Logo';
import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';
import { Icon } from '@/components/icons/Icon';
import { GlobalSearch } from '@/features/search/GlobalSearch';
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

      <Link
        href="/orders"
        className="top-menu__brand"
        aria-label={`Inventory — ${t('topMenu.home')}`}
      >
        <Logo />
      </Link>

      <GlobalSearch className="top-menu__search" />

      <div className="top-menu__aside">
        <LiveClock />
        <SessionsBadge />
        <LanguageSwitch />
        <LogoutButton />
      </div>
    </header>
  );
}
