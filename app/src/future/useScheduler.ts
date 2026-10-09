import { useEffect, useRef } from 'react';
import { useApp } from '../state/store';
import { useToast } from '../components/Toast';
import { showNow } from '../native/notify';
import { nextRepeat, overall, simulateSend, summary } from './engine';

const SEND_MS = 1400;

/**
 * Runs inside the app (demo mode): when a scheduled message comes due it moves
 * scheduled → sending → sent / failed / needs-tap, logs a notification and re-queues repeats.
 */
export function useFutureScheduler() {
  const { state, updateMessage, scheduleMessage, notify } = useApp();
  const toast = useToast();
  const busy = useRef(new Set<string>());
  // in-flight sends survive state updates (the due-check effect re-runs on every change)
  const sends = useRef<number[]>([]);
  useEffect(() => () => sends.current.forEach(clearTimeout), []);
  const live = useRef({ updateMessage, scheduleMessage, notify, toast });
  useEffect(() => {
    live.current = { updateMessage, scheduleMessage, notify, toast };
  });

  useEffect(() => {
    const pending = state.future.filter((m) => m.status === 'scheduled' || m.status === 'sending');
    if (!pending.length) return;
    const nextAt = Math.min(...pending.map((m) => m.when));
    const timers: number[] = [];
    const run = () => {
      const now = Date.now();
      for (const m of pending) {
        if (m.when > now || busy.current.has(m.id)) continue;
        busy.current.add(m.id);
        const { updateMessage: upd, scheduleMessage: sched, notify: note, toast: t } = live.current;
        upd(m.id, (x) => ({ ...x, status: 'sending' }));
        sends.current.push(
          window.setTimeout(() => {
            const results = simulateSend(m);
            const status = overall(results);
            const done = {
              ...m,
              status,
              results,
              attempts: (m.attempts ?? 0) + 1,
              sentAt: Date.now(),
              error: status === 'failed' ? 'Channel rejected the request (sample error)' : undefined,
            };
            upd(m.id, () => done);
            const s = summary(done);
            note(s.title, s.body, 'future');
            showNow(s.title, s.body);
            t(s.title, status === 'failed' ? 'alert' : 'future');
            const rep = status !== 'failed' ? nextRepeat(m) : null;
            if (rep) {
              const { id: _old, status: _s, ...rest } = rep;
              void _old;
              void _s;
              sched(rest);
            }
            busy.current.delete(m.id);
          }, SEND_MS),
        );
      }
    };
    const delay = Math.max(0, Math.min(nextAt - Date.now(), 2 ** 31 - 1));
    timers.push(window.setTimeout(run, delay));
    return () => timers.forEach(clearTimeout);
  }, [state.future]);
}
