import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@akaya/ui';
import { alertLabel, SNOOZE_MINUTES, type Reminder } from '@akaya/reminders';
import { PRIORITY_COLOR, whenText } from './format';
import { CatIcon } from './parts';

export interface BannerAlert {
  key: string;
  reminder: Reminder;
  before: number;
}

/**
 * In-app reminder alert (web, and the demo). Urgent alerts stay until acted on; others hide after 12 s.
 * Same three actions as the Android notification: Done, Snooze, Reschedule.
 */
export function AlertBanner({
  alert,
  onDismiss,
  onDone,
  onSnooze,
  onReschedule,
}: {
  alert: BannerAlert | null;
  onDismiss: () => void;
  onDone: (r: Reminder) => void;
  onSnooze: (r: Reminder, minutes: number) => void;
  onReschedule: (r: Reminder) => void;
}) {
  /** the alert whose snooze options are open (resets naturally when a new alert arrives) */
  const [snoozeFor, setSnoozeFor] = useState<string | null>(null);
  const urgent = alert?.reminder.priority === 'urgent';
  const key = alert?.key;
  useEffect(() => {
    if (!key || urgent) return;
    const t = window.setTimeout(onDismiss, 12_000);
    return () => window.clearTimeout(t);
  }, [key, urgent, onDismiss]);
  const r = alert?.reminder;
  return (
    <AnimatePresence>
      {alert && r && (
        <motion.div
          key={alert.key}
          className={`rm-alert card${urgent ? ' urgent' : ''}`}
          style={{ '--pc': PRIORITY_COLOR[r.priority] } as React.CSSProperties}
          initial={{ y: -120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -120, opacity: 0 }}
          transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          role="alertdialog"
          aria-label={`Reminder: ${r.title}`}
        >
          <div className="rm-alert-top">
            <CatIcon category={r.category} size={40} />
            <span className="grow">
              <small>
                Akaya Reminder · {alert.before ? alertLabel(alert.before) : 'now'}
                {urgent ? ' · Urgent' : ''}
              </small>
              <b>{r.title}</b>
              <span>{whenText(r)}</span>
            </span>
            {!urgent && (
              <button className="rm-x" aria-label="Dismiss" onClick={onDismiss}>
                <Icon name="close" size={16} />
              </button>
            )}
          </div>
          {snoozeFor === alert.key ? (
            <div className="rm-alert-acts">
              {SNOOZE_MINUTES.map((m) => (
                <button key={m} onClick={() => onSnooze(r, m)}>
                  {m} min
                </button>
              ))}
            </div>
          ) : (
            <div className="rm-alert-acts">
              <button className="pri" onClick={() => onDone(r)}>
                <Icon name="check" size={15} strokeWidth={2.6} /> Done
              </button>
              <button onClick={() => setSnoozeFor(alert.key)}>
                <Icon name="alarm" size={15} /> Snooze
              </button>
              <button onClick={() => onReschedule(r)}>
                <Icon name="cal" size={15} /> Reschedule
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
