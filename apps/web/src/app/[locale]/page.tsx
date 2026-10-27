import { hasLocale } from 'next-intl';
import { redirect } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  redirect({
    href: '/orders',
    locale: hasLocale(routing.locales, locale) ? locale : routing.defaultLocale,
  });
}
