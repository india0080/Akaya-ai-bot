import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Cart, Checkout, FillProgress, Handoff } from '../api/types';
import { PayNotice, SampleTag, StoreMark } from '../components/bits';
import { HandoffSheet } from '../components/HandoffSheet';
import { inr, STORES } from '../lib/format';
import { Icon, Pearl, Screen, ScreenHeader, useToast } from '@akaya/ui';

const LIVE = ['ready', 'partial', 'handed_off'];

export function CheckoutScreen() {
  const { id = '' } = useParams();
  return <CheckoutBody key={id} id={id} />;
}

function CheckoutBody({ id }: { id: string }) {
  const nav = useNavigate();
  const toast = useToast();
  const [c, setC] = useState<Checkout | null>(null);
  const [err, setErr] = useState('');
  const [steps, setSteps] = useState<FillProgress[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [handoff, setHandoff] = useState<Handoff | null>(null);
  const [busy, setBusy] = useState('');

  const load = useCallback(() => api.checkout(id).then(setC, (e: Error) => setErr(e.message)), [id]);
  useEffect(() => {
    void load();
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [load]);
  const jobId = c?.jobId;
  const filling = c?.status === 'filling';
  useEffect(() => {
    if (!jobId || !filling) return;
    const es = api.jobEvents(jobId);
    es.addEventListener('progress', (e) =>
      setSteps((s) => [...s, JSON.parse((e as MessageEvent).data) as FillProgress]),
    );
    es.addEventListener('done', () => {
      es.close();
      window.setTimeout(() => void load(), 300);
    });
    return () => es.close();
  }, [jobId, filling, load]);

  if (err)
    return (
      <Screen className="checkout">
        <ScreenHeader title="Checkout" />
        <div className="empty">
          <Icon name="alert" size={26} />
          <p>{err}</p>
        </div>
      </Screen>
    );
  if (!c)
    return (
      <Screen className="checkout">
        <ScreenHeader title="Checkout" />
        <div className="loading-bar" />
      </Screen>
    );

  const confirm = async (cart: Cart) => {
    setBusy(cart.store);
    try {
      setHandoff(await api.handoff(c.id, cart.store));
      void load();
    } catch (e) {
      toast((e as Error).message, 'alert');
    } finally {
      setBusy('');
    }
  };
  const paid = async () => {
    if (!handoff) return;
    try {
      const o = await api.paid(c.id, handoff.store);
      setHandoff(null);
      nav(`/orders/${o.id}`);
    } catch (e) {
      toast((e as Error).message, 'alert');
    }
  };
  const cancel = async (store?: Cart['store']) => {
    setC(await api.cancel(c.id, store));
    toast(store ? `${STORES[store].short} cart cancelled` : 'Checkout cancelled', 'close');
  };

  if (c.status === 'filling') {
    const last = steps.filter((s) => s.step === 'added' || s.step === 'adding').at(-1);
    const pct = last?.n ? ((last.step === 'added' ? last.i! : last.i! - 0.5) / last.n) * 100 : 4;
    const current = steps.at(-1)?.store ?? c.carts[0].store;
    return (
      <Screen className="checkout">
        <ScreenHeader
          title="Filling your cart"
          sub={c.planLabel}
          right={c.sample ? <SampleTag text="SIMULATED" /> : undefined}
        />
        <div className="filling">
          <Pearl width={170} height={150} r={50} mood="thinking" glow={1} />
          <h3>
            Adding items in {STORES[current].name}
            {c.carts.length > 1 ? ` (${c.carts.findIndex((x) => x.store === current) + 1}/${c.carts.length})` : ''}…
          </h3>
          <span className="fill-bar">
            <i style={{ width: `${pct}%` }} />
          </span>
          <div className="fill-log card">
            {steps
              .filter((s) => s.step !== 'adding' || s === steps.at(-1))
              .slice(-7)
              .map((s, i) => (
                <div key={i} className={`fl-row ${s.step}`}>
                  {s.step === 'added' ? (
                    <Icon name="check" size={14} />
                  ) : s.step === 'failed' ? (
                    <Icon name="close" size={14} />
                  ) : (
                    <span className="spin" />
                  )}
                  <span>{s.name ?? s.message ?? s.step}</span>
                </div>
              ))}
          </div>
          <p className="fine center">Akaya adds items only. It stops before payment and asks you to confirm.</p>
        </div>
      </Screen>
    );
  }

  const live = c.carts.filter((x) => LIVE.includes(x.status));
  const due = live.reduce((a, x) => a + (x.verifiedTotal ?? x.total), 0);
  const exp = live.map((x) => x.expiresAt ?? 0).filter(Boolean);
  const left = exp.length ? Math.max(0, Math.min(...exp) - now) : 0;
  const mmss = `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, '0')}`;

  return (
    <Screen className="checkout">
      <ScreenHeader
        title={live.length ? 'Ready to pay' : c.status === 'completed' ? 'Paid by you' : 'Checkout'}
        sub={c.planLabel}
        right={c.sample ? <SampleTag text="SAMPLE" /> : undefined}
      />
      {live.length > 0 && (
        <section className="ready-hero">
          <span className="rh-ic">
            <Icon name="lock" size={22} />
          </span>
          <small>Your cart{live.length > 1 ? 's are' : ' is'} filled. Confirm to pay</small>
          <b>{inr(due)}</b>
          <span className="rh-meta">
            <Icon name="clock" size={13} /> Cart held for {mmss} · prices re-checked
          </span>
        </section>
      )}
      {c.carts.map((cart) => (
        <section key={cart.store} className={`pay-cart card st-${cart.status}`}>
          <header className="cp-head">
            <StoreMark store={cart.store} size={36} />
            <span className="grow">
              <b>{cart.storeName}</b>
              <small>
                {cart.lines.length} items · {cart.etaLabel}
              </small>
            </span>
            <span className="pc-amt">
              <b>{inr(cart.verifiedTotal ?? cart.total)}</b>
              <i className={`cstat ${cart.status}`}>{STATUS[cart.status]}</i>
            </span>
          </header>
          {cart.failed.length > 0 && (
            <p className="ph-flag warn">
              <Icon name="alert" size={13} /> {cart.failed.length} item(s) could not be added; total excludes them.
            </p>
          )}
          <div className="pc-items">
            {cart.lines.slice(0, 8).map((l) => (
              <span key={l.sku.id} title={l.sku.name}>
                {l.sku.emoji}
              </span>
            ))}
            {cart.lines.length > 8 && <small>+{cart.lines.length - 8}</small>}
          </div>
          {(cart.status === 'ready' || cart.status === 'partial') && (
            <div className="row-btns">
              <button className="btn btn-ghost btn-sm" onClick={() => void cancel(cart.store)}>
                Cancel
              </button>
              <button className="btn btn-brand grow" disabled={busy === cart.store} onClick={() => void confirm(cart)}>
                {busy === cart.store ? <span className="spin" /> : <Icon name="check" size={16} />} Confirm & pay in{' '}
                {STORES[cart.store].short}
              </button>
            </div>
          )}
          {cart.status === 'handed_off' && (
            <div className="row-btns">
              <button className="btn btn-ghost btn-sm" onClick={() => void confirm(cart)}>
                Open {STORES[cart.store].short} again
              </button>
              <button className="btn btn-brand grow" onClick={() => void confirm(cart)}>
                <Icon name="check" size={16} /> I've paid
              </button>
            </div>
          )}
          {cart.status === 'paid_by_user' && cart.orderId && (
            <button className="btn btn-ghost btn-block" onClick={() => nav(`/orders/${cart.orderId}`)}>
              <Icon name="truck" size={16} /> Track order
            </button>
          )}
          {cart.status === 'expired' && (
            <p className="ph-flag warn">The cart hold expired. Compare again to refresh prices.</p>
          )}
        </section>
      ))}
      <PayNotice store={c.carts.length === 1 ? c.carts[0].storeName : undefined} />
      <p className="fine pad-x">
        RBI rules require your own authentication (OTP / UPI PIN) for online payments, so payment always happens with
        you in the store app.
      </p>
      {live.length > 0 && (
        <button className="btn btn-ghost btn-block cancel-all" onClick={() => void cancel()}>
          Cancel checkout
        </button>
      )}
      <HandoffSheet handoff={handoff} onClose={() => setHandoff(null)} onPaid={() => void paid()} />
    </Screen>
  );
}

const STATUS: Record<Cart['status'], string> = {
  queued: 'Queued',
  filling: 'Filling',
  ready: 'Ready to pay',
  partial: 'Ready (partial)',
  handed_off: 'Paying in app',
  paid_by_user: 'Paid by you',
  cancelled: 'Cancelled',
  expired: 'Expired',
  failed: 'Failed',
};
