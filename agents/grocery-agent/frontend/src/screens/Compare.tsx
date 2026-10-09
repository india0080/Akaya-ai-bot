import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Job, Plan, Quote, QuoteProgress, StoreId, StoreQuote } from '../api/types';
import { SampleTag, StoreMark } from '../components/bits';
import { StoreSheet } from '../components/StoreSheet';
import { inr, STORE_IDS, STORES, STRATEGY } from '../lib/format';
import { Icon } from '../ui/Icon';
import { Pearl } from '../ui/Pearl';
import { Screen } from '../ui/Screen';
import { ScreenHeader } from '../ui/ScreenHeader';

export function Compare() {
  const { id = '' } = useParams();
  const [sp] = useSearchParams();
  const job = sp.get('job');
  return job ? <Progress key={job} jobId={job} /> : <QuoteView key={id} id={id} />;
}

/** Live per-store progress while the quote job runs (SSE). */
function Progress({ jobId }: { jobId: string }) {
  const nav = useNavigate();
  const [rows, setRows] = useState<Partial<Record<StoreId, QuoteProgress>>>({});
  const [error, setError] = useState('');
  useEffect(() => {
    const es = api.jobEvents(jobId);
    es.addEventListener('progress', (e) => {
      const p = JSON.parse((e as MessageEvent).data) as QuoteProgress;
      setRows((r) => ({ ...r, [p.store]: p }));
    });
    es.addEventListener('done', (e) => {
      const j = JSON.parse((e as MessageEvent).data) as Job<Quote>;
      es.close();
      if (j.status === 'done' && j.result) window.setTimeout(() => nav(`/compare/${j.result!.id}`, { replace: true }), 450);
      else setError(j.error ?? 'Comparison failed');
    });
    es.onerror = () => setError('Lost connection to the backend');
    return () => es.close();
  }, [jobId, nav]);
  const done = Object.values(rows).filter((r) => r?.status === 'done').length;
  return (
    <Screen className="compare">
      <ScreenHeader title="Comparing stores" sub="Prices, fees and delivery time" />
      <div className="searching">
        <Pearl width={170} height={150} r={50} mood="thinking" glow={1} />
        <h3>
          Checking {STORE_IDS.length} stores… {done}/{STORE_IDS.length}
        </h3>
        <div className="store-progress card">
          {STORE_IDS.map((s) => {
            const r = rows[s];
            return (
              <div key={s} className="sp-row">
                <StoreMark store={s} size={28} />
                <b>{STORES[s].name}</b>
                {r?.status === 'done' ? (
                  <span className="sp-st done">
                    <Icon name="check" size={14} /> {r.found} items · {r.etaLabel}
                  </span>
                ) : r?.status === 'error' ? (
                  <span className="sp-st err">Unavailable</span>
                ) : (
                  <span className="sp-st">
                    <span className="spin" /> {r ? 'checking' : 'queued'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {error && <p className="voice-err">{error}</p>}
        <p className="fine center">Mock provider: sample catalogue and fees. Real stores need your own logged-in session or a partner API.</p>
      </div>
    </Screen>
  );
}

function QuoteView({ id }: { id: string }) {
  const nav = useNavigate();
  const [q, setQ] = useState<Quote | null>(null);
  const [err, setErr] = useState('');
  const [planId, setPlanId] = useState<string | null>(null);
  const [store, setStore] = useState<StoreQuote | null>(null);
  useEffect(() => {
    api.getQuote(id).then(setQ, (e: Error) => setErr(e.message));
  }, [id]);
  const plan: Plan | undefined = useMemo(() => (q ? (q.plans.find((p) => p.id === (planId ?? q.recommended)) ?? q.plans[0]) : undefined), [q, planId]);

  if (err)
    return (
      <Screen className="compare">
        <ScreenHeader title="Compare stores" />
        <div className="empty">
          <Icon name="alert" size={26} />
          <p>{err}. Quotes are kept in memory for a while; compare again from your list.</p>
          <button className="btn btn-brand" onClick={() => nav('/home')}>
            Back to home
          </button>
        </div>
      </Screen>
    );
  if (!q || !plan)
    return (
      <Screen className="compare">
        <ScreenHeader title="Compare stores" />
        <div className="loading-bar" />
      </Screen>
    );

  const cheapest = Math.min(...q.quotes.filter((x) => !x.missing.length).map((x) => x.total));
  const fastest = Math.min(...q.quotes.filter((x) => !x.missing.length).map((x) => x.etaMin));
  const nameOf = (itemId: string) => q.items.find((i) => i.id === itemId)?.name ?? itemId;
  const tips = plan.id === q.recommended ? q.budgetTips : [];

  return (
    <Screen className="compare">
      <ScreenHeader title="Best basket" sub={`${q.items.length} items · ${q.address} ${q.pincode}`} right={q.sample ? <SampleTag text="SAMPLE" /> : undefined} />

      <div className="plan-tabs">
        {q.plans.map((p) => (
          <button key={p.id} className={`plan-tab${p.id === plan.id ? ' on' : ''}`} onClick={() => setPlanId(p.id)}>
            <small>{STRATEGY[p.strategy].label}</small>
            <b>{inr(p.total)}</b>
            <span>{p.etaLabel}</span>
          </button>
        ))}
      </div>

      <section className="plan-hero card">
        <div className="ph-top">
          <span className="ph-label">
            {plan.id === q.recommended && <Icon name="crown" size={13} />} {plan.label}
          </span>
          <span className="ph-stores">
            {plan.parts.map((p) => (
              <StoreMark key={p.store} store={p.store} size={26} />
            ))}
          </span>
        </div>
        <div className="ph-total">
          <b>{inr(plan.total)}</b>
          {plan.savingsVsMax > 0 && <em>save {inr(plan.savingsVsMax)} vs priciest</em>}
        </div>
        <div className="ph-meta">
          <span>
            <Icon name="truck" size={14} /> {plan.etaLabel}
          </span>
          <span>
            <Icon name="tag" size={14} /> fees {inr(plan.fees)}
          </span>
          <span>
            <Icon name="store" size={14} /> {plan.parts.map((p) => STORES[p.store].short).join(' + ')}
          </span>
        </div>
        <p className="ph-why">{plan.why}</p>
        {plan.substitutions > 0 && (
          <p className="ph-flag">
            <Icon name="swap" size={13} /> {plan.substitutions} substitution{plan.substitutions > 1 ? 's' : ''}: review in the basket
          </p>
        )}
        {plan.missing.length > 0 && (
          <p className="ph-flag warn">
            <Icon name="alert" size={13} /> Not available: {plan.missing.map(nameOf).join(', ')}
          </p>
        )}
        {q.budget ? (
          <div className={`budget-bar${plan.overBudget ? ' over' : ''}`}>
            <span className="bb-track">
              <i style={{ width: `${Math.min(100, (plan.total / q.budget) * 100)}%` }} />
            </span>
            <small>
              {plan.overBudget ? `${inr(plan.total - q.budget)} over your ${inr(q.budget)} budget` : `${inr(q.budget - plan.total)} under your ${inr(q.budget)} budget`}
            </small>
          </div>
        ) : null}
      </section>

      {plan.overBudget && tips.length > 0 && (
        <>
          <div className="sec-head">
            <h3>Get under budget</h3>
          </div>
          <div className="list card">
            {tips.map((t) => (
              <div key={t.itemId + t.skuId} className="list-row">
                <span className="ri">
                  <Icon name="swap" size={16} />
                </span>
                <span className="grow">
                  <b>{t.to}</b>
                  <small>instead of {t.from}</small>
                </span>
                <em className="save">−{inr(t.save)}</em>
              </div>
            ))}
          </div>
        </>
      )}
      {q.splitNote && plan.strategy !== 'split' && <p className="fine pad-x">{q.splitNote}</p>}

      <div className="sec-head">
        <h3>All stores</h3>
        <small className="muted">fees included</small>
      </div>
      <div className="store-cards">
        {q.quotes.map((s) => (
          <button key={s.store} className="store-card card" onClick={() => setStore(s)}>
            <StoreMark store={s.store} size={38} />
            <span className="grow">
              <b>{s.storeName}</b>
              <span className="sc-meta">
                <span>
                  <Icon name="clock" size={12} /> {s.etaLabel}
                </span>
                {s.missing.length > 0 && <i className="t-warn">{s.missing.length} missing</i>}
                {s.lines.some((l) => l.substitution) && <i className="t-sub">{s.lines.filter((l) => l.substitution).length} swap</i>}
              </span>
            </span>
            <span className="sc-price">
              <b>{inr(s.total)}</b>
              {!s.missing.length && s.total === cheapest && <i className="badge b-price">Cheapest</i>}
              {!s.missing.length && s.etaMin === fastest && s.total !== cheapest && <i className="badge b-fast">Fastest</i>}
            </span>
          </button>
        ))}
      </div>

      <div className="cta-bar">
        <button className="btn btn-brand btn-block" onClick={() => nav(`/basket/${q.id}/${plan.id}`)}>
          <Icon name="cart" size={18} /> Review basket · {inr(plan.total)}
        </button>
      </div>
      <StoreSheet quote={store} items={q.items} onClose={() => setStore(null)} />
    </Screen>
  );
}
