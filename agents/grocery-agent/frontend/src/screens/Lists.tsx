import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { SavedList } from '../api/types';
import { ListSheet } from '../components/ListSheet';
import { DAYS, hhmm12, inr, istWhen, STRATEGY } from '../lib/format';
import { Toggle, Icon, Screen, useToast } from '@akaya/ui';

export function Lists() {
  const nav = useNavigate();
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const [lists, setLists] = useState<SavedList[] | null>(null);
  const [edit, setEdit] = useState<SavedList | null>(null);
  const [running, setRunning] = useState('');
  const creating = sp.get('new') === '1';
  const load = () => api.lists().then(setLists, () => setLists([]));
  useEffect(() => {
    api.lists().then(setLists, () => setLists([]));
  }, []);

  const run = async (l: SavedList) => {
    setRunning(l.id);
    try {
      const r = await api.runList(l.id);
      nav(r.checkoutId ? `/checkout/${r.checkoutId}` : `/compare/${r.quoteId}`);
    } catch (e) {
      toast((e as Error).message, 'alert');
      setRunning('');
    }
  };
  const toggle = async (l: SavedList, enabled: boolean) => {
    const schedule = {
      days: [6],
      time: '09:00',
      strategy: 'cheapest' as const,
      autoFill: true,
      ...l.schedule,
      enabled,
    };
    const u = await api.updateList(l.id, { schedule });
    setLists((ls) => ls && ls.map((x) => (x.id === u.id ? u : x)));
  };

  return (
    <Screen nav className="lists">
      <header className="tab-head">
        <h1>Lists</h1>
        <button className="btn btn-sm btn-brand" onClick={() => setSp({ new: '1' })}>
          <Icon name="plus" size={15} /> New
        </button>
      </header>
      {lists?.length === 0 && (
        <div className="empty">
          <Icon name="list" size={26} />
          <p>Save lists you buy often, add a budget and a weekly schedule.</p>
        </div>
      )}
      {lists?.map((l) => (
        <section key={l.id} className="list-card card">
          <header>
            <span className="lc-em">{l.emoji}</span>
            <span className="grow">
              <b>{l.name}</b>
              <small>
                {l.text.split(',').length} items{l.budget ? ` · budget ${inr(l.budget)}` : ''}
              </small>
            </span>
            <button className="icon-btn" onClick={() => setEdit(l)} aria-label={`Edit ${l.name}`}>
              <Icon name="edit" size={17} />
            </button>
          </header>
          <p className="lc-text">{l.text}</p>
          <div className="lc-sched">
            <span className="gi gi-violet">
              <Icon name="calendar" size={14} />
            </span>
            <span className="grow">
              {l.schedule?.enabled ? (
                <>
                  <b>
                    Every {l.schedule.days.map((d) => DAYS[d]).join(', ')} · {hhmm12(l.schedule.time)} IST
                  </b>
                  <small>
                    {STRATEGY[l.schedule.strategy].label} ·{' '}
                    {l.schedule.autoFill ? 'fills cart, you pay' : 'compare & review'}
                    {l.nextRunAt ? ` · next ${istWhen(l.nextRunAt)}` : ''}
                  </small>
                </>
              ) : (
                <>
                  <b>No schedule</b>
                  <small>Run it whenever you need</small>
                </>
              )}
            </span>
            <Toggle
              on={!!l.schedule?.enabled}
              onChange={(v) => void toggle(l, v)}
              label={`Weekly schedule for ${l.name}`}
            />
          </div>
          <button className="btn btn-ghost btn-block" disabled={running === l.id} onClick={() => void run(l)}>
            {running === l.id ? <span className="spin" /> : <Icon name="compare" size={16} />} Compare now
          </button>
        </section>
      ))}
      <p className="fine center">
        Scheduled runs compare prices, can fill the cart, then notify you. Payment always waits for you.
      </p>
      <ListSheet
        open={!!edit || creating}
        onClose={() => {
          setEdit(null);
          if (creating) setSp({});
        }}
        initial={edit ?? { name: 'Weekly staples', text: '2 kg aata, 1 L Amul milk, 6 eggs, 1 kg pyaz', emoji: '🧺' }}
        onSaved={() => void load()}
      />
    </Screen>
  );
}
