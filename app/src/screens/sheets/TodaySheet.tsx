import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, Icon, type IconName, Segmented, useToast } from '@akaya/ui';
import { useApp } from '../../state/store';
import { fmtTime } from '../../lib/time';
import type { TodayItem } from '../../state/types';

type F = 'all' | TodayItem['kind'];
const META: Record<TodayItem['kind'], { icon: IconName; color: string; bg: string; label: string }> = {
  calendar: { icon: 'cal', color: 'var(--blue)', bg: 'var(--tint-blue)', label: 'Event' },
  followup: { icon: 'follow', color: 'var(--green-text)', bg: 'var(--tint-green)', label: 'Follow-up' },
};

export function TodaySheet({ open, onClose, kind }: { open: boolean; onClose: () => void; kind: string | null }) {
  const { state, toggleToday, addToday } = useApp();
  const toast = useToast();
  const nav = useNavigate();
  const [f, setF] = useState<F>('all');
  const [text, setText] = useState('');
  const [time, setTime] = useState('18:00');
  const [prev, setPrev] = useState({ open, kind });
  if (prev.open !== open || prev.kind !== kind) {
    setPrev({ open, kind });
    if (open) setF((kind as F) || 'all');
  }
  const items = state.today
    .filter((t) => f === 'all' || t.kind === f)
    .sort((a, b) => Number(a.done) - Number(b.done) || a.time - b.time);
  const add = () => {
    if (!text.trim()) return;
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    addToday({ kind: f === 'all' ? 'calendar' : f, title: text.trim(), time: d.getTime() });
    setText('');
    toast(`Added · I'll nudge you ${state.settings.reminderLead} min before`, 'alarm');
  };
  return (
    <Sheet open={open} onClose={onClose} title="Today" height={88}>
      <Segmented
        className="full"
        value={f}
        onChange={setF}
        options={[
          { value: 'all', label: 'All' },
          { value: 'calendar', label: 'Calendar' },
          { value: 'followup', label: 'Follow-ups' },
        ]}
      />
      <button className="td-row td-rem" onClick={() => nav('/reminders?day=today')}>
        <span className="td-ic" style={{ background: 'var(--tint-orange)', color: 'var(--orange)' }}>
          <Icon name="alarm" size={16} />
        </span>
        <span className="grow">
          <b>Reminders</b>
          <small>Open the reminders dashboard</small>
        </span>
        <Icon name="chev" size={15} />
      </button>
      <div className="td-list">
        {items.map((t) => {
          const m = META[t.kind];
          return (
            <button
              key={t.id}
              className={`td-row${t.done ? ' done' : ''}`}
              onClick={() => toggleToday(t.id)}
              aria-pressed={t.done}
            >
              <span className={`td-check${t.done ? ' on' : ''}`}>
                {t.done && <Icon name="check" size={14} strokeWidth={3} />}
              </span>
              <span className="grow">
                <b>{t.title}</b>
                <small>
                  {m.label} · {fmtTime(t.time)}
                </small>
              </span>
              <span className="td-ic" style={{ background: m.bg, color: m.color }}>
                <Icon name={m.icon} size={16} />
              </span>
            </button>
          );
        })}
        {!items.length && <div className="empty">Nothing here. Enjoy your day!</div>}
      </div>
      <div className="td-add">
        <input
          className="input"
          placeholder={`Add ${f === 'all' ? 'an event' : META[f].label.toLowerCase()}…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <input
          className="input td-time"
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          aria-label="Time"
        />
        <button className="btn btn-primary td-plus" onClick={add} aria-label="Add">
          <Icon name="plus" size={20} strokeWidth={2.4} />
        </button>
      </div>
    </Sheet>
  );
}
