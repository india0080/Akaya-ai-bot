import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

/** Scrollable screen container with a soft enter transition. `nav` reserves space for a bottom tab bar (agent UIs). */
export function Screen({ children, nav = false, className = '' }: { children: ReactNode; nav?: boolean; className?: string }) {
  return (
    <motion.main
      className={`screen${nav ? ' with-nav' : ''} ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      {children}
    </motion.main>
  );
}
