import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface ToastMsg {
  id: number;
  text: string;
  icon?: IconName;
}
const Ctx = createContext<(text: string, icon?: IconName) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const timer = useRef<number>(0);
  const show = useCallback((text: string, icon?: IconName) => {
    window.clearTimeout(timer.current);
    setMsg({ id: Date.now(), text, icon });
    timer.current = window.setTimeout(() => setMsg(null), 2400);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="toast-host" aria-live="polite">
        <AnimatePresence>
          {msg && (
            <motion.div
              key={msg.id}
              className="toast"
              initial={{ y: -30, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0 }}
            >
              <Icon name={msg.icon ?? 'check'} size={16} strokeWidth={2.4} />
              {msg.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(Ctx);
