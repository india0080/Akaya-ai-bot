import { Icon, Sheet } from '@akaya/ui';
import type { Reminder } from '@akaya/reminders';
import { fmtWhen } from '@akaya/tz';
import { CatIcon, PriorityTag } from './parts';
import type { ReminderDraft } from './state';

/** Duplicate prevention: a similar reminder exists near the same time. Merge, keep both, or cancel. */
export function DuplicateSheet({
  existing,
  draft,
  onMerge,
  onKeepBoth,
  onCancel,
}: {
  existing: Reminder | null;
  draft: ReminderDraft | null;
  onMerge: () => void;
  onKeepBoth: () => void;
  onCancel: () => void;
}) {
  const open = Boolean(existing && draft);
  return (
    <Sheet open={open} onClose={onCancel} title="Looks like a duplicate" height={66}>
      {existing && draft && (
        <div className="rm-dup">
          <p className="muted">You already have a similar reminder around that time.</p>
          {[
            { tag: 'Existing', r: existing },
            { tag: 'New', r: draft },
          ].map(({ tag, r }) => (
            <div key={tag} className="card rm-dup-card">
              <CatIcon category={r.category} />
              <span className="grow">
                <small>{tag}</small>
                <b>{r.title}</b>
                <small>{fmtWhen(r.due)}</small>
              </span>
              <PriorityTag priority={r.priority} />
            </div>
          ))}
          <p className="fine">
            Merge keeps one reminder with the new time, every alert from both and the higher priority.
          </p>
          <button className="btn btn-primary btn-block" onClick={onMerge}>
            <Icon name="compare" size={17} /> Merge
          </button>
          <button className="btn btn-ghost btn-block" onClick={onKeepBoth}>
            Keep both
          </button>
          <button className="btn btn-block rm-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      )}
    </Sheet>
  );
}
