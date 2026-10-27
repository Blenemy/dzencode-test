import { redirect } from '@/i18n/navigation';
import { toAppLocale } from '@/i18n/routing';

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  redirect({ href: '/orders', locale: toAppLocale((await params).locale) });
}
