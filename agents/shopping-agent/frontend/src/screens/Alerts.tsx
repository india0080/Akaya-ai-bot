import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { ago } from '../lib/format';
import { useStore } from '../state';
import { Icon, Screen, useToast } from '@akaya/ui';

export function Alerts() {
  const { notifications, refreshNotifications } = useStore();
  const nav = useNavigate();
  const toast = useToast();
  const [now] = useState(() => Date.now());
  const [push, setPush] = useState('');
  const unread = notifications.filter((n) => !n.read).length;

  const enablePush = async () => {
    // Web Push needs a service worker + VAPID key; here we register a stub token so the backend
    // records the subscription. See docs/PROVIDERS.md → Notifications.
    let perm = 'unsupported';
    if ('Notification' in window) perm = await Notification.requestPermission().catch(() => 'denied');
    const r = await api.subscribePush(`stub-webpush-${navigator.userAgent.length}-${perm}`);
    setPush(r.delivery);
    toast('Push subscription saved (stub)', 'bell');
  };

  return (
    <Screen nav className="alerts">
      <header className="tab-head">
        <div>
          <h1>Alerts</h1>
          <small className="muted">{unread ? `${unread} unread` : 'All caught up'}</small>
        </div>
        <button
          className="btn btn-sm btn-outline"
          disabled={!unread}
          onClick={() => api.markRead().then(refreshNotifications)}
        >
          <Icon name="check" size={14} /> Mark read
        </button>
      </header>
      <section className="push card">
        <span className="gi gi-violet">
          <Icon name="bell" size={18} />
        </span>
        <div className="grow">
          <b>Phone notifications</b>
          <small>
            {push ? `Delivery: ${push}` : 'In-app alerts are live. Push (Web Push / FCM) is a stub until keys are set.'}
          </small>
        </div>
        <button className="btn btn-sm btn-ghost" onClick={enablePush}>
          {push ? 'Saved' : 'Enable'}
        </button>
      </section>
      <div className="list card nlist">
        {notifications.map((n) => (
          <button
            key={n.id}
            className={`list-row notif${n.read ? '' : ' unread'}`}
            onClick={() => {
              api.markRead(n.id).then(refreshNotifications);
              if (n.link?.startsWith('#')) nav(n.link.slice(1));
            }}
          >
            <span className={`gi ${n.kind === 'price_drop' ? 'gi-green' : 'gi-blue'} n-ic`}>
              <Icon name={n.kind === 'price_drop' ? 'tag' : 'bell'} size={16} />
            </span>
            <span className="grow">
              <b>{n.title}</b>
              <span className="n-body">{n.body}</span>
              <small>
                {ago(n.createdAt, now)} · {n.channels.map((c) => `${c.channel}: ${c.status}`).join(' · ')}
              </small>
            </span>
          </button>
        ))}
        {notifications.length === 0 && (
          <div className="empty">No alerts yet. Watch a product and Akaya will tell you when the price drops.</div>
        )}
      </div>
      <button className="btn btn-ghost btn-block test-btn" onClick={() => api.testNotification()}>
        <Icon name="send" size={15} /> Send a test alert
      </button>
    </Screen>
  );
}
