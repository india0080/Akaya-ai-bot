import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useEffect, type ReactNode } from 'react';
import { pushBackHandler } from '../native/backStack';
import { Icon } from './Icon';
import { useDeviceHost } from './deviceHost';
import './Sheet.css';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** max height as % of the device */
  height?: number;
}

/** Bottom sheet rendered inside the phone (#device). Drag down or tap the backdrop to close. */
export function Sheet({ open, onClose, title, children, height = 86 }: Props) {
  const host = useDeviceHost();
  // Android back button closes the newest open sheet first
  useEffect(() => (open ? pushBackHandler(onClose) : undefined), [open, onClose]);
  if (!host) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="sheet"
            role="dialog"
            aria-modal="true"
            style={{ maxHeight: `${height}%` }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 600) onClose();
            }}
          >
            <div className="sheet-grab" />
            {title && (
              <div className="sheet-head">
                <h3>{title}</h3>
                <button className="icon-btn sheet-x" onClick={onClose} aria-label="Close">
                  <Icon name="close" size={18} />
                </button>
              </div>
            )}
            <div className="sheet-body" onPointerDownCapture={(e) => e.stopPropagation()}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    host,
  );
}
