import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { ParsedItem } from '../api/types';
import { ListSheet } from '../components/ListSheet';
import { DOZEN, formatQty, inr, stepFor } from '../lib/format';
import { useStore, type Draft } from '../state';
import { Icon, Screen, ScreenHeader, useToast } from '@akaya/ui';

const LANG = { en: 'English', hi: 'हिन्दी', hinglish: 'Hinglish' } as const;

export function Items() {
  const { draft } = useStore();
  if (!draft) return <Navigate to="/home" replace />;
  return <ItemsBody draft={draft} />;
}

function ItemsBody({ draft }: { draft: Draft }) {
  const { setDraft } = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const [add, setAdd] = useState('');
  const [busy, setBusy] = useState(false);
  const [save, setSave] = useState(false);
  const [budgetOn, setBudgetOn] = useState(!!draft.budget);
  const items = draft.items;

  const update = (id: string, fn: (i: ParsedItem) => ParsedItem | null) =>
    setDraft(
      (d) => d && { ...d, items: d.items.map((i) => (i.id === id ? fn(i) : i)).filter((x): x is ParsedItem => !!x) },
    );
  const bump = (it: ParsedItem, dir: 1 | -1) =>
    update(it.id, (i) => {
      const step = stepFor(i.key, dir < 0 ? i.qty - 1 : i.qty, i.unit);
      const qty = Math.max(step, i.qty + dir * step);
      return { ...i, qty, display: formatQty(qty, i.unit, DOZEN.has(i.key)) };
    });
  const addItems = async (e: FormEvent) => {
    e.preventDefault();
    if (!add.trim()) return;
    const r = await api.parse(add.trim()).catch(() => null);
    if (!r) return;
    if (!r.items.length) {
      toast(`Not in the catalogue yet: ${r.unknown.join(', ') || add}`, 'alert');
      return;
    }
    setDraft((d) => {
      if (!d) return d;
      let n = d.items.length;
      const next = [...d.items];
      for (const it of r.items) {
        const same = next.findIndex((x) => x.key === it.key && x.brand === it.brand && x.variant === it.variant);
        if (same >= 0)
          next[same] = {
            ...next[same],
            qty: next[same].qty + it.qty,
            display: formatQty(next[same].qty + it.qty, it.unit, DOZEN.has(it.key)),
          };
        else next.push({ ...it, id: `i${++n}-${Date.now() % 1000}` });
      }
      return { ...d, items: next, unknown: [...d.unknown, ...r.unknown] };
    });
    setAdd('');
  };
  const compare = async () => {
    setBusy(true);
    try {
      const job = await api.quote({ items, budget: budgetOn ? draft.budget : undefined });
      nav(`/compare/run?job=${job.id}`);
    } catch (e) {
      toast((e as Error).message, 'alert');
      setBusy(false);
    }
  };
  const asText = items
    .map(
      (i) =>
        `${i.display} ${i.brand ? `${i.brand} ` : ''}${i.variant ? `${i.variant.split('|')[0]} ` : ''}${i.name.replace(/\s*\(.*\)/, '').toLowerCase()}`,
    )
    .join(', ');

  return (
    <Screen className="items">
      <ScreenHeader
        title="Your list"
        sub={`${items.length} items · understood from ${LANG[draft.lang] ?? draft.lang}`}
        right={
          <button className="icon-btn card" onClick={() => setSave(true)} aria-label="Save as list">
            <Icon name="bookmark" size={19} />
          </button>
        }
      />
      <p className="said">
        <Icon name="text" size={14} /> “{draft.text}”
      </p>

      <div className="item-list card">
        {items.map((it) => (
          <div key={it.id} className="item-row">
            <span className="item-em">{it.emoji}</span>
            <span className="grow">
              <b>{it.name}</b>
              <span className="item-tags">
                {it.brand && <i className="t-brand">{it.brand}</i>}
                {it.variant && <i className="t-var">{it.variant.split('|')[0]}</i>}
                {it.confidence < 0.8 && <i className="t-guess">check</i>}
              </span>
            </span>
            <span className="stepper">
              <button onClick={() => bump(it, -1)} aria-label={`Less ${it.name}`}>
                <Icon name="minus" size={14} />
              </button>
              <b>{it.display}</b>
              <button onClick={() => bump(it, 1)} aria-label={`More ${it.name}`}>
                <Icon name="plus" size={14} />
              </button>
            </span>
            <button className="rm" onClick={() => update(it.id, () => null)} aria-label={`Remove ${it.name}`}>
              <Icon name="close" size={15} />
            </button>
          </div>
        ))}
        <form className="add-row" onSubmit={addItems}>
          <Icon name="plus" size={16} />
          <input
            value={add}
            onChange={(e) => setAdd(e.target.value)}
            placeholder="Add more: “1 kg aloo, dhaniya”"
            aria-label="Add items"
          />
          {add && <button className="btn btn-sm btn-ghost">Add</button>}
        </form>
      </div>

      {draft.unknown.length > 0 && (
        <div className="notice">
          <Icon name="alert" size={16} />
          <span>
            Not in the sample catalogue, so skipped: <b>{draft.unknown.join(', ')}</b>. Add them in the store app after
            the cart is filled.
          </span>
        </div>
      )}

      <div className="budget card">
        <span className="gi gi-green">
          <Icon name="wallet" size={16} />
        </span>
        <span className="grow">
          <b>Budget limit</b>
          <small>{budgetOn ? 'Plans over budget are flagged, with cheaper swaps' : 'No limit for this basket'}</small>
        </span>
        {budgetOn ? (
          <span className="budget-in">
            ₹
            <input
              inputMode="numeric"
              value={draft.budget ?? ''}
              onChange={(e) =>
                setDraft((d) => d && { ...d, budget: Number(e.target.value.replace(/\D/g, '')) || undefined })
              }
              aria-label="Budget in rupees"
            />
          </span>
        ) : (
          <button
            className="chip"
            onClick={() => (setBudgetOn(true), setDraft((d) => d && { ...d, budget: d.budget ?? 800 }))}
          >
            Set {inr(draft.budget ?? 800)}
          </button>
        )}
      </div>

      <div className="cta-bar">
        <button className="btn btn-brand btn-block" disabled={busy || !items.length} onClick={() => void compare()}>
          {busy ? <span className="spin" /> : <Icon name="compare" size={18} />} Compare 5 stores
        </button>
      </div>
      <ListSheet
        open={save}
        onClose={() => setSave(false)}
        initial={{ name: 'Weekly staples', emoji: '🧺', text: asText, budget: budgetOn ? draft.budget : undefined }}
        onSaved={() => toast('List saved', 'check')}
      />
    </Screen>
  );
}
