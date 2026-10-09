import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Checkout, Order } from '../api/types';
import { StoreMark } from '../components/bits';
import { ago, inr } from '../lib/format';
import { useStore } from '../state';
import { Icon, type IconName } from '../ui/Icon';
import { Screen } from '../ui/Screen';

const NICON: Record<string, IconName> = { ready_to_pay: 'wallet', order: 'truck', list_ready: 'basket' };

export function Orders() {
  const nav = useNavigate();
  const { notifications, refreshNotifications } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pending, setPending] = useState<Checkout[]>([]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const load = () => {
      api.orders().then(setOrders, () => {});
      api.checkouts().then((c) => setPending(c.filter((x) => x.status === 'ready_to_pay' || x.status === 'filling')), () => {});
      setNow(Date.now());
    };
    load();
    const t = window.setInterval(load, 4000);
    return () => window.clearInterval(t);
  }, []);
  const active = orders.filter((o) => o.stage !== 'delivered');
  const past = orders.filter((o) => o.stage === 'delivered');
  const open = (link?: string) => link?.startsWith('#') && nav(link.slice(1));

  return (
    <Screen nav className="orders">
      <header className="tab-head">
        <h1>Orders</h1>
        {notifications.some((n) => !n.read) && (
          <button className="pill-link" onClick={() => api.markRead().then(refreshNotifications)}>
            Mark all read
          </button>
        )}
      </header>

      {pending.length > 0 && (
        <>
          <div className="sec-head">
            <h3>Waiting for you</h3>
          </div>
          {pending.map((c) => (
            <button key={c.id} className="pay-card card" onClick={() => nav(`/checkout/${c.id}`)}>
              <span className="gi gi-orange">
                <Icon name={c.status === 'filling' ? 'cart' : 'wallet'} size={18} />
              </span>
              <span className="grow">
                <b>{c.status === 'filling' ? 'Filling cart…' : `Confirm & pay ${inr(c.carts.filter((x) => x.status !== 'cancelled').reduce((a, x) => a + (x.verifiedTotal ?? x.total), 0))}`}</b>
                <small>
                  {c.carts.map((x) => x.storeName).join(' + ')} · {ago(c.createdAt, now)}
                </small>
              </span>
              <Icon name="chev" size={16} />
            </button>
          ))}
        </>
      )}

      <div className="sec-head">
        <h3>Active</h3>
      </div>
      {active.length ? (
        active.map((o) => <OrderRow key={o.id} o={o} onClick={() => nav(`/orders/${o.id}`)} />)
      ) : (
        <p className="empty-line">No active orders. Fill a cart, then pay in the store app.</p>
      )}
      {past.length > 0 && (
        <>
          <div className="sec-head">
            <h3>Delivered</h3>
          </div>
          {past.slice(0, 5).map((o) => (
            <OrderRow key={o.id} o={o} onClick={() => nav(`/orders/${o.id}`)} />
          ))}
        </>
      )}

      <div className="sec-head">
        <h3>Notifications</h3>
        <small className="muted">in-app · live</small>
      </div>
      <div className="list card notif-list">
        {notifications.length === 0 && <p className="empty-line">Cart-ready, delivery and weekly-list alerts show up here.</p>}
        {notifications.slice(0, 8).map((n) => (
          <button key={n.id} className={`list-row notif${n.read ? '' : ' unread'}`} onClick={() => (api.markRead(n.id).then(refreshNotifications), open(n.link))}>
            <span className={`gi ${n.kind === 'ready_to_pay' ? 'gi-orange' : n.kind === 'order' ? 'gi-cyan' : 'gi-violet'}`}>
              <Icon name={NICON[n.kind] ?? 'bell'} size={16} />
            </span>
            <span className="grow">
              <b>{n.title}</b>
              <small>{n.body}</small>
            </span>
            <small className="n-t">{ago(n.createdAt, now)}</small>
          </button>
        ))}
      </div>
    </Screen>
  );
}

function OrderRow({ o, onClick }: { o: Order; onClick: () => void }) {
  return (
    <button className="track-card card" onClick={onClick}>
      <StoreMark store={o.store} size={38} />
      <span className="grow">
        <b>
          {o.storeName} · {inr(o.total)}
        </b>
        <small>
          {o.stageLabel}
          {o.stage !== 'delivered' && ` · ${o.minutesLeft > 0 ? `about ${o.minutesLeft} min` : 'any moment'}`} · {o.items.length} items
        </small>
        <span className="mini-progress">
          <i style={{ width: `${Math.max(6, o.progress * 100)}%` }} />
        </span>
      </span>
      <Icon name="chev" size={16} />
    </button>
  );
}
