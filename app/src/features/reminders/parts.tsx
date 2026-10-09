/** Small shared pieces for reminder surfaces (dashboard, sheets, chat card, Today slider). */
import { Icon, type IconName } from '@akaya/ui';
import {
  CATEGORY_BY_ID,
  repeatLabel,
  reminderView,
  type CategoryId,
  type Priority,
  type Reminder,
} from '@akaya/reminders';
import { fmtWhen } from '@akaya/tz';
import { PRIORITY_COLOR, PRIORITY_LABEL, whenText } from './format';

export function CatIcon({ category, size = 38 }: { category: CategoryId; size?: number }) {
  const c = CATEGORY_BY_ID[category];
  return (
    <span
      className={`gi gi-${c.tone} rm-cat`}
      style={{ width: size, height: size, borderRadius: size * 0.34 }}
      aria-hidden="true"
    >
      <Icon name={c.icon as IconName} size={Math.round(size * 0.47)} />
    </span>
  );
}

export function PriorityTag({ priority }: { priority: Priority }) {
  return (
    <span className={`rm-pri p-${priority}`} style={{ '--pc': PRIORITY_COLOR[priority] } as React.CSSProperties}>
      <i />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

/** priority, repeat, alert count and Sample chips under a reminder title */
export function ReminderMeta({ r }: { r: Reminder }) {
  return (
    <span className="rm-meta">
      <PriorityTag priority={r.priority} />
      {r.repeat.kind !== 'none' && (
        <span className="rm-chip">
          <Icon name="repeat" size={11} /> {repeatLabel(r)}
        </span>
      )}
      {r.alerts.length > 1 && (
        <span className="rm-chip">
          <Icon name="bell" size={11} /> {r.alerts.length} alerts
        </span>
      )}
      {r.sample && <span className="rm-chip sample">Sample</span>}
    </span>
  );
}

export function ReminderRow({
  r,
  now,
  onOpen,
  onDone,
  extra,
}: {
  r: Reminder;
  now: number;
  onOpen: () => void;
  onDone: () => void;
  extra?: React.ReactNode;
}) {
  const view = reminderView(r, now);
  return (
    <div className={`card rm-row v-${view}`} style={{ '--pc': PRIORITY_COLOR[r.priority] } as React.CSSProperties}>
      <button className="rm-row-main" onClick={onOpen}>
        <CatIcon category={r.category} />
        <span className="grow">
          <b>{r.title}</b>
          <small>
            {view === 'completed' && r.doneAt ? `Done · ${fmtWhen(r.doneAt)}` : whenText(r)}
            {r.snoozedUntil && view !== 'completed' ? ' · snoozed' : ''}
          </small>
          <ReminderMeta r={r} />
        </span>
      </button>
      <button
        className={`rm-check${view === 'completed' ? ' on' : ''}`}
        aria-label={view === 'completed' ? 'Mark pending' : 'Mark done'}
        onClick={onDone}
      >
        <Icon name="check" size={15} strokeWidth={3} />
      </button>
      {extra}
    </div>
  );
}
