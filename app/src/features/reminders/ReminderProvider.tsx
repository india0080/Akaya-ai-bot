import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@akaya/ui';
import { findDuplicate, type Reminder } from '@akaya/reminders';
import { fmtWhen } from '@akaya/tz';
import { ensureNotifyPermission } from '../../native/notify';
import { useApp } from '../../state/store';
import { AlertBanner } from './AlertBanner';
import { Composer, type ComposerInit } from './Composer';
import { Detail, type DetailHandlers } from './Detail';
import { DuplicateSheet } from './DuplicateSheet';
import { NotificationDemo } from './NotificationDemo';
import type { ReminderDraft } from './state';
import { useReminderEngine } from './useReminderEngine';
import './reminders.css';

export type CreateOutcome = { outcome: 'created' | 'merged'; id: string } | { outcome: 'cancelled' };

interface ReminderUI {
  /** open the composer (optionally prefilled with words, a category, or a reminder to edit) */
  compose: (init?: ComposerInit) => void;
  openDetail: (id: string, reschedule?: boolean) => void;
  openDemo: () => void;
  /** create with duplicate check (asks Merge / Keep both when needed) */
  create: (draft: ReminderDraft) => Promise<CreateOutcome>;
  /** create + "Reminder set · …" toast with Undo */
  add: (draft: ReminderDraft) => Promise<CreateOutcome>;
  /** shared action handlers (dashboard rows, chat card, Today slider) */
  h: DetailHandlers;
}

const Ctx = createContext<ReminderUI | null>(null);

/** Mount once (inside the router + ToastProvider): owns the reminder sheets, the alert banner and the engine. */
export function ReminderProvider({ children }: { children: ReactNode }) {
  const app = useApp();
  const { state } = app;
  const toast = useToast();
  const nav = useNavigate();
  const engine = useReminderEngine();

  const [composer, setComposer] = useState<{ open: boolean; init: ComposerInit }>({ open: false, init: {} });
  const [detail, setDetail] = useState<{ id: string | null; open: boolean; reschedule: boolean }>({
    id: null,
    open: false,
    reschedule: false,
  });
  const [demo, setDemo] = useState(false);
  const [dup, setDup] = useState<{ existing: Reminder; draft: ReminderDraft } | null>(null);
  const resolveDup = useRef<((o: CreateOutcome) => void) | null>(null);

  // the latest store/actions for stable callbacks
  const live = useRef(app);
  useEffect(() => {
    live.current = app;
  });
  const dupBefore = useRef<Reminder | null>(null);

  const create = useCallback((draft: ReminderDraft): Promise<CreateOutcome> => {
    void ensureNotifyPermission();
    const match = findDuplicate(draft, live.current.state.reminders);
    if (!match) return Promise.resolve({ outcome: 'created', id: live.current.addReminder(draft) });
    return new Promise((resolve) => {
      resolveDup.current = resolve;
      setDup({ existing: match.reminder, draft });
    });
  }, []);
  const finishDup = (o: CreateOutcome) => {
    resolveDup.current?.(o);
    resolveDup.current = null;
    setDup(null);
  };

  const h = useMemo<DetailHandlers>(() => {
    const a = () => live.current;
    return {
      onDone: (r) => {
        if (r.status === 'done') {
          a().setReminderPending(r.id);
          toast('Marked pending', 'clock');
          return;
        }
        a().completeReminder(r.id);
        toast(r.repeat.kind !== 'none' ? 'Done · next one scheduled' : 'Done', 'check', {
          label: 'Undo',
          onClick: () => a().restoreReminder(r),
        });
      },
      onPending: (r) => {
        a().setReminderPending(r.id);
        toast('Kept as pending · Akaya will follow up', 'clock');
      },
      onSnooze: (r, m) => {
        a().snoozeReminder(r.id, m);
        toast(`Snoozed ${m} min`, 'alarm', { label: 'Undo', onClick: () => a().restoreReminder(r) });
      },
      onReschedule: (r, due) => {
        a().rescheduleReminder(r.id, due);
        setDetail((d) => ({ ...d, open: false }));
        toast(`Moved to ${fmtWhen(due)}`, 'cal', { label: 'Undo', onClick: () => a().restoreReminder(r) });
      },
      onFollowUp: (r, due) => {
        a().followUpReminder(r.id, { due, label: '', reason: '' });
        setDetail((d) => ({ ...d, open: false }));
        toast(`Follow-up set · ${fmtWhen(due)}`, 'spark');
      },
      onEdit: (r) => {
        setDetail((d) => ({ ...d, open: false }));
        setComposer({ open: true, init: { edit: r } });
      },
      onDelete: (r) => {
        a().deleteReminder(r.id);
        setDetail((d) => ({ ...d, open: false }));
        toast('Reminder deleted', 'trash', { label: 'Undo', onClick: () => a().restoreReminder(r) });
      },
    };
  }, [toast]);

  /** create (with duplicate check) + toast with Undo */
  const add = useCallback(
    async (draft: ReminderDraft): Promise<CreateOutcome> => {
      const res = await create(draft);
      if (res.outcome === 'cancelled') return res;
      const before = res.outcome === 'merged' ? dupBefore.current : null;
      toast(`${res.outcome === 'merged' ? 'Merged' : 'Reminder set'} · ${fmtWhen(draft.due)}`, 'alarm', {
        label: 'Undo',
        onClick: () => (before ? live.current.restoreReminder(before) : live.current.deleteReminder(res.id)),
      });
      return res;
    },
    [create, toast],
  );

  const ui = useMemo<ReminderUI>(
    () => ({
      compose: (init = {}) => setComposer({ open: true, init }),
      openDetail: (id, reschedule = false) => setDetail({ id, open: true, reschedule }),
      openDemo: () => setDemo(true),
      create,
      add,
      h,
    }),
    [create, add, h],
  );

  const save = async (draft: ReminderDraft, edit?: Reminder) => {
    if (edit) {
      live.current.updateReminder(edit.id, (r) => ({ ...r, ...draft, snoozedUntil: undefined }));
      setComposer((c) => ({ ...c, open: false }));
      toast('Reminder updated', 'check', { label: 'Undo', onClick: () => live.current.restoreReminder(edit) });
      return;
    }
    setComposer((c) => ({ ...c, open: false }));
    await add(draft);
  };
  const testAlert = (urgent: boolean) => {
    const due = Date.now() + 10_000;
    // straight in (no duplicate check): test alerts are throwaway
    live.current.addReminder({
      title: urgent ? 'Urgent test reminder' : 'Test reminder',
      category: 'general',
      priority: urgent ? 'urgent' : 'normal',
      due,
      alerts: [0],
      repeat: { kind: 'none' },
      source: 'form',
    });
    setDemo(false);
    toast('Test alert in 10 seconds', 'bell');
  };

  const detailR = detail.id ? (state.reminders.find((r) => r.id === detail.id) ?? null) : null;
  return (
    <Ctx.Provider value={ui}>
      {children}
      <AlertBanner
        alert={engine.alert}
        onDismiss={engine.dismiss}
        onDone={(r) => {
          h.onDone(r);
          engine.dismiss();
        }}
        onSnooze={(r, m) => {
          h.onSnooze(r, m);
          engine.dismiss();
        }}
        onReschedule={(r) => {
          engine.dismiss();
          nav('/reminders');
          ui.openDetail(r.id, true);
        }}
      />
      <Composer
        open={composer.open}
        init={composer.init}
        onClose={() => setComposer((c) => ({ ...c, open: false }))}
        onSave={save}
      />
      <Detail
        r={detailR}
        open={detail.open && !!detailR}
        startReschedule={detail.reschedule}
        onClose={() => setDetail((d) => ({ ...d, open: false }))}
        h={h}
      />
      <DuplicateSheet
        existing={dup?.existing ?? null}
        draft={dup?.draft ?? null}
        onMerge={() => {
          if (!dup) return;
          dupBefore.current = dup.existing;
          live.current.mergeReminder(dup.existing.id, dup.draft);
          finishDup({ outcome: 'merged', id: dup.existing.id });
        }}
        onKeepBoth={() => dup && finishDup({ outcome: 'created', id: live.current.addReminder(dup.draft) })}
        onCancel={() => finishDup({ outcome: 'cancelled' })}
      />
      <NotificationDemo open={demo} onClose={() => setDemo(false)} onTest={testAlert} />
    </Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useReminders(): ReminderUI {
  const c = useContext(Ctx);
  if (!c) throw new Error('useReminders must be used inside <ReminderProvider>');
  return c;
}
