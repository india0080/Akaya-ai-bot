import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Order } from '../api/types';
import { SampleTag, StoreMark } from '../components/bits';
import { inr, istTime, istWhen } from '../lib/format';
import { Icon, type IconName } from '../ui/Icon';
import { Screen } from '../ui/Screen';
import { ScreenHeader } from '../ui/ScreenHeader';

const ICON: Record<string, IconName> = { placed: 'check', packed: 'box', out_for_delivery: 'truck', arriving: 'location', delivered: 'home' };

export function OrderScreen() {
  const { id = '' } = useParams();
  const [o, setO] = useState<Order | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => api.order(id).then(setO, (e: Error) => setErr(e.message)), [id]);
  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 2500);
    return () => window.clearInterval(t);
  }, [load]);

  if (!o)
    return (
      <Screen className="order">
        <ScreenHeader title="Track order" />
        {err ? <p className="empty">{err}</p> : <div className="loading-bar" />}
      </Screen>
    );
  const delivered = o.stage === 'delivered';
  return (
    <Screen className="order">
      <ScreenHeader title="Track order" sub={`${o.storeName} · placed ${istWhen(o.placedAt)}`} right={o.simulated ? <SampleTag text="SIMULATED" /> : undefined} />
      <section className={`track-hero${delivered ? ' done' : ''}`}>
        <div className="route">
          <span className="rt-store">
            <StoreMark store={o.store} size={36} />
          </span>
          <span className="rt-line">
            <i style={{ width: `${o.progress * 100}%` }} />
            <span className="rt-rider" style={{ left: `${o.progress * 100}%` }}>
              🛵
            </span>
          </span>
          <span className="rt-home">
            <Icon name="home" size={18} />
          </span>
        </div>
        <b>{o.stageLabel}</b>
        <small>{delivered ? 'Enjoy! Rate your order in the store app.' : o.minutesLeft > 0 ? `Arriving in about ${o.minutesLeft} min` : 'Arriving any moment'}</small>
      </section>

      <div className="timeline card">
        {o.stages.map((s, i) => {
          const current = s.key === o.stage;
          return (
            <div key={s.key} className={`tl-row${s.done ? ' done' : ''}${current ? ' cur' : ''}`}>
              <span className="tl-dot">
                <Icon name={ICON[s.key] ?? 'check'} size={13} />
              </span>
              {i < o.stages.length - 1 && <span className="tl-bar" />}
              <span className="grow">
                <b>{s.label}</b>
                <small>{s.key === 'out_for_delivery' && s.done ? 'Delivery partner is on the way' : s.done ? 'Done' : 'Expected'}</small>
              </span>
              <small className="tl-t">{istTime(s.eta)} IST</small>
            </div>
          );
        })}
      </div>

      <div className="sec-head">
        <h3>Items</h3>
        <small className="muted">{inr(o.total)} paid by you</small>
      </div>
      <div className="list card">
        {o.items.map((it) => (
          <div key={it.name} className="list-row">
            <span className="item-em">{it.emoji}</span>
            <span className="grow">
              <b>{it.name}</b>
              <small>
                {it.packs} × {it.sizeLabel}
              </small>
            </span>
          </div>
        ))}
      </div>
      <p className="fine center">Tracking is simulated for the Mock provider. Live tracking needs a store partnership or order webhook.</p>
    </Screen>
  );
}
