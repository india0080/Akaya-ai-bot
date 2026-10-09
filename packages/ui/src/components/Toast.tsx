import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

/** optional button on the toast, e.g. Undo */
export interface ToastAction {
  label: string;
  onClick: () => void;
}
interface ToastMsg {
  id: number;
  text: string;
  icon?: IconName;
  action?: ToastAction;
}
type Show = (text: string, icon?: IconName, action?: ToastAction) => void;
const Ctx = createContext<Show>(() => {});

/** 2.4 s toast; 5 s when it carries an action so there is time to tap Undo */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<ToastMsg | null>(null);
  const timer = useRef<number>(0);
  const show = useCallback<Show>((text, icon, action) => {
    window.clearTimeout(timer.current);
    setMsg({ id: Date.now(), text, icon, action });
    timer.current = window.setTimeout(() => setMsg(null), action ? 5000 : 2400);
  }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="toast-host" aria-live="polite">
        <AnimatePresence>
          {msg && (
            <motion.div
              key={msg.id}
              className={`toast${msg.action ? ' has-action' : ''}`}
              initial={{ y: -30, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0 }}
            >
              <Icon name={msg.icon ?? 'check'} size={16} strokeWidth={2.4} />
              <span className="toast-text">{msg.text}</span>
              {msg.action && (
                <button
                  className="toast-action"
                  onClick={() => {
                    msg.action!.onClick();
                    window.clearTimeout(timer.current);
                    setMsg(null);
                  }}
                >
                  {msg.action.label}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(Ctx);
