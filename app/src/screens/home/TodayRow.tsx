import { Icon, type IconName } from '../../components/Icon';
import { useApp } from '../../state/store';
import { fmtTime } from '../../lib/time';
import type { TodayItem } from '../../state/types';

const KINDS: { kind: TodayItem['kind']; label: string; icon: IconName; color: string; bg: string }[] = [
  { kind: 'reminder', label: 'Reminders', icon: 'alarm', color: 'var(--orange)', bg: 'var(--tint-orange)' },
  { kind: 'calendar', label: 'Calendar', icon: 'cal', color: 'var(--blue)', bg: 'var(--tint-blue)' },
  { kind: 'followup', label: 'Follow-ups', icon: 'follow', color: 'var(--green-text)', bg: 'var(--tint-green)' },
];

export function TodayRow({ onOpen }: { onOpen: (kind: string) => void }) {
  const { state } = useApp();
  return (
    <div className="today">
      {KINDS.map((k) => {
        const items = state.today.filter((t) => t.kind === k.kind && !t.done).sort((a, b) => a.time - b.time);
        const next = items[0];
        return (
          <button key={k.kind} className="card tc" onClick={() => onOpen(k.kind)}>
            <span className="tc-top">
              <span className="tc-ic" style={{ background: k.bg, color: k.color }}>
                <Icon name={k.icon} size={17} />
              </span>
              <span className="tc-n">{items.length}</span>
            </span>
            <b>{k.label}</b>
            <small>
              {next ? (
                <>
                  {next.title}
                  <br />
                  {fmtTime(next.time)}
                </>
              ) : (
                <>
                  All done
                  <br />
                  for today ✓
                </>
              )}
            </small>
          </button>
        );
      })}
    </div>
  );
}
