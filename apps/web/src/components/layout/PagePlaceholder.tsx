import { useTranslations } from 'next-intl';

type Section = 'orders' | 'products' | 'groups' | 'users' | 'settings';

export function PagePlaceholder({ section }: { section: Section }) {
  const t = useTranslations('pages');

  return (
    <section className="page">
      <h1 className="page__title">{t(section)}</h1>
      <p className="page__hint">{t('soon')}</p>
    </section>
  );
}
