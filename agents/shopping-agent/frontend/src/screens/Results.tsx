import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { Filters, Preset, SortBy } from '../api/types';
import { storeStatus, useSearch } from '../api/useSearch';
import { CompareSheet } from '../components/CompareSheet';
import { FilterSheet } from '../components/FilterSheet';
import { ProductCard } from '../components/ProductCard';
import { SampleTag, StoreMark } from '../components/bits';
import { inr, STORE_NAMES } from '../lib/format';
import { useStore } from '../state';
import { Segmented } from '../ui/Controls';
import { Icon } from '../ui/Icon';
import { Pearl } from '../ui/Pearl';
import { Screen } from '../ui/Screen';
import { ScreenHeader } from '../ui/ScreenHeader';

const SORTS: { v: SortBy; l: string }[] = [
  { v: 'relevance', l: 'Akaya rank' },
  { v: 'price_asc', l: 'Price ↑' },
  { v: 'price_desc', l: 'Price ↓' },
  { v: 'rating', l: 'Rating' },
  { v: 'delivery', l: 'Delivery' },
  { v: 'discount', l: 'Discount' },
];
const LANG = { en: 'English', hi: 'हिन्दी', hinglish: 'Hinglish' } as const;

export function Results() {
  const [sp] = useSearchParams();
  const raw = sp.get('q') ?? '';
  // keyed so state resets per query
  return <ResultsInner key={raw} raw={raw} initialPreset={(sp.get('preset') as Preset) ?? undefined} />;
}

function ResultsInner({ raw, initialPreset }: { raw: string; initialPreset?: Preset }) {
  const nav = useNavigate();
  const { compare, toggleCompare, clearCompare } = useStore();
  const [preset, setPreset] = useState<Preset | undefined>(initialPreset);
  const [sort, setSort] = useState<SortBy>('relevance');
  const [filters, setFilters] = useState<{ q: string; f: Filters } | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [cmpOpen, setCmpOpen] = useState(false);

  const req = useMemo(() => ({ query: filters ? filters.q : raw, filters: filters?.f, sort, preset }), [raw, filters, sort, preset]);
  const s = useSearch(raw ? req : null);
  const r = s.result;
  const status = storeStatus(s.progress);
  const effFilters = r?.parsed.filters ?? {};
  const chips: string[] = [];
  if (effFilters.maxPrice) chips.push(`≤ ${inr(effFilters.maxPrice)}`);
  if (effFilters.minPrice) chips.push(`≥ ${inr(effFilters.minPrice)}`);
  if (effFilters.minRating) chips.push(`${effFilters.minRating}★+`);
  if (effFilters.maxDeliveryDays) chips.push(effFilters.maxDeliveryDays <= 1 ? 'Delivery tomorrow' : `Delivery ≤ ${effFilters.maxDeliveryDays} days`);
  if (effFilters.stores?.length) chips.push(effFilters.stores.map((x) => STORE_NAMES[x] ?? x).join(' / '));
  if (effFilters.hideHighFakeRisk) chips.push('No fake-review risk');
  if (effFilters.inStockOnly) chips.push('In stock');
  const ceiling = r ? Math.max(...r.products.map((p) => p.priceRange[1]), effFilters.maxPrice ?? 0, 1000) : 5000;
  const loadingFirst = !r && s.status === 'running';

  return (
    <Screen className="results">
      <ScreenHeader
        title={raw}
        sub={
          loadingFirst
            ? 'Searching stores…'
            : r
              ? `${r.products.length} products · ${r.totalOffers} offers · ${r.stores.length} stores${r.cached ? ' · cached' : ''}`
              : s.error
        }
        right={
          <button className="icon-btn card" onClick={() => setFilterOpen(true)} aria-label="Filters" disabled={!r}>
            <Icon name="filter" size={19} />
            {chips.length > 0 && <i className="dot-badge">{chips.length}</i>}
          </button>
        }
      />
      {s.stale && <div className="loading-bar" />}

      {loadingFirst && (
        <div className="searching">
          <Pearl width={160} height={140} r={46} mood="thinking" glow={1} />
          <h3>Comparing stores for you…</h3>
          <div className="store-progress card">
            {[...status.values()].map((p) => (
              <motion.div key={p.store} className="sp-row" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                <StoreMark store={p.store} size={22} />
                <b>{STORE_NAMES[p.store] ?? p.store}</b>
                <span className={`sp-st ${p.status}`}>
                  {p.status === 'searching' ? (
                    <>
                      <i className="spin" /> searching
                    </>
                  ) : p.status === 'done' ? (
                    <>
                      <Icon name="check" size={13} strokeWidth={2.6} /> {p.count} found
                    </>
                  ) : (
                    'error'
                  )}
                </span>
              </motion.div>
            ))}
            {status.size === 0 && <div className="sp-row faint">Queued…</div>}
          </div>
        </div>
      )}

      {s.status === 'error' && !r && (
        <div className="empty">
          <p>Search failed: {s.error}</p>
          <p className="fine">Is the backend running on port 8787?</p>
        </div>
      )}

      {r && (
        <>
          <div className="parsed">
            <span className="chip q">
              <Icon name="search" size={12} /> {r.parsed.q}
            </span>
            {chips.map((c) => (
              <span key={c} className="chip on">
                {c}
              </span>
            ))}
            {r.parsed.lang !== 'en' && <span className="chip lang">{LANG[r.parsed.lang]} understood</span>}
            <SampleTag show={r.sample} />
          </div>
          <div className="preset">
            <Segmented
              value={r.preset}
              onChange={setPreset}
              options={[
                { value: 'balanced', label: 'Balanced' },
                { value: 'cheapest', label: 'Cheapest' },
                { value: 'fastest', label: 'Fastest' },
                { value: 'quality', label: 'Quality' },
              ]}
            />
          </div>
          <div className="sorts" role="tablist" aria-label="Sort">
            <Icon name="sort" size={15} />
            {SORTS.map((x) => (
              <button key={x.v} role="tab" aria-selected={sort === x.v} className={`chip${sort === x.v ? ' on' : ''}`} onClick={() => setSort(x.v)}>
                {x.l}
              </button>
            ))}
          </div>
          <div className="plist">
            {r.products.map((p, i) => (
              <ProductCard key={p.key} p={p} i={i} compared={compare.includes(p.key)} onCompare={() => toggleCompare(p.key)} />
            ))}
            {r.products.length === 0 && (
              <div className="empty card">
                <p>Nothing matches these filters.</p>
                <button className="btn btn-sm btn-ghost" onClick={() => setFilterOpen(true)}>
                  Adjust filters
                </button>
              </div>
            )}
          </div>
          <p className="fine center">
            Sources: {r.providers.map((p) => `${p.label}${p.kind === 'mock' ? ' (sample data)' : ''}`).join(', ')} · {r.tookMs} ms
          </p>
        </>
      )}

      <AnimatePresence>
        {compare.length > 0 && (
          <motion.div className="cmp-bar" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}>
            <button className="icon-btn" onClick={clearCompare} aria-label="Clear compare">
              <Icon name="close" size={16} />
            </button>
            <span>
              <b>{compare.length}</b> selected {compare.length < 2 && <small>· pick one more</small>}
            </span>
            <button className="btn btn-sm btn-primary" disabled={compare.length < 2} onClick={() => setCmpOpen(true)}>
              <Icon name="compare" size={15} /> Compare
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={effFilters}
        ceiling={ceiling}
        onApply={(f) => setFilters({ q: r?.parsed.q ?? raw, f })}
      />
      <CompareSheet open={cmpOpen} onClose={() => setCmpOpen(false)} keys={compare} />
      {!raw && (
        <div className="empty">
          <button className="btn btn-brand" onClick={() => nav('/home')}>
            Start a search
          </button>
        </div>
      )}
    </Screen>
  );
}
