import { useState } from 'react';
import { Icon, Sheet } from '@akaya/ui';
import {
  alertLabel,
  CATEGORY_BY_ID,
  reminderView,
  repeatLabel,
  SNOOZE_MINUTES,
  suggestFollowUp,
  type Reminder,
} from '@akaya/reminders';
import { epochToZoned, fmtWhen, zonedToEpoch } from '@akaya/tz';
import { CatIcon, PriorityTag } from './parts';
import { useNow } from '../../lib/useNow';
import { rescheduleSlots, whenText } from './format';

const TZ = 'Asia/Kolkata';

export interface DetailHandlers {
  onDone: (r: Reminder) => void;
  onPending: (r: Reminder) => void;
  onSnooze: (r: Reminder, minutes: number) => void;
  onReschedule: (r: Reminder, due: number) => void;
  onFollowUp: (r: Reminder, due: number) => void;
  onEdit: (r: Reminder) => void;
  onDelete: (r: Reminder) => void;
}

export function Detail({
  r,
  open,
  startReschedule,
  onClose,
  h,
}: {
  r: Reminder | null;
  open: boolean;
  startReschedule?: boolean;
  onClose: () => void;
  h: DetailHandlers;
}) {
  const now = useNow();
  const [mode, setMode] = useState<'main' | 'reschedule'>('main');
  const [pick, setPick] = useState({ date: '', time: '' });
  const [prev, setPrev] = useState({ open, id: r?.id });
  if (prev.open !== open || prev.id !== r?.id) {
    setPrev({ open, id: r?.id });
    if (open && r) {
      setMode(startReschedule ? 'reschedule' : 'main');
      setPick(epochToZoned(Math.max(r.due, now + 3600_000), TZ));
    }
  }
  if (!r) return null;
  const view = reminderView(r, now);
  const follow = view !== 'completed' ? suggestFollowUp(r, now) : null;
  const cat = CATEGORY_BY_ID[r.category];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={mode === 'reschedule' ? 'Reschedule' : 'Reminder'}
      height={mode === 'reschedule' ? 64 : 84}
    >
      <div className="rm-detail">
        <div className="rm-d-head">
          <CatIcon category={r.category} size={52} />
          <div className="grow">
            <h3>{r.title}</h3>
            <small>
              {cat.label}
              {r.sample ? ' · Sample' : ''}
            </small>
          </div>
          <span className={`rm-state s-${view}`}>
            {view === 'completed' ? 'Done' : view === 'missed' ? 'Missed' : 'Pending'}
          </span>
        </div>

        {mode === 'reschedule' ? (
          <>
            <div className="rm-slots">
              {rescheduleSlots(now).map((s) => (
                <button key={s.label} className="card rm-slot" onClick={() => h.onReschedule(r, s.due)}>
                  <b>{s.label}</b>
                  <small>{fmtWhen(s.due)}</small>
                </button>
              ))}
            </div>
            <div className="rm-two">
              <input
                className="input"
                type="date"
                value={pick.date}
                onChange={(e) => setPick({ ...pick, date: e.target.value })}
                aria-label="Date"
              />
              <input
                className="input"
                type="time"
                value={pick.time}
                onChange={(e) => setPick({ ...pick, time: e.target.value })}
                aria-label="Time"
              />
            </div>
            <button
              className="btn btn-primary btn-block"
              disabled={!pick.date || !pick.time}
              onClick={() => h.onReschedule(r, zonedToEpoch(pick.date, pick.time, TZ))}
            >
              Reschedule to {pick.date && pick.time ? fmtWhen(zonedToEpoch(pick.date, pick.time, TZ)) : '…'}
            </button>
            <button className="btn btn-ghost btn-block" onClick={() => setMode('main')}>
              Back
            </button>
          </>
        ) : (
          <>
            <div className="card list rm-facts">
              <div className="list-row">
                <Icon name="clock" size={17} />
                <span className="grow">{whenText(r)}</span>
                <PriorityTag priority={r.priority} />
              </div>
              <div className="list-row">
                <Icon name="repeat" size={17} />
                <span className="grow">{repeatLabel(r)}</span>
              </div>
              <div className="list-row">
                <Icon name="bell" size={17} />
                <span className="grow">{r.alerts.map(alertLabel).join(' · ')}</span>
              </div>
              {r.notes && (
                <div className="list-row">
                  <Icon name="note" size={17} />
                  <span className="grow">{r.notes}</span>
                </div>
              )}
            </div>

            <div className="rm-states">
              <button className={view === 'completed' ? 'on' : ''} onClick={() => h.onDone(r)}>
                <Icon name="check" size={18} strokeWidth={2.6} /> Done
              </button>
              <button className={view !== 'completed' ? 'on p' : ''} onClick={() => h.onPending(r)}>
                <Icon name="clock" size={18} /> Pending
              </button>
              <button onClick={() => setMode('reschedule')}>
                <Icon name="cal" size={18} /> Reschedule
              </button>
            </div>

            {view !== 'completed' && (
              <>
                <small className="rm-sub">Snooze</small>
                <div className="rm-snooze">
                  {SNOOZE_MINUTES.map((m) => (
                    <button key={m} className="card" onClick={() => h.onSnooze(r, m)}>
                      <b>{m}</b>
                      <small>min</small>
                    </button>
                  ))}
                </div>
              </>
            )}

            {follow && view === 'missed' && (
              <div className="card rm-follow">
                <Icon name="spark" size={18} />
                <span className="grow">
                  <b>{follow.reason}.</b> Remind you again: {follow.label}?<small>{fmtWhen(follow.due)}</small>
                </span>
                <button className="btn btn-primary btn-sm" onClick={() => h.onFollowUp(r, follow.due)}>
                  Yes
                </button>
              </div>
            )}

            <div className="rm-d-foot">
              <button className="btn btn-ghost btn-sm" onClick={() => h.onEdit(r)}>
                <Icon name="edit" size={15} /> Edit
              </button>
              <button className="btn btn-ghost btn-sm danger" onClick={() => h.onDelete(r)}>
                <Icon name="trash" size={15} /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </Sheet>
  );
}
