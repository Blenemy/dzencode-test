'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/Icon';
import { useAppSelector } from '@/store/hooks';
import { selectRealtimeOnline, selectSessionsCount } from '@/store/sessions.slice';

export function SessionsBadge() {
  const t = useTranslations('topMenu');
  const count = useAppSelector(selectSessionsCount);
  const online = useAppSelector(selectRealtimeOnline);
  const label = online && count !== null ? t('sessions', { count }) : t('sessionsOffline');

  return (
    <span
      className={`sessions-badge${online ? '' : ' sessions-badge--offline'}`}
      title={label}
      aria-label={label}
      role="status"
    >
      <Icon name="tabs" size={14} />
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={count ?? 'none'}
          className="sessions-badge__count"
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 8, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {count ?? '–'}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
