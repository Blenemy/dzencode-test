'use client';

import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/Icon';
import { useLogoutMutation } from '@/features/auth/auth.api';
import { useRouter } from '@/i18n/navigation';

export function LogoutButton() {
  const t = useTranslations('topMenu');
  const router = useRouter();
  const [logout, { isLoading }] = useLogoutMutation();

  const signOut = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <button
      type="button"
      className="top-menu__icon-button"
      onClick={signOut}
      disabled={isLoading}
      title={t('logout')}
      aria-label={t('logout')}
    >
      <Icon name="logout" size={17} />
    </button>
  );
}
