import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Screen, ScreenHeader, Icon } from '@akaya/ui';
import { AppTile } from '../components/AppTile';
import { useApp } from '../state/store';
import { centerSelected } from '../lib/scroll';
import {
  APPS,
  APP_BY_ID,
  CATEGORIES,
  KIND_LABEL,
  connectedApps,
  POPULAR,
  type CategoryId,
  type IntegrationApp,
  type Region,
} from '../integrations';

const REGIONS: { id: 'all' | Region; label: string }[] = [
  { id: 'all', label: 'All regions' },
  { id: 'in', label: 'India' },
  { id: 'global', label: 'Global' },
];
const regionTag = (a: IntegrationApp) =>
  a.regions.length > 1 ? 'India · Global' : a.regions[0] === 'in' ? 'India' : 'Global';
import { AppSheet, type Step } from './apps/AppSheet';
import './Apps.css';

/** Apps & Integrations: search, category chips, connected + popular rows and the full catalog. */
export function Apps() {
  const { state } = useApp();
  const [params, setParams] = useSearchParams();
  const cat = (params.get('c') as CategoryId | null) ?? 'all';
  const q = params.get('q') ?? '';
  const region = (params.get('r') as Region | null) ?? 'all';
  const inRegion = (a: IntegrationApp) => region === 'all' || a.regions.includes(region as Region);
  const openId = params.get('app');
  const step = (params.get('step') as Step | null) ?? 'detail';
  const chipsRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const openedHere = (location.state as { sheet?: boolean } | null)?.sheet === true;

  const set = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v && v !== 'all') p.set(k, v);
    else p.delete(k);
    if (k === 'app') p.delete('step');
    // opening a sheet pushes a history entry (so Back closes it); closing pops that entry
    if (k === 'app' && !v && openedHere) navigate(-1);
    else if (k === 'app' && v) setParams(p, { state: { sheet: true } });
    else setParams(p, { replace: true });
  };

  useEffect(() => centerSelected(chipsRef.current, '.ap-chip.on'), [cat]);

  const connected = connectedApps(state.integrations);
  const needle = q.trim().toLowerCase();
  const list = APPS.filter(
    (a) =>
      (cat === 'all' || a.category === cat) &&
      (region === 'all' || a.regions.includes(region)) &&
      (!needle ||
        `${a.name} ${a.desc} ${CATEGORIES.find((c) => c.id === a.category)?.label} ${regionTag(a)}`
          .toLowerCase()
          .includes(needle)),
  );
  const browsing = cat === 'all' && !needle;
  const groups = browsing
    ? CATEGORIES.map((c) => ({ c, apps: list.filter((a) => a.category === c.id) }))
    : [{ c: null, apps: list }];

  const row = (app: IntegrationApp) => {
    const on = !!state.integrations[app.id];
    return (
      <div className="ap-row" key={app.id}>
        <button className="ap-main" onClick={() => set('app', app.id)}>
          <AppTile app={app} size={44} />
          <span className="grow">
            <b>
              {app.name}
              {app.kind !== 'oauth' && <em className={`ap-kind k-${app.kind}`}>{KIND_LABEL[app.kind]}</em>}
            </b>
            <small>{app.desc}</small>
            <i className={`ap-reg r-${app.regions.length > 1 ? 'both' : app.regions[0]}`}>{regionTag(app)}</i>
          </span>
        </button>
        {on ? (
          <button className="ap-btn on" onClick={() => set('app', app.id)} aria-label={`${app.name} connected`}>
            <Icon name="check" size={14} strokeWidth={3} />
          </button>
        ) : (
          <button className="ap-btn" onClick={() => p2(app.id)}>
            {app.kind === 'deeplink' ? 'Enable' : 'Connect'}
          </button>
        )}
      </div>
    );
  };
  const p2 = (id: string) => {
    const p = new URLSearchParams(params);
    p.set('app', id);
    p.set('step', 'consent');
    setParams(p, { state: { sheet: true } });
  };

  return (
    <Screen className="apps">
      <ScreenHeader title="Apps & Integrations" sub={`${APPS.length} apps · ${connected.length} connected`} />
      <label className="ap-search">
        <Icon name="search" size={18} className="faint" />
        <input
          placeholder={`Search ${APPS.length} apps: Notion, Gmail, Shopify…`}
          value={q}
          onChange={(e) => set('q', e.target.value)}
          aria-label="Search apps"
        />
        {q && (
          <button onClick={() => set('q', '')} aria-label="Clear search">
            <Icon name="close" size={16} />
          </button>
        )}
      </label>
      <div className="ap-region" role="radiogroup" aria-label="Region">
        {REGIONS.map((r) => (
          <button
            key={r.id}
            role="radio"
            aria-checked={region === r.id}
            className={region === r.id ? 'on' : ''}
            onClick={() => set('r', r.id)}
          >
            {r.id === 'in' && <span className="flag" aria-hidden="true" />}
            {r.id === 'global' && <Icon name="globe" size={13} />}
            {r.label}
            <small>
              {r.id === 'all' ? APPS.length : APPS.filter((a) => a.regions.includes(r.id as Region)).length}
            </small>
          </button>
        ))}
      </div>
      <div className="ap-chips" ref={chipsRef} role="tablist" aria-label="Categories">
        {[{ id: 'all', label: 'All' }, ...CATEGORIES].map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={cat === c.id}
            className={`ap-chip${cat === c.id ? ' on' : ''}`}
            onClick={() => set('c', c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {browsing && connected.length > 0 && (
        <section>
          <div className="ap-h">
            <h3>Connected</h3>
            <span>{connected.length}</span>
          </div>
          <div className="ap-connected">
            {connected.map((app) => (
              <button key={app.id} className="card ap-cc" onClick={() => set('app', app.id)}>
                <AppTile app={app} size={40} />
                <span className="grow">
                  <b>{app.name}</b>
                  <small>
                    <i className="dot" /> {app.kind === 'deeplink' ? 'Enabled' : 'Connected'}
                  </small>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {browsing && (
        <section>
          <div className="ap-h">
            <h3>Popular</h3>
          </div>
          <div className="ap-pop">
            {POPULAR.filter(inRegion).map((app) => (
              <button key={app.id} className="ap-pi" onClick={() => set('app', app.id)}>
                <span className="ap-pt">
                  <AppTile app={app} size={54} />
                  {state.integrations[app.id] && (
                    <span className="ap-ok">
                      <Icon name="check" size={10} strokeWidth={3.4} />
                    </span>
                  )}
                </span>
                <span>{app.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="ap-list">
        {groups
          .filter((g) => g.apps.length)
          .map((g) => (
            <section key={g.c?.id ?? 'results'}>
              <div className="ap-h">
                <h3>{g.c ? g.c.label : needle ? `Results for “${q}”` : CATEGORIES.find((c) => c.id === cat)?.label}</h3>
                <span>{g.apps.length}</span>
              </div>
              <div className="card ap-card">{g.apps.map(row)}</div>
            </section>
          ))}
        {!list.length && (
          <div className="empty ap-empty">
            <Icon name="apps" size={30} />
            <b>No apps match “{q}”</b>
            <button className="btn btn-ghost btn-sm" onClick={() => setParams({}, { replace: true })}>
              Clear search
            </button>
          </div>
        )}
        <p className="ap-foot">
          App names and logos are trademarks of their owners, shown only to identify each integration. No endorsement
          implied.
        </p>
      </div>

      <AppSheet app={openId ? (APP_BY_ID[openId] ?? null) : null} initialStep={step} onClose={() => set('app', null)} />
    </Screen>
  );
}
