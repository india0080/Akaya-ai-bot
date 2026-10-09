import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/** Scrollable screen container with a soft enter transition. */
export function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.main
      className={`screen ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      {children}
    </motion.main>
  );
}
