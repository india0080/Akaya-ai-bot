import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { Icon } from '../components/Icon';
import { AppTile } from '../components/AppTile';
import { useApp } from '../state/store';
import {
  APPS,
  APP_BY_ID,
  CATEGORIES,
  KIND_LABEL,
  POPULAR,
  type CategoryId,
  type IntegrationApp,
} from '../integrations';
import { AppSheet, type Step } from './apps/AppSheet';
import './Apps.css';

/** Apps & Integrations: search, category chips, connected + popular rows and the full catalog. */
export function Apps() {
  const { state } = useApp();
  const [params, setParams] = useSearchParams();
  const cat = (params.get('c') as CategoryId | null) ?? 'all';
  const q = params.get('q') ?? '';
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

  useEffect(() => {
    const row = chipsRef.current;
    const chip = row?.querySelector<HTMLElement>('.ap-chip.on');
    if (row && chip)
      row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
  }, [cat]);

  const connected = Object.values(state.integrations)
    .sort((a, b) => b.connectedAt - a.connectedAt)
    .map((c) => APP_BY_ID[c.appId])
    .filter(Boolean);
  const needle = q.trim().toLowerCase();
  const list = useMemo(
    () =>
      APPS.filter(
        (a) =>
          (cat === 'all' || a.category === cat) &&
          (!needle ||
            `${a.name} ${a.desc} ${CATEGORIES.find((c) => c.id === a.category)?.label}`.toLowerCase().includes(needle)),
      ),
    [cat, needle],
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
          placeholder="Search 100 apps: Notion, Gmail, Tally…"
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
            {POPULAR.map((app) => (
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
        <p className="ap-foot">App names and marks belong to their owners. Tiles are placeholders.</p>
      </div>

      <AppSheet app={openId ? (APP_BY_ID[openId] ?? null) : null} initialStep={step} onClose={() => set('app', null)} />
    </Screen>
  );
}
