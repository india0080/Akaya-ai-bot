import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../state';
import { Icon } from '../ui/Icon';

/** Heads-up banner for live (SSE) notifications. */
export function NotifBanner() {
  const { latest, dismissLatest } = useStore();
  const nav = useNavigate();
  useEffect(() => {
    if (!latest) return;
    const t = window.setTimeout(dismissLatest, 5200);
    return () => window.clearTimeout(t);
  }, [latest, dismissLatest]);
  return (
    <AnimatePresence>
      {latest && (
        <motion.button
          key={latest.id}
          className="heads-up"
          initial={{ y: -90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -90, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          onClick={() => {
            dismissLatest();
            nav(latest.link?.startsWith('#') ? latest.link.slice(1) : '/orders');
          }}
        >
          <span className={`gi ${latest.kind === 'ready_to_pay' ? 'gi-orange' : 'gi-green'} hu-ic`}>
            <Icon name={latest.kind === 'ready_to_pay' ? 'wallet' : latest.kind === 'order' ? 'truck' : latest.kind === 'list_ready' ? 'basket' : 'bell'} size={18} />
          </span>
          <span className="hu-txt">
            <small>Akaya Grocery · now</small>
            <b>{latest.title}</b>
            <span>{latest.body}</span>
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
