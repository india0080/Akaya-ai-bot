import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Checkout, Order, SavedList, Settings } from '../api/types';
import { SampleTag, StoreMark } from '../components/bits';
import { EXAMPLES } from '../lib/examples';
import { DAYS, hhmm12, inr, istWhen } from '../lib/format';
import { useStore } from '../state';
import { Icon, type IconName, Pearl, Screen, useToast } from '@akaya/ui';

const STEPS: { i: IconName; t: string; s: string; c: string }[] = [
  { i: 'list', t: 'Your list', s: 'Type or speak, any language', c: 'gi-violet' },
  { i: 'compare', t: 'Compare', s: '5 stores, fees included', c: 'gi-blue' },
  { i: 'cart', t: 'Cart filled', s: 'Cheapest or fastest basket', c: 'gi-cyan' },
  { i: 'lock', t: 'You pay', s: 'In the store app, UPI / OTP', c: 'gi-orange' },
];

export function Home({ onVoice }: { onVoice: () => void }) {
  const nav = useNavigate();
  const toast = useToast();
  const { setDraft, notifications } = useStore();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [lists, setLists] = useState<SavedList[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [pending, setPending] = useState<Checkout | null>(null);
  const [active, setActive] = useState<Order | null>(null);
  const [mockOnly, setMockOnly] = useState(true);

  useEffect(() => {
    api.lists().then(setLists, () => {});
    api.settings().then(setSettings, () => {});
    api.checkouts().then(
      (c) =>
        setPending(
          c.find(
            (x) =>
              x.status === 'ready_to_pay' && x.carts.some((k) => ['ready', 'partial', 'handed_off'].includes(k.status)),
          ) ?? null,
        ),
      () => {},
    );
    api.orders().then(
      (o) => setActive(o.find((x) => x.stage !== 'delivered') ?? null),
      () => {},
    );
    api.providers().then(
      (p) => setMockOnly(p.stores.every((s) => s.active.kind === 'mock')),
      () => {},
    );
  }, []);

  const go = async (t: string) => {
    if (!t.trim()) return;
    setBusy(true);
    try {
      const r = await api.parse(t.trim());
      if (!r.items.length) {
        toast(r.unknown.length ? `Couldn't recognise: ${r.unknown.join(', ')}` : 'Add a few items first', 'alert');
        return;
      }
      setDraft({ ...r, text: t.trim(), budget: settings?.budget });
      nav('/items');
    } catch {
      toast('Backend not reachable. Is it running on :8788?', 'alert');
    } finally {
      setBusy(false);
    }
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    void go(text);
  };
  const unread = notifications.filter((n) => !n.read).length;
  const scheduled = lists
    .filter((l) => l.schedule?.enabled && l.nextRunAt)
    .sort((a, b) => a.nextRunAt! - b.nextRunAt!)[0];

  return (
    <Screen nav className="home">
      <header className="home-top">
        <div className="brand">
          <Pearl width={44} height={44} r={15} glow={0.6} />
          <div>
            <h1>
              <span className="grad-text">Grocery</span> Agent
            </h1>
            <small className="addr">
              <Icon name="location" size={12} />{' '}
              {settings ? `${settings.address} · ${settings.pincode}` : 'Akaya · fills the cart, you pay'}
            </small>
          </div>
        </div>
        <button
          className="icon-btn card"
          onClick={() => nav('/orders')}
          aria-label={`Orders and alerts${unread ? `, ${unread} unread` : ''}`}
        >
          <Icon name="bell" size={20} />
          {unread > 0 && <i className="dot-badge">{unread}</i>}
        </button>
      </header>

      <section className="hero card">
        <p className="hello">Namaste Priya 👋</p>
        <h2>What do you need from the kirana today?</h2>
        <form className="list-box" onSubmit={submit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'2 kg aata, 1 L Amul milk, 6 eggs…\nEnglish, हिन्दी or Hinglish'}
            aria-label="Grocery list"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void go(text);
            }}
          />
          <div className="list-box-row">
            <button type="button" className="mic" onClick={onVoice} aria-label="Speak your list">
              <Icon name="mic" size={18} />
            </button>
            <button className="btn btn-brand go" disabled={busy || !text.trim()}>
              {busy ? <span className="spin" /> : <Icon name="spark" size={16} />} Read my list
            </button>
          </div>
        </form>
        <div className="examples">
          {EXAMPLES.map((x) => (
            <button key={x} className="chip" onClick={() => void go(x)}>
              {x}
            </button>
          ))}
        </div>
      </section>

      {mockOnly && (
        <div className="notice">
          <Icon name="box" size={16} />
          <span>
            Stores run on the <b>Mock provider</b>: realistic <b>sample</b> prices, fees and ETAs, not live store data.
            Connect your own store session or a partner API to go live.
          </span>
        </div>
      )}

      {pending && (
        <button className="pay-card card" onClick={() => nav(`/checkout/${pending.id}`)}>
          <span className="gi gi-orange">
            <Icon name="wallet" size={18} />
          </span>
          <span className="grow">
            <b>
              Ready to pay:{' '}
              {inr(
                pending.carts
                  .filter((c) => c.status !== 'cancelled')
                  .reduce((a, c) => a + (c.verifiedTotal ?? c.total), 0),
              )}
            </b>
            <small>{pending.carts.map((c) => c.storeName).join(' + ')} cart filled. Confirm and pay in the app.</small>
          </span>
          <Icon name="chev" size={16} />
        </button>
      )}
      {active && (
        <button className="track-card card" onClick={() => nav(`/orders/${active.id}`)}>
          <StoreMark store={active.store} size={38} />
          <span className="grow">
            <b>{active.stageLabel}</b>
            <small>
              {active.storeName} · {active.minutesLeft > 0 ? `about ${active.minutesLeft} min` : 'any moment'}
            </small>
            <span className="mini-progress">
              <i style={{ width: `${Math.max(6, active.progress * 100)}%` }} />
            </span>
          </span>
          <Icon name="chev" size={16} />
        </button>
      )}

      <div className="sec-head">
        <h3>Saved lists</h3>
        <button className="pill-link" onClick={() => nav('/lists')}>
          See all
        </button>
      </div>
      <div className="lists-row">
        {lists.slice(0, 6).map((l) => (
          <button key={l.id} className="mini-list card" onClick={() => void go(l.text)}>
            <span className="em">{l.emoji}</span>
            <b>{l.name}</b>
            <small>
              {l.text.split(',').length} items{l.budget ? ` · ≤ ${inr(l.budget)}` : ''}
            </small>
          </button>
        ))}
        <button className="mini-list card add" onClick={() => nav('/lists?new=1')}>
          <span className="em">
            <Icon name="plus" size={22} />
          </span>
          <b>New list</b>
          <small>with a weekly schedule</small>
        </button>
      </div>

      {scheduled && (
        <button className="sched-card card" onClick={() => nav('/lists')}>
          <span className="gi gi-violet">
            <Icon name="calendar" size={18} />
          </span>
          <span className="grow">
            <b>
              {scheduled.emoji} {scheduled.name}: every {scheduled.schedule!.days.map((d) => DAYS[d]).join(', ')},{' '}
              {hhmm12(scheduled.schedule!.time)} IST
            </b>
            <small>
              Next: {istWhen(scheduled.nextRunAt!)} ·{' '}
              {scheduled.schedule!.autoFill
                ? 'fills the cart, then asks you to pay'
                : 'compares and asks you to review'}
            </small>
          </span>
          <Icon name="chev" size={16} />
        </button>
      )}

      <div className="sec-head">
        <h3>How it works</h3>
        <SampleTag text="MOCK STORES" />
      </div>
      <div className="steps card">
        {STEPS.map((s, i) => (
          <div key={s.t} className="step">
            <span className={`gi ${s.c}`}>
              <Icon name={s.i} size={15} />
            </span>
            <span>
              <b>
                {i + 1}. {s.t}
              </b>
              <small>{s.s}</small>
            </span>
          </div>
        ))}
        <p className="fine">
          Payments always happen in the store app and need your OTP / UPI PIN. Akaya never auto-pays.
        </p>
      </div>
    </Screen>
  );
}
