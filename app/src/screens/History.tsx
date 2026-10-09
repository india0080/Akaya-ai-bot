import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Screen } from '../components/Screen';
import { Icon } from '../components/Icon';
import { Pearl } from '../components/Pearl';
import { Avatar } from '../components/Avatar';
import { Sheet } from '../components/Sheet';
import { Segmented } from '../components/Controls';
import { useToast } from '../components/Toast';
import { useApp } from '../state/store';
import {
  buildHistory,
  dayGroup,
  FILTERS,
  itemTime,
  TYPE_META,
  type HistoryItem,
  type HistoryType,
} from '../lib/history';
import { speak } from '../lib/speech';
import { LANGS } from '../lib/mock';
import { AppTile } from '../components/AppTile';
import { APP_BY_ID } from '../integrations/catalog';
import './History.css';

type Filter = 'all' | HistoryType;
type Sort = 'new' | 'old';
type Range = 'all' | 'today' | '7d';
const GROUPS = ['Today', 'Yesterday', 'Earlier'] as const;

function translateQuery(text: string, out: string, langs = 'Hindi → English') {
  const [a, b] = langs.split(' → ').map((n) => LANGS.find((l) => l.name === n)?.code ?? 'en');
  return new URLSearchParams({ text, out, from: a, to: b }).toString();
}

/** Unified timeline of everything you did with Akaya. Filters, search, pin and delete all work on app state. */
export function History() {
  const { state, toggleHistoryPin, hideHistory } = useApp();
  const nav = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const filter = (params.get('f') as Filter) || 'all';
  const query = params.get('q') ?? '';
  const [searchOpen, setSearchOpen] = useState(query.length > 0);
  const [sort, setSort] = useState<Sort>('new');
  const [range, setRange] = useState<Range>('all');
  const [filterSheet, setFilterSheet] = useState(false);
  const [menu, setMenu] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  // keep the active filter chip in view
  useEffect(() => {
    const row = chipsRef.current;
    const chip = row?.querySelector<HTMLElement>('.hs-chip.on');
    if (row && chip)
      row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
  }, [filter]);

  const setParam = (k: string, v: string) => {
    const p = new URLSearchParams(params);
    if (v && v !== 'all') p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true });
  };

  const all = useMemo(() => buildHistory(state), [state]);
  const now = all.length ? Math.max(...all.map((i) => i.at)) : 0;
  const inRange = (i: HistoryItem) =>
    range === 'all' || (range === 'today' ? dayGroup(i.at) === 'Today' : i.at >= now - 7 * 86400000);
  const q = query.trim().toLowerCase();
  const matchesQuery = (i: HistoryItem) =>
    !q || `${i.title} ${i.preview} ${i.meta ?? ''} ${TYPE_META[i.type].tag}`.toLowerCase().includes(q);
  const base = all.filter((i) => inRange(i) && matchesQuery(i));
  const counts = base.reduce<Record<string, number>>((m, i) => ((m[i.type] = (m[i.type] ?? 0) + 1), m), {});
  const shown = base.filter((i) => filter === 'all' || i.type === filter);
  if (sort === 'old') shown.reverse();
  const pinned = shown.filter((i) => state.history.pinned.includes(i.key));
  const rest = shown.filter((i) => !state.history.pinned.includes(i.key));
  const sections: { title: string; items: HistoryItem[] }[] = [
    ...(pinned.length ? [{ title: 'Pinned', items: pinned }] : []),
    ...(sort === 'new' ? GROUPS : [...GROUPS].reverse()).map((g) => ({
      title: g,
      items: rest.filter((i) => dayGroup(i.at) === g),
    })),
  ].filter((s) => s.items.length);
  const activeFilters = (sort !== 'new' ? 1 : 0) + (range !== 'all' ? 1 : 0);

  const open = (i: HistoryItem) => {
    setMenu(null);
    if (i.to) nav(i.to);
    else setDetail(i.ref ?? null);
  };
  const act = state.activity.find((a) => a.id === detail);

  return (
    <Screen nav className="history">
      <header className="hs-top">
        <div className="hs-brand">
          <span className="hs-orb">
            <Pearl width={44} height={44} r={16} shadow={false} glow={0.2} />
          </span>
          <div>
            <b>Akaya</b>
            <small>AI Assistant</small>
          </div>
        </div>
        <button
          className={`icon-btn hs-search-btn${searchOpen ? ' on' : ''}`}
          aria-label="Search history"
          onClick={() => {
            setSearchOpen((o) => !o);
            if (searchOpen) setParam('q', '');
            else setTimeout(() => searchRef.current?.focus(), 60);
          }}
        >
          <Icon name={searchOpen ? 'close' : 'search'} size={21} />
        </button>
        <button className="hs-avatar" onClick={() => nav('/more')} aria-label="Profile">
          <Avatar size={40} />
        </button>
      </header>

      <div className="hs-title">
        <div>
          <h1>History</h1>
          <p>All your interactions and activities</p>
        </div>
        <button className={`hs-filter${activeFilters ? ' on' : ''}`} onClick={() => setFilterSheet(true)}>
          <Icon name="filter" size={16} />
          Filter
          {activeFilters > 0 && <span className="hs-badge">{activeFilters}</span>}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {searchOpen && (
          <motion.label
            className="hs-search"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <span className="hs-search-in">
              <Icon name="search" size={18} className="faint" />
              <input
                ref={searchRef}
                placeholder="Search chats, replies, notes…"
                value={query}
                onChange={(e) => setParam('q', e.target.value)}
                aria-label="Search history"
              />
              {query && (
                <button onClick={() => setParam('q', '')} aria-label="Clear search">
                  <Icon name="close" size={16} />
                </button>
              )}
            </span>
          </motion.label>
        )}
      </AnimatePresence>

      <div className="hs-chips" ref={chipsRef} role="tablist" aria-label="Filter by type">
        {FILTERS.map((f) => {
          const n = f === 'all' ? base.length : (counts[f] ?? 0);
          return (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              className={`hs-chip${filter === f ? ' on' : ''}`}
              onClick={() => setParam('f', f)}
            >
              {f === 'all' ? 'All' : TYPE_META[f].label}
              <span className="hs-n">{n}</span>
            </button>
          );
        })}
      </div>

      <div className="hs-list">
        {sections.map((s) => (
          <section key={s.title}>
            <h4 className={`hs-group${s.title === 'Pinned' ? ' pin' : ''}`}>
              {s.title === 'Pinned' && <Icon name="pin" size={13} />}
              {s.title}
            </h4>
            <AnimatePresence initial={false}>
              {s.items.map((i) => {
                const m = TYPE_META[i.type];
                const isPinned = state.history.pinned.includes(i.key);
                return (
                  <motion.article
                    key={i.key}
                    layout
                    className={`hs-card${menu === i.key ? ' menu-open' : ''}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -70, height: 0, marginBottom: 0 }}
                  >
                    <button className="hs-main" onClick={() => open(i)}>
                      {i.appId && APP_BY_ID[i.appId] ? (
                        <AppTile app={APP_BY_ID[i.appId]} size={44} />
                      ) : (
                        <span className={`hs-tile t-${m.tone}`}>
                          <Icon name={m.icon} size={21} />
                        </span>
                      )}
                      <span className="hs-body">
                        <span className="hs-row">
                          <b>{i.title}</b>
                          <time>{itemTime(i.at)}</time>
                        </span>
                        <span className="hs-prev">{i.preview}</span>
                        <span className="hs-tags">
                          <span className={`hs-tag t-${m.tone}`}>{m.tag}</span>
                          {i.meta && <span className="hs-meta">{i.meta}</span>}
                          {isPinned && <Icon name="pin" size={12} className="hs-pinned" />}
                        </span>
                      </span>
                    </button>
                    <button
                      className="hs-dots"
                      aria-label={`More actions for ${i.title}`}
                      aria-expanded={menu === i.key}
                      onClick={() => setMenu(menu === i.key ? null : i.key)}
                    >
                      <Icon name="dots" size={18} style={{ transform: 'rotate(90deg)' }} />
                    </button>
                    <AnimatePresence>
                      {menu === i.key && (
                        <motion.div
                          className="hs-menu"
                          role="menu"
                          initial={{ opacity: 0, scale: 0.9, y: -6 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: -6 }}
                        >
                          <button role="menuitem" onClick={() => open(i)}>
                            <Icon name="open" size={16} /> Open
                          </button>
                          <button
                            role="menuitem"
                            onClick={() => {
                              toggleHistoryPin(i.key);
                              setMenu(null);
                              toast(isPinned ? 'Unpinned' : 'Pinned to top', 'pin');
                            }}
                          >
                            <Icon name="pin" size={16} /> {isPinned ? 'Unpin' : 'Pin to top'}
                          </button>
                          <button
                            role="menuitem"
                            className="danger"
                            onClick={() => {
                              hideHistory(i.key);
                              setMenu(null);
                              toast('Removed from history', 'trash');
                            }}
                          >
                            <Icon name="trash" size={16} /> Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </section>
        ))}
        {sections.length > 0 ? (
          <p className="hs-end">— That's all for now —</p>
        ) : (
          <div className="empty hs-empty">
            <Icon name="history" size={30} />
            <b>Nothing found</b>
            <span>{q ? `No results for “${query}”.` : 'Try another filter.'}</span>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setParams({}, { replace: true });
                setRange('all');
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {menu && <div className="hs-scrim" onClick={() => setMenu(null)} />}

      <Sheet open={filterSheet} onClose={() => setFilterSheet(false)} title="Filter" height={60}>
        <span className="label">Sort</span>
        <Segmented<Sort>
          className="full"
          value={sort}
          onChange={setSort}
          options={[
            { value: 'new', label: 'Newest first' },
            { value: 'old', label: 'Oldest first' },
          ]}
        />
        <span className="label" style={{ marginTop: 16 }}>
          Time
        </span>
        <Segmented<Range>
          className="full"
          value={range}
          onChange={setRange}
          options={[
            { value: 'all', label: 'All time' },
            { value: 'today', label: 'Today' },
            { value: '7d', label: 'Last 7 days' },
          ]}
        />
        <div className="hs-sheet-actions">
          <button
            className="btn btn-ghost"
            onClick={() => {
              setSort('new');
              setRange('all');
            }}
          >
            Reset
          </button>
          <button className="btn btn-primary" onClick={() => setFilterSheet(false)}>
            Show {shown.length} results
          </button>
        </div>
      </Sheet>

      <Sheet open={!!act} onClose={() => setDetail(null)} title={act?.title} height={78}>
        {act && (
          <div className="hs-detail">
            <div className="hs-dmeta">
              <span className={`hs-tag t-${TYPE_META[act.kind].tone}`}>{TYPE_META[act.kind].tag}</span>
              {(act.app || act.langs) && <span className="hs-meta">{act.app ?? act.langs}</span>}
              <span className="hs-meta">{itemTime(act.at)}</span>
            </div>
            <div className="hs-bubble me">
              <small>{act.kind === 'translation' ? 'Original' : 'You said'}</small>
              {act.input}
            </div>
            <div className="hs-bubble ai">
              <small>
                {act.kind === 'translation'
                  ? 'Translation'
                  : act.kind === 'floating'
                    ? `Reply sent in ${act.app}`
                    : 'Akaya'}
              </small>
              {act.output}
            </div>
            <div className="hs-dact">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() =>
                  speak(act.output, state.settings.voiceSpeed, /[\u0900-\u097F]/.test(act.output) ? 'hi-IN' : 'en-IN')
                }
              >
                <Icon name="volume" size={16} /> Listen
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  navigator.clipboard?.writeText(act.output).catch(() => {});
                  toast('Copied', 'copy');
                }}
              >
                <Icon name="copy" size={16} /> Copy
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() =>
                  act.kind === 'translation'
                    ? nav(`/translate?${translateQuery(act.input, act.output, act.langs)}`)
                    : nav(`/chat?new=1&q=${encodeURIComponent(act.input)}`)
                }
              >
                <Icon name={act.kind === 'translation' ? 'translate' : 'chat'} size={16} />
                {act.kind === 'translation' ? 'Open in Translate' : 'Continue in Chat'}
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </Screen>
  );
}
