import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { ProviderStore, Settings, StoreId, Strategy } from '../api/types';
import { StoreMark } from '../components/bits';
import { STORE_IDS, STORES, STRATEGY } from '../lib/format';
import { useStore } from '../state';
import { type ThemePref, Segmented, Toggle, Icon, Screen, useToast } from '@akaya/ui';

export function SettingsScreen() {
  const { theme, set, online } = useStore();
  const toast = useToast();
  const [s, setS] = useState<Settings | null>(null);
  const [providers, setProviders] = useState<ProviderStore[]>([]);
  const [addr, setAddr] = useState({ address: '', pincode: '', budget: '' });
  useEffect(() => {
    api.settings().then(
      (x) => {
        setS(x);
        setAddr({ address: x.address, pincode: x.pincode, budget: x.budget ? String(x.budget) : '' });
      },
      () => {},
    );
    api.providers().then(
      (p) => setProviders(p.stores),
      () => {},
    );
  }, []);
  const save = async (patch: Parameters<typeof api.updateSettings>[0], msg?: string) => {
    try {
      setS(await api.updateSettings(patch));
      if (msg) toast(msg, 'check');
    } catch (e) {
      toast((e as Error).message, 'alert');
    }
  };
  const toggleStore = (id: StoreId, on: boolean) => {
    if (!s) return;
    const stores = on ? [...s.stores, id] : s.stores.filter((x) => x !== id);
    if (!stores.length) return toast('Keep at least one store', 'alert');
    void save({ stores });
  };

  return (
    <Screen nav className="more">
      <header className="tab-head">
        <h1>Settings</h1>
        <span className={`tag ${online ? 'ok' : 'bad'}`}>{online ? 'API online' : 'API offline'}</span>
      </header>

      <div className="sec-head">
        <h3>Appearance</h3>
      </div>
      <div className="card pad">
        <Segmented<ThemePref>
          value={theme}
          onChange={(v) => set({ theme: v })}
          options={[
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
            { value: 'system', label: 'System' },
          ]}
        />
      </div>

      <div className="sec-head">
        <h3>Delivery & budget</h3>
      </div>
      <div className="card pad form-grid">
        <label className="label">Address</label>
        <input className="input" value={addr.address} onChange={(e) => setAddr({ ...addr, address: e.target.value })} />
        <div className="two">
          <span>
            <label className="label">Pincode</label>
            <input
              className="input"
              inputMode="numeric"
              maxLength={6}
              value={addr.pincode}
              onChange={(e) => setAddr({ ...addr, pincode: e.target.value.replace(/\D/g, '') })}
            />
          </span>
          <span>
            <label className="label">Default budget</label>
            <div className="input rupee-in">
              ₹
              <input
                inputMode="numeric"
                value={addr.budget}
                placeholder="None"
                onChange={(e) => setAddr({ ...addr, budget: e.target.value.replace(/\D/g, '') })}
              />
            </div>
          </span>
        </div>
        <button
          className="btn btn-ghost btn-block"
          onClick={() =>
            void save(
              { address: addr.address.trim(), pincode: addr.pincode, budget: addr.budget ? Number(addr.budget) : null },
              'Saved',
            )
          }
        >
          <Icon name="check" size={16} /> Save
        </button>
        <label className="label">Default plan</label>
        {s && (
          <Segmented<Strategy>
            className="mini"
            value={s.strategy}
            onChange={(v) => void save({ strategy: v })}
            options={(['balanced', 'cheapest', 'fastest'] as Strategy[]).map((x) => ({
              value: x,
              label: STRATEGY[x].label,
            }))}
          />
        )}
      </div>

      <div className="sec-head">
        <h3>Stores</h3>
        <small className="muted">compare these</small>
      </div>
      <div className="list card">
        {STORE_IDS.map((id) => {
          const p = providers.find((x) => x.store === id);
          return (
            <div key={id} className="list-row">
              <StoreMark store={id} size={32} />
              <span className="grow">
                <b>{STORES[id].name}</b>
                <small>
                  {p ? (p.active.kind === 'mock' ? 'Mock provider · sample data' : p.active.label) : '…'}
                  {p?.active.kind === 'mock' && p.officialMcp ? ' · official MCP available' : ''}
                </small>
              </span>
              {s && (
                <Toggle
                  on={s.stores.includes(id)}
                  onChange={(v) => toggleStore(id, v)}
                  label={`Compare ${STORES[id].name}`}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="fine pad-x">
        No store offers a public price API. Instamart and Zepto have official MCP servers (sign in with your account);
        the others need your own store session or a partnership. See docs/PROVIDERS.md.
      </p>

      <div className="sec-head">
        <h3>Notifications</h3>
      </div>
      <div className="list card">
        <button
          className="list-row"
          onClick={() =>
            api.testNotification().then(
              () => {},
              () => toast('Backend offline', 'alert'),
            )
          }
        >
          <span className="ri">
            <Icon name="bell" size={17} />
          </span>
          <span className="grow">
            <b>Send a test notification</b>
            <small>In-app (live SSE) works now</small>
          </span>
        </button>
        <button
          className="list-row"
          onClick={() =>
            api.subscribePush(`demo-browser-${navigator.userAgent.length}-token`).then(
              (r) => toast(`Push: ${r.delivery}`, 'bell'),
              () => toast('Backend offline', 'alert'),
            )
          }
        >
          <span className="ri">
            <Icon name="phone" size={17} />
          </span>
          <span className="grow">
            <b>Phone push (Web Push / FCM)</b>
            <small>Stub until VAPID or FCM keys are added</small>
          </span>
        </button>
      </div>

      <div className="sec-head">
        <h3>Payments</h3>
      </div>
      <div className="card pad pay-rules">
        <p>
          <Icon name="lock" size={15} /> Akaya fills carts and tells you when they're ready. You always pay in the store
          app with UPI, card or wallet, approving the OTP / UPI PIN yourself.
        </p>
        <p>
          <Icon name="shield" size={15} /> There is no auto-pay setting, including for scheduled lists.
        </p>
      </div>
      <div className="list card">
        <a
          className="list-row"
          href={`${import.meta.env.VITE_API_URL ?? 'http://localhost:8788'}/docs`}
          target="_blank"
          rel="noreferrer"
        >
          <span className="ri">
            <Icon name="bookmark" size={17} />
          </span>
          <span className="grow">
            <b>API docs (Swagger)</b>
            <small>OpenAPI for the grocery agent backend</small>
          </span>
          <Icon name="external" size={15} />
        </a>
      </div>
      <p className="fine center">Akaya Grocery Agent · v0.1 · sample data</p>
    </Screen>
  );
}
