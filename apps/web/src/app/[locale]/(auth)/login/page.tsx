import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/features/auth/LoginForm';
import { safeNext } from '@/lib/safe-next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return { title: t('loginTitle') };
}

export default async function LoginPage({ searchParams }: PageProps<'/[locale]/login'>) {
  const { next } = await searchParams;
  const demo = {
    email: process.env.DEMO_EMAIL ?? 'demo@dzen.test',
    password: process.env.DEMO_PASSWORD ?? 'demo12345',
  };

  return <LoginForm next={safeNext(next)} demo={demo} />;
}
