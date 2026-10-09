import { useEffect, useRef, useState } from 'react';
import { Icon, type IconName, Sheet, useToast } from '@akaya/ui';
import {
  ALERT_PRESETS,
  alertLabel,
  CATEGORIES,
  CATEGORY_BY_ID,
  parseReminder,
  PRIORITIES,
  templateDue,
  type CategoryId,
  type Priority,
  type Reminder,
  type ReminderSource,
  type Repeat,
  type Template,
} from '@akaya/reminders';
import { epochToZoned, zonedToEpoch } from '@akaya/tz';
import { createRecognizer, type SpeechRec } from '../../lib/speech';
import { useApp } from '../../state/store';
import type { ReminderDraft } from './state';
import { useNow } from '../../lib/useNow';
import { centerSelected } from '../../lib/scroll';

const TZ = 'Asia/Kolkata';
const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const REPEATS: { kind: Repeat['kind']; label: string }[] = [
  { kind: 'none', label: 'Once' },
  { kind: 'daily', label: 'Daily' },
  { kind: 'weekly', label: 'Weekly' },
  { kind: 'monthly', label: 'Monthly' },
  { kind: 'yearly', label: 'Yearly' },
  { kind: 'custom', label: 'Custom' },
];
const DEMO_LINE = 'Hey Akaya, कल सुबह 10 बजे मीटिंग याद दिलाना';
const EXAMPLES = [
  'kal subah 10 baje meeting',
  'har roz raat 9 baje dawai',
  'every Monday 8 am gym',
  'in 2 hours call Rahul, urgent',
];

export interface ComposerInit {
  text?: string;
  category?: CategoryId;
  edit?: Reminder;
  /** where the reminder is being created from (chat / voice / form) */
  source?: ReminderSource;
}

interface Form {
  title: string;
  date: string;
  time: string;
  category: CategoryId;
  priority: Priority;
  repeat: Repeat;
  alerts: number[];
  notes: string;
}

function blank(now: number, lead: number, category: CategoryId = 'general'): Form {
  const d = epochToZoned(Math.ceil((now + 3600_000) / 1800_000) * 1800_000, TZ);
  return {
    title: '',
    date: d.date,
    time: d.time,
    category,
    priority: 'normal',
    repeat: { kind: 'none' },
    alerts: [lead, 0],
    notes: '',
  };
}
const fromReminder = (r: Reminder): Form => ({
  ...epochToZoned(r.due, TZ),
  title: r.title,
  category: r.category,
  priority: r.priority,
  repeat: r.repeat,
  alerts: r.alerts,
  notes: r.notes ?? '',
});

/** Create / edit a reminder: type or say it (Hindi, Hinglish, English), pick a template, or fill the form. */
export function Composer({
  open,
  init,
  onClose,
  onSave,
}: {
  open: boolean;
  init: ComposerInit;
  onClose: () => void;
  onSave: (draft: ReminderDraft, edit?: Reminder) => void;
}) {
  const { state } = useApp();
  const toast = useToast();
  const lead = state.settings.reminderLead;
  const now = useNow();
  const [text, setText] = useState('');
  const [form, setForm] = useState<Form>(() => blank(now, lead));
  const [understood, setUnderstood] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [custom, setCustom] = useState('');
  const rec = useRef<SpeechRec | null>(null);
  const catRow = useRef<HTMLDivElement>(null);
  const demoT = useRef<number[]>([]);

  const apply = (t: string, base: Form) => {
    setText(t);
    if (!t.trim()) return setUnderstood([]);
    const p = parseReminder(t, { tz: TZ });
    setUnderstood(p.understood);
    const when = p.due ? epochToZoned(p.due, TZ) : { date: base.date, time: base.time };
    setForm({ ...base, title: p.title, ...when, category: p.category, priority: p.priority, repeat: p.repeat });
  };

  // reset whenever the sheet opens with new input
  const [prev, setPrev] = useState<{ open: boolean; init: ComposerInit }>({ open: false, init });
  if (prev.open !== open || prev.init !== init) {
    setPrev({ open, init });
    if (open) {
      const base = init.edit ? fromReminder(init.edit) : blank(now, lead, init.category);
      setForm(base);
      setText('');
      setUnderstood([]);
      setCustom('');
      if (init.text && !init.edit) apply(init.text, base);
    }
  }

  const stopVoice = () => {
    rec.current?.abort();
    rec.current = null;
    demoT.current.forEach(clearTimeout);
    demoT.current = [];
    setListening(false);
  };
  useEffect(() => stopVoice, []);
  // keep the selected category chip in view (the NL parser may pick one far along the row)
  useEffect(() => centerSelected(catRow.current, '.chip.on'), [form.category, open]);
  const close = () => {
    stopVoice();
    onClose();
  };

  const voice = () => {
    if (listening) return stopVoice();
    const lang = /hindi/i.test(state.settings.language) ? 'hi-IN' : 'en-IN';
    const r = createRecognizer(lang);
    setListening(true);
    if (!r) {
      // no speech engine here (desktop preview / WebView without one): play the sample line so the flow can be seen
      toast('Voice demo: typing a sample request', 'mic');
      [...DEMO_LINE].forEach((_, i) =>
        demoT.current.push(window.setTimeout(() => apply(DEMO_LINE.slice(0, i + 1), form), 28 * i)),
      );
      demoT.current.push(window.setTimeout(stopVoice, 28 * DEMO_LINE.length + 200));
      return;
    }
    r.onresult = (e) => {
      let t = '';
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      apply(t, form);
    };
    r.onerror = () => stopVoice();
    r.onend = () => setListening(false);
    rec.current = r;
    try {
      r.start();
    } catch {
      stopVoice();
    }
  };

  const pickTemplate = (t: Template, category: CategoryId) => {
    const when = epochToZoned(templateDue(t.time, now, t.inDays, TZ), TZ);
    setForm({ ...form, title: t.title, ...when, category, priority: t.priority, repeat: t.repeat, alerts: t.alerts });
    setUnderstood([]);
  };

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleAlert = (m: number) =>
    set(
      'alerts',
      form.alerts.includes(m) ? form.alerts.filter((x) => x !== m) : [...form.alerts, m].sort((a, b) => b - a),
    );
  const addCustom = () => {
    const m = Math.round(Number(custom));
    if (m > 0 && m <= 60 * 24 * 60 && !form.alerts.includes(m))
      set(
        'alerts',
        [...form.alerts, m].sort((a, b) => b - a),
      );
    setCustom('');
  };

  const due = form.date && form.time ? zonedToEpoch(form.date, form.time, TZ) : NaN;
  const valid = form.title.trim() && Number.isFinite(due);
  const save = () => {
    if (!valid) return;
    stopVoice();
    onSave(
      {
        title: form.title.trim(),
        notes: form.notes.trim() || undefined,
        category: form.category,
        priority: form.priority,
        due,
        alerts: form.alerts.length ? form.alerts : [0],
        repeat: form.repeat,
        source: init.edit?.source ?? init.source ?? 'form',
      },
      init.edit,
    );
  };
  const cat = CATEGORY_BY_ID[form.category];

  return (
    <Sheet open={open} onClose={close} title={init.edit ? 'Edit reminder' : 'New reminder'} height={92}>
      <div className="rm-compose">
        {!init.edit && (
          <>
            <div className={`rm-say card${listening ? ' live' : ''}`}>
              <textarea
                rows={2}
                value={text}
                placeholder="Type or say it… e.g. कल सुबह 10 बजे मीटिंग"
                onChange={(e) => apply(e.target.value, form)}
                aria-label="Reminder in your words"
              />
              <button
                className={`rm-mic${listening ? ' on' : ''}`}
                onClick={voice}
                aria-label={listening ? 'Stop listening' : 'Speak'}
              >
                <Icon name={listening ? 'stop' : 'mic'} size={19} />
              </button>
            </div>
            {understood.length > 0 ? (
              <div className="rm-understood">
                <Icon name="spark" size={13} />
                {understood.map((u) => (
                  <i key={u}>{u}</i>
                ))}
              </div>
            ) : (
              <div className="chips rm-examples">
                {EXAMPLES.map((e) => (
                  <button key={e} className="chip" onClick={() => apply(e, form)}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <label className="label">Title</label>
        <input
          className="input"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="What should I remind you about?"
        />

        <div className="rm-two">
          <div>
            <label className="label">Date</label>
            <input className="input" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>
          <div>
            <label className="label">Time (IST)</label>
            <input className="input" type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
          </div>
        </div>

        <label className="label">Category</label>
        <div className="chips" ref={catRow}>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={`chip${form.category === c.id ? ' on' : ''}`}
              onClick={() => set('category', c.id)}
            >
              <Icon name={c.icon as IconName} size={13} />
              {c.label}
            </button>
          ))}
        </div>
        {cat.templates.length > 0 && !init.edit && (
          <div className="rm-templates">
            <small>Quick add · {cat.label}</small>
            <div className="chips">
              {cat.templates.map((t) => (
                <button key={t.title} className="chip rm-tpl" onClick={() => pickTemplate(t, cat.id)}>
                  <Icon name="plus" size={12} strokeWidth={2.6} />
                  {t.title}
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="label">Priority</label>
        <div className="rm-pris">
          {PRIORITIES.map((p) => (
            <button
              key={p.id}
              className={form.priority === p.id ? 'on' : ''}
              style={{ '--pc': p.color } as React.CSSProperties}
              onClick={() => set('priority', p.id)}
            >
              <i />
              {p.label}
            </button>
          ))}
        </div>
        {form.priority === 'urgent' && (
          <p className="fine">Urgent reminders ring on a louder channel and stay until you act.</p>
        )}

        <label className="label">Repeat</label>
        <div className="chips">
          {REPEATS.map((r) => (
            <button
              key={r.kind}
              className={`chip${form.repeat.kind === r.kind ? ' on' : ''}`}
              onClick={() =>
                set(
                  'repeat',
                  r.kind === 'custom' ? { kind: 'custom', everyDays: form.repeat.everyDays ?? 2 } : { kind: r.kind },
                )
              }
            >
              {r.label}
            </button>
          ))}
        </div>
        {form.repeat.kind === 'weekly' && (
          <div className="rm-wd">
            {WD.map((d, i) => {
              const on = form.repeat.weekdays?.includes(i);
              return (
                <button
                  key={i}
                  className={on ? 'on' : ''}
                  aria-pressed={on}
                  onClick={() => {
                    const cur = form.repeat.weekdays ?? [];
                    set('repeat', { kind: 'weekly', weekdays: on ? cur.filter((x) => x !== i) : [...cur, i].sort() });
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
        )}
        {form.repeat.kind === 'custom' && (
          <div className="rm-every">
            Every
            <input
              className="input"
              type="number"
              min={1}
              max={365}
              value={form.repeat.everyDays ?? 2}
              onChange={(e) =>
                set('repeat', { kind: 'custom', everyDays: Math.max(1, Math.min(365, Number(e.target.value) || 1)) })
              }
            />
            days
          </div>
        )}

        <label className="label">Alerts</label>
        <div className="chips rm-alerts">
          {[...new Set([...ALERT_PRESETS.filter((m) => [0, 10, 30, 60, 1440, 10080].includes(m)), ...form.alerts])]
            .sort((a, b) => b - a)
            .map((m) => (
              <button key={m} className={`chip${form.alerts.includes(m) ? ' on' : ''}`} onClick={() => toggleAlert(m)}>
                {alertLabel(m)}
              </button>
            ))}
        </div>
        <div className="rm-every">
          Custom
          <input
            className="input"
            type="number"
            min={1}
            placeholder="min"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
          />
          min before
          <button className="btn btn-ghost btn-sm" onClick={addCustom} disabled={!custom}>
            Add
          </button>
        </div>

        <label className="label">Notes</label>
        <textarea
          className="input rm-notes"
          rows={2}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Optional"
        />

        <button className="btn btn-primary btn-block rm-save" disabled={!valid} onClick={save}>
          <Icon name="check" size={18} strokeWidth={2.6} /> {init.edit ? 'Save changes' : 'Save reminder'}
        </button>
      </div>
    </Sheet>
  );
}
