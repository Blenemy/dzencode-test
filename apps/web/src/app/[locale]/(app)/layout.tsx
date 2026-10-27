import { setRequestLocale } from 'next-intl/server';
import { AppShell } from '@/components/layout/AppShell';
import { ServiceUnavailable } from '@/components/layout/ServiceUnavailable';
import { SessionRestore } from '@/features/auth/SessionRestore';
import { toAppLocale } from '@/i18n/routing';
import { getCurrentUser } from '@/lib/server-api';
import { StoreProvider } from '@/store/StoreProvider';

export default async function AppLayout({ children, params }: LayoutProps<'/[locale]'>) {
  setRequestLocale(toAppLocale((await params).locale));

  const current = await getCurrentUser();

  if (current.state === 'unavailable') return <ServiceUnavailable />;

  if (current.state === 'expired') {
    return (
      <StoreProvider user={null}>
        <SessionRestore />
      </StoreProvider>
    );
  }

  return (
    <StoreProvider user={current.user}>
      <AppShell>{children}</AppShell>
    </StoreProvider>
  );
}
