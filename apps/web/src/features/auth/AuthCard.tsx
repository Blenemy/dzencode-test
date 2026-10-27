'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Logo } from '@/components/brand/Logo';
import './auth.scss';

interface AuthCardProps {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, footer, children }: AuthCardProps) {
  return (
    <motion.section
      className="auth-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="auth-card__brand">
        <Logo />
      </div>
      <h1 className="auth-card__title">{title}</h1>
      <p className="auth-card__subtitle">{subtitle}</p>
      {children}
      <footer className="auth-card__footer">{footer}</footer>
    </motion.section>
  );
}
