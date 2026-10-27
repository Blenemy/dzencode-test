'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { useEntranceAnimation } from '@/lib/use-entrance';

export default function AppTemplate({ children }: { children: ReactNode }) {
  const animate = useEntranceAnimation();

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 14 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
