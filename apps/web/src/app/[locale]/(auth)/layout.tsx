import { setRequestLocale } from 'next-intl/server';
import { LanguageSwitch } from '@/components/i18n/LanguageSwitch';
import { toAppLocale } from '@/i18n/routing';
import { StoreProvider } from '@/store/StoreProvider';
import '@/features/auth/auth.scss';

export default async function AuthLayout({ children, params }: LayoutProps<'/[locale]'>) {
  setRequestLocale(toAppLocale((await params).locale));

  return (
    <StoreProvider user={null}>
      <main className="auth-layout">
        <div className="auth-layout__lang">
          <LanguageSwitch />
        </div>
        {children}
      </main>
    </StoreProvider>
  );
}
