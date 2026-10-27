import { useTranslations } from 'next-intl';

export function ServiceUnavailable() {
  const t = useTranslations('errors');

  return (
    <main className="not-found">
      <p className="not-found__code">503</p>
      <h1 className="not-found__title">{t('NETWORK')}</h1>
      <a className="btn btn-primary" href="">
        {t('RETRY')}
      </a>
    </main>
  );
}
