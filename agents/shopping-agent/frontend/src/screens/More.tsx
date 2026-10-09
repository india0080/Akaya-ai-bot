import { useEffect, useState } from 'react';
import { API, api } from '../api/client';
import type { Preset, ProviderInfo } from '../api/types';
import { useStore } from '../state';
import { Segmented } from '../ui/Controls';
import { Icon } from '../ui/Icon';
import { Screen } from '../ui/Screen';

export function More() {
  const { theme, preset, set, online } = useStore();
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  useEffect(() => {
    api.providers().then((p) => setProviders(p.providers), () => {});
  }, []);
  return (
    <Screen nav className="more">
      <header className="tab-head">
        <div>
          <h1>Settings</h1>
          <small className="muted">Shopping Agent · v0.1</small>
        </div>
        <span className={`tag ${online ? 'ok' : 'bad'}`}>{online ? '● API online' : '● API offline'}</span>
      </header>

      <div className="sec-head">
        <h3>Appearance</h3>
      </div>
      <div className="card pad">
        <Segmented
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
        <h3>Default ranking</h3>
      </div>
      <div className="card pad">
        <Segmented<Preset>
          value={preset}
          onChange={(v) => set({ preset: v })}
          options={[
            { value: 'balanced', label: 'Balanced' },
            { value: 'cheapest', label: 'Cheapest' },
            { value: 'fastest', label: 'Fastest' },
            { value: 'quality', label: 'Quality' },
          ]}
        />
        <p className="fine">Balanced weighs price 30%, rating 24%, delivery 18%, seller trust 16%, review volume 12%, then subtracts fake-review risk.</p>
      </div>

      <div className="sec-head">
        <h3>Data sources</h3>
      </div>
      <div className="list card">
        {providers.map((p) => (
          <div key={p.id} className="list-row">
            <span className="ri">
              <Icon name={p.kind === 'mock' ? 'box' : p.kind === 'browser' ? 'globe' : 'plug'} size={17} />
            </span>
            <div className="grow">
              <b>{p.label}</b>
              <small>{p.kind === 'mock' ? 'Realistic sample data for demos' : p.setupHint}</small>
            </div>
            <span className={`tag ${p.active ? (p.sampleData ? 'sample' : 'ok') : 'off'}`}>{p.active ? (p.sampleData ? 'Sample data' : 'Connected') : p.configured ? 'Ready' : 'Not connected'}</span>
          </div>
        ))}
      </div>
      <p className="fine pad-x">Real providers need keys in .env (see docs/PROVIDERS.md). The browser fallback is off by default: it may break store terms and get blocked.</p>

      <div className="sec-head">
        <h3>How it works</h3>
      </div>
      <div className="list card">
        <div className="list-row">
          <span className="ri">
            <Icon name="lock" size={17} />
          </span>
          <div className="grow">
            <b>You always buy</b>
            <small>Akaya never checks out. "Buy" opens the store.</small>
          </div>
        </div>
        <div className="list-row">
          <span className="ri">
            <Icon name="link" size={17} />
          </span>
          <div className="grow">
            <b>Affiliate disclosure</b>
            <small>Store links may carry an affiliate tag once configured.</small>
          </div>
        </div>
        <a className="list-row" href={`${API || 'http://localhost:8787'}/docs`} target="_blank" rel="noopener noreferrer">
          <span className="ri">
            <Icon name="open" size={17} />
          </span>
          <div className="grow">
            <b>API docs (Swagger)</b>
            <small>{API || 'http://localhost:8787'}/docs</small>
          </div>
          <Icon name="external" size={15} />
        </a>
      </div>
      <div style={{ height: 20 }} />
    </Screen>
  );
}
