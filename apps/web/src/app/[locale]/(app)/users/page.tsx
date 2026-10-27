import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { UserDto, WarehouseDto } from '@dzen/shared';
import { UsersView } from '@/features/users/UsersView';
import { toAppLocale } from '@/i18n/routing';
import { dataOrNull, serverGet } from '@/lib/server-api';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages');
  return { title: t('users') };
}

export default async function Page({ params }: PageProps<'/[locale]/users'>) {
  setRequestLocale(toAppLocale((await params).locale));

  const [users, warehouses] = await Promise.all([
    serverGet<UserDto[]>('/users'),
    serverGet<WarehouseDto[]>('/warehouses'),
  ]);

  return <UsersView initial={{ users: dataOrNull(users), warehouses: dataOrNull(warehouses) }} />;
}
