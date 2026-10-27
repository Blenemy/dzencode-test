import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PagePlaceholder } from '@/components/layout/PagePlaceholder';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages');
  return { title: t('users') };
}

export default function Page() {
  return <PagePlaceholder section="users" />;
}
