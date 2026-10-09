import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '../components/Icon';

export interface HeadsUpItem {
  id: string;
  title: string;
  body: string;
  /** '#/route' opens that route; otherwise `fallback` is used. */
  link?: string;
}

/** Heads-up banner for live (SSE) notifications in agent UIs. Auto-dismisses after 5.2 s. */
export function HeadsUp({
  item,
  onDismiss,
  source,
  fallback,
  icon,
  tone = 'green',
}: {
  item: HeadsUpItem | null;
  onDismiss: () => void;
  /** e.g. "Akaya Shopping" */
  source: string;
  fallback: string;
  icon: IconName;
  tone?: 'green' | 'orange';
}) {
  const nav = useNavigate();
  useEffect(() => {
    if (!item) return;
    const t = window.setTimeout(onDismiss, 5200);
    return () => window.clearTimeout(t);
  }, [item, onDismiss]);
  return (
    <AnimatePresence>
      {item && (
        <motion.button
          key={item.id}
          className="heads-up"
          initial={{ y: -90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -90, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          onClick={() => {
            onDismiss();
            nav(item.link?.startsWith('#') ? item.link.slice(1) : fallback);
          }}
        >
          <span className={`gi gi-${tone} hu-ic`}>
            <Icon name={icon} size={18} />
          </span>
          <span className="hu-txt">
            <small>{source} · now</small>
            <b>{item.title}</b>
            <span>{item.body}</span>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
