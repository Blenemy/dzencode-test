import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { ProductGroupDto, StatsDto } from '@dzen/shared';
import { GroupsView } from '@/features/groups/GroupsView';
import { toAppLocale } from '@/i18n/routing';
import { dataOrNull, serverGet } from '@/lib/server-api';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages');
  return { title: t('groups') };
}

export default async function Page({ params }: PageProps<'/[locale]/groups'>) {
  setRequestLocale(toAppLocale((await params).locale));

  const [stats, groups] = await Promise.all([
    serverGet<StatsDto>('/stats'),
    serverGet<ProductGroupDto[]>('/groups'),
  ]);

  return <GroupsView initial={{ stats: dataOrNull(stats), groups: dataOrNull(groups) }} />;
}
