import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { SettingsView } from '@/features/settings/SettingsView';
import { toAppLocale } from '@/i18n/routing';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages');
  return { title: t('settings') };
}

export default async function Page({ params }: PageProps<'/[locale]/settings'>) {
  setRequestLocale(toAppLocale((await params).locale));
  return <SettingsView />;
}
