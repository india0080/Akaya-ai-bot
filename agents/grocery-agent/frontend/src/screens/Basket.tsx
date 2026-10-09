import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type Override } from '../api/client';
import type { Alt, Line, ParsedItem, Quote } from '../api/types';
import { PayNotice, SampleTag, StoreMark } from '../components/bits';
import { FeeTable } from '../components/FeeTable';
import { SubSheet } from '../components/SubSheet';
import { inr, STORES } from '../lib/format';
import { Icon } from '../ui/Icon';
import { Screen } from '../ui/Screen';
import { ScreenHeader } from '../ui/ScreenHeader';
import { useToast } from '../ui/Toast';

interface Group {
  itemId: string;
  item?: ParsedItem;
  lines: Line[];
  price: number;
}
const feeSum = (f: { delivery: number; handling: number; smallCart: number; platform: number }) => f.delivery + f.handling + f.smallCart + f.platform;

export function Basket() {
  const { quoteId = '', planId = '' } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const [q, setQ] = useState<Quote | null>(null);
  const [err, setErr] = useState('');
  const [over, setOver] = useState<Record<string, Alt>>({});
  const [removed, setRemoved] = useState<string[]>([]);
  const [edit, setEdit] = useState<Group | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.getQuote(quoteId).then(setQ, (e: Error) => setErr(e.message));
  }, [quoteId]);
  const plan = q?.plans.find((p) => p.id === planId);

  if (err || (q && !plan))
    return (
      <Screen className="basket">
        <ScreenHeader title="Review basket" />
        <div className="empty">
          <Icon name="alert" size={26} />
          <p>{err || 'Plan not found'}. Compare again from your list.</p>
          <button className="btn btn-brand" onClick={() => nav('/home')}>
            Back to home
          </button>
        </div>
      </Screen>
    );
  if (!q || !plan)
    return (
      <Screen className="basket">
        <ScreenHeader title="Review basket" />
        <div className="loading-bar" />
      </Screen>
    );

  const parts = plan.parts.map((p) => {
    const groups: Group[] = [];
    for (const l of p.lines) {
      const g = groups.find((x) => x.itemId === l.itemId);
      if (g) {
        g.lines.push(l);
        g.price += l.price;
      } else groups.push({ itemId: l.itemId, item: q.items.find((i) => i.id === l.itemId), lines: [l], price: l.price });
    }
    const live = groups.filter((g) => !removed.includes(g.itemId));
    const subtotal = live.reduce((a, g) => a + (over[g.itemId]?.price ?? g.price), 0);
    return { ...p, groups, subtotal, total: subtotal + feeSum(p.fees) };
  });
  const total = parts.reduce((a, p) => a + (p.subtotal ? p.total : 0), 0);
  const changed = Object.keys(over).length + removed.length > 0;

  const fill = async () => {
    setBusy(true);
    const overrides: Override[] = Object.entries(over).map(([itemId, a]) => ({ itemId, store: a.sku.store, skuId: a.sku.id, packs: a.packs }));
    try {
      const c = await api.createCheckout({ quoteId: q.id, planId: plan.id, overrides, removed });
      nav(`/checkout/${c.id}`);
    } catch (e) {
      toast((e as Error).message, 'alert');
      setBusy(false);
    }
  };

  return (
    <Screen className="basket">
      <ScreenHeader title="Review basket" sub={`${plan.label} · ${plan.etaLabel}`} right={q.sample ? <SampleTag text="SAMPLE" /> : undefined} />
      {parts.map((p) => (
        <section key={p.store} className="cart-part card">
          <header className="cp-head">
            <StoreMark store={p.store} size={34} />
            <span className="grow">
              <b>{p.storeName}</b>
              <small>
                {STORES[p.store].mode === 'quick' ? 'Quick delivery' : 'Slot delivery'} · {p.etaLabel}
              </small>
            </span>
            <b>{inr(p.total)}</b>
          </header>
          {p.groups.map((g) => {
            const gone = removed.includes(g.itemId);
            const alt = over[g.itemId];
            const sub = alt ? { reason: 'Chosen by you', wanted: g.item?.name ?? '' } : g.lines[0].substitution;
            return (
              <div key={g.itemId} className={`bline${gone ? ' gone' : ''}`}>
                <span className="item-em">{(alt?.sku ?? g.lines[0].sku).emoji}</span>
                <span className="grow">
                  <b>{alt ? alt.sku.name : g.lines[0].sku.name}</b>
                  <small>
                    {alt ? `${alt.packs} × ${alt.sku.sizeLabel}` : g.lines.map((l) => `${l.packs} × ${l.sku.sizeLabel}`).join(' + ')}
                    {g.item && <> · for {g.item.display}</>}
                  </small>
                  {sub && !gone && (
                    <span className={`sub-note${alt ? ' mine' : ''}`}>
                      <Icon name="swap" size={11} /> {sub.reason}
                    </span>
                  )}
                </span>
                <span className="bl-r">
                  <b>{inr(alt?.price ?? g.price)}</b>
                  <span className="bl-act">
                    {!gone && g.lines[0].alternatives.length > 0 && (
                      <button onClick={() => setEdit(g)} aria-label={`Change ${g.item?.name}`}>
                        Change
                      </button>
                    )}
                    <button
                      onClick={() => setRemoved((r) => (gone ? r.filter((x) => x !== g.itemId) : [...r, g.itemId]))}
                      aria-label={gone ? `Put back ${g.item?.name}` : `Remove ${g.item?.name}`}
                    >
                      {gone ? 'Undo' : <Icon name="trash" size={14} />}
                    </button>
                  </span>
                </span>
              </div>
            );
          })}
          <FeeTable subtotal={p.subtotal} fees={p.fees} total={p.subtotal ? p.total : 0} />
        </section>
      ))}
      {changed && <p className="fine pad-x">Fees are estimated from the quote and re-checked when the cart is filled.</p>}
      <PayNotice store={plan.parts.length === 1 ? plan.parts[0].storeName : undefined} />
      <div className="cta-bar">
        <button className="btn btn-brand btn-block" disabled={busy || total === 0} onClick={() => void fill()}>
          {busy ? <span className="spin" /> : <Icon name="cart" size={18} />} Fill {plan.parts.length > 1 ? `${plan.parts.length} carts` : 'cart'} · {inr(total)}
        </button>
      </div>
      <SubSheet
        group={edit}
        current={edit ? over[edit.itemId] : undefined}
        onClose={() => setEdit(null)}
        onPick={(a) => {
          if (!edit) return;
          setOver((o) => {
            const n = { ...o };
            if (a) n[edit.itemId] = a;
            else delete n[edit.itemId];
            return n;
          });
          setEdit(null);
        }}
      />
    </Screen>
  );
}
