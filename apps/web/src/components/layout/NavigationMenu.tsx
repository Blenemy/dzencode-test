'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import Offcanvas from 'react-bootstrap/Offcanvas';
import { Icon } from '@/components/icons/Icon';
import { Link, usePathname } from '@/i18n/navigation';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/auth.slice';
import { Avatar } from './Avatar';

const SECTIONS = ['orders', 'groups', 'products', 'users', 'settings'] as const;

interface NavigationMenuProps {
  open: boolean;
  onClose: () => void;
}

export function NavigationMenu({ open, onClose }: NavigationMenuProps) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const user = useAppSelector(selectUser);

  return (
    <Offcanvas
      show={open}
      onHide={onClose}
      responsive="lg"
      className="nav-menu"
      aria-label={t('label')}
    >
      <Offcanvas.Header closeButton closeLabel={t('close')} className="nav-menu__header" />
      <Offcanvas.Body className="nav-menu__body">
        {user && (
          <div className="nav-menu__profile">
            <Avatar user={user} />
            <Link
              href="/settings"
              className="nav-menu__settings"
              aria-label={t('profile')}
              title={t('profile')}
              onClick={onClose}
            >
              <Icon name="gear" size={14} />
            </Link>
          </div>
        )}

        <nav className="nav-menu__links" aria-label={t('label')}>
          {SECTIONS.map((section) => {
            const href = `/${section}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={section}
                href={href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={`nav-menu__link${active ? ' nav-menu__link--active' : ''}`}
              >
                {t(section)}
                {active && (
                  <motion.span
                    layoutId="nav-menu-underline"
                    className="nav-menu__underline"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </Offcanvas.Body>
    </Offcanvas>
  );
}
