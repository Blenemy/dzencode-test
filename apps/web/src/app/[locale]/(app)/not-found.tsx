import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export default function AppNotFound() {
  const t = useTranslations('notFound');

  return (
    <section className="page page--not-found">
      <p className="not-found__code">404</p>
      <h1 className="page__title">{t('title')}</h1>
      <Link className="btn btn-primary mt-4" href="/orders">
        {t('back')}
      </Link>
    </section>
  );
}
