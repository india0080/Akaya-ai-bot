import { useState } from 'react';
import { api, type ListInput } from '../api/client';
import type { SavedList, Schedule, Strategy } from '../api/types';
import { DAYS, STRATEGY } from '../lib/format';
import { Segmented, Toggle, Icon, Sheet } from '@akaya/ui';

const EMOJI = ['🧺', '🥛', '🥗', '🍳', '🎉', '🍎', '🧹', '🍚'];
const DEFAULT_SCHEDULE: Schedule = { enabled: true, days: [6], time: '09:00', strategy: 'cheapest', autoFill: true };

export function ListSheet({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: Partial<SavedList> & { name: string; text: string };
  onSaved: (l: SavedList | null) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={initial.id ? 'Edit list' : 'Save list'} height={90}>
      {open && <ListForm initial={initial} onDone={(l) => (onSaved(l), onClose())} />}
    </Sheet>
  );
}

function ListForm({
  initial,
  onDone,
}: {
  initial: Partial<SavedList> & { name: string; text: string };
  onDone: (l: SavedList | null) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [emoji, setEmoji] = useState(initial.emoji ?? '🧺');
  const [text, setText] = useState(initial.text);
  const [budget, setBudget] = useState(initial.budget ? String(initial.budget) : '');
  const [sched, setSched] = useState<Schedule>(initial.schedule ?? { ...DEFAULT_SCHEDULE, enabled: false });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const upd = (p: Partial<Schedule>) => setSched((s) => ({ ...s, ...p }));

  const save = async () => {
    setBusy(true);
    setErr('');
    const body: ListInput = {
      name: name.trim() || 'My list',
      emoji,
      text: text.trim(),
      budget: Number(budget) || undefined,
      schedule: sched,
    };
    try {
      onDone(initial.id ? await api.updateList(initial.id, body) : await api.createList(body));
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!initial.id) return;
    await api.deleteList(initial.id).catch(() => {});
    onDone(null);
  };

  return (
    <div className="list-form">
      <div className="emoji-pick">
        {EMOJI.map((e) => (
          <button key={e} className={e === emoji ? 'on' : ''} onClick={() => setEmoji(e)} aria-label={`Icon ${e}`}>
            {e}
          </button>
        ))}
      </div>
      <label className="label">Name</label>
      <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      <label className="label">Items</label>
      <textarea className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)} />
      <label className="label">Budget (optional)</label>
      <div className="input rupee-in">
        ₹
        <input
          inputMode="numeric"
          value={budget}
          onChange={(e) => setBudget(e.target.value.replace(/\D/g, ''))}
          placeholder="No limit"
        />
      </div>

      <div className="sched-box card flat">
        <div className="sched-head">
          <span className="gi gi-violet">
            <Icon name="calendar" size={16} />
          </span>
          <span className="grow">
            <b>Weekly schedule</b>
            <small>Times in IST</small>
          </span>
          <Toggle on={sched.enabled} onChange={(v) => upd({ enabled: v })} label="Weekly schedule" />
        </div>
        {sched.enabled && (
          <>
            <div className="days">
              {DAYS.map((d, i) => (
                <button
                  key={d}
                  className={`chip${sched.days.includes(i) ? ' on' : ''}`}
                  onClick={() =>
                    upd({
                      days: sched.days.includes(i) ? sched.days.filter((x) => x !== i) : [...sched.days, i].sort(),
                    })
                  }
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="sched-row">
              <span>Time</span>
              <input
                className="input time-in"
                type="time"
                value={sched.time}
                onChange={(e) => upd({ time: e.target.value })}
              />
            </div>
            <Segmented<Strategy>
              className="mini"
              value={sched.strategy}
              onChange={(v) => upd({ strategy: v })}
              options={(['cheapest', 'fastest', 'balanced'] as Strategy[]).map((s) => ({
                value: s,
                label: STRATEGY[s].label,
              }))}
            />
            <div className="sched-row">
              <span>
                <b>Fill the cart automatically</b>
                <small>Then notifies you to confirm and pay. Never pays.</small>
              </span>
              <Toggle on={sched.autoFill} onChange={(v) => upd({ autoFill: v })} label="Fill the cart automatically" />
            </div>
          </>
        )}
      </div>
      {err && <p className="voice-err">{err}</p>}
      <button className="btn btn-brand btn-block" disabled={busy || !text.trim()} onClick={() => void save()}>
        <Icon name="check" size={17} /> {initial.id ? 'Save changes' : 'Save list'}
      </button>
      {initial.id && (
        <button className="btn btn-ghost btn-block danger" onClick={() => void remove()}>
          <Icon name="trash" size={16} /> Delete list
        </button>
      )}
    </div>
  );
}
