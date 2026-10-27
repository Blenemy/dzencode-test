'use client';

import { useEffect, type ReactNode } from 'react';
import { motion } from 'motion/react';

let hasNavigated = false;

export default function AppTemplate({ children }: { children: ReactNode }) {
  const animate = hasNavigated;

  useEffect(() => {
    hasNavigated = true;
  }, []);

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
