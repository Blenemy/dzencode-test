import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <main className="not-found">
      <p className="not-found__code">404</p>
      <h1 className="not-found__title">{t('title')}</h1>
      <Link className="btn btn-primary" href="/orders">
        {t('back')}
      </Link>
    </main>
  );
}
