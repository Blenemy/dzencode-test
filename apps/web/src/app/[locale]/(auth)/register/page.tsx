import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { RegisterForm } from '@/features/auth/RegisterForm';
import { safeNext } from '@/lib/safe-next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return { title: t('registerTitle') };
}

export default async function RegisterPage({ searchParams }: PageProps<'/[locale]/register'>) {
  const { next } = await searchParams;
  return <RegisterForm next={safeNext(next)} />;
}
