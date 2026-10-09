import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useStore } from '../state';
import { Screen } from '../ui/Screen';
import { Pearl } from '../ui/Pearl';
import { Icon, type IconName } from '../ui/Icon';
import { EXAMPLES } from '../lib/examples';

const CATS = [
  { q: 'school bag', e: '🎒', n: 'School bags', h: 'basta' },
  { q: 'wireless earbuds', e: '🎧', n: 'Earbuds', h: 'earphone' },
  { q: 'running shoes', e: '👟', n: 'Running shoes', h: 'joote' },
  { q: 'mixer grinder', e: '🥣', n: 'Mixer grinders', h: 'mixie' },
  { q: 'smartphone', e: '📱', n: 'Smartphones', h: 'mobile' },
  { q: 'smartwatch', e: '⌚', n: 'Smartwatches', h: 'ghadi' },
  { q: 'water bottle', e: '🧴', n: 'Bottles', h: 'botal' },
  { q: 'cotton kurta', e: '👘', n: 'Kurtas', h: 'kurta' },
  { q: 'power bank', e: '🔋', n: 'Power banks', h: 'charger' },
];
const SIGNALS: { i: IconName; t: string; c: string }[] = [
  { i: 'rupee', t: 'Price across stores', c: 'gi-orange' },
  { i: 'star', t: 'Adjusted rating', c: 'gi-violet' },
  { i: 'users', t: 'Review volume', c: 'gi-blue' },
  { i: 'shield', t: 'Seller trust', c: 'gi-green' },
  { i: 'truck', t: 'Delivery time', c: 'gi-cyan' },
  { i: 'alert', t: 'Fake-review check', c: 'gi-pink' },
];

export function Home({ onVoice }: { onVoice: () => void }) {
  const nav = useNavigate();
  const { preset, notifications } = useStore();
  const [q, setQ] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [mockOnly, setMockOnly] = useState(true);
  useEffect(() => {
    api.recent().then((r) => setRecent(r.map((x) => x.q).slice(0, 5)), () => {});
    api.providers().then((p) => setMockOnly(p.active.every((x) => x === 'mock')), () => {});
  }, []);
  const go = (query: string) => {
    if (!query.trim()) return;
    nav(`/search?q=${encodeURIComponent(query.trim())}${preset !== 'balanced' ? `&preset=${preset}` : ''}`);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    go(q);
  };
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <Screen nav className="home">
      <header className="home-top">
        <div className="brand">
          <Pearl width={44} height={44} r={15} glow={0.6} />
          <div>
            <h1>
              <span className="grad-text">Shopping</span> Agent
            </h1>
            <small>Akaya · finds the best deal, you buy</small>
          </div>
        </div>
        <button className="icon-btn card" onClick={() => nav('/alerts')} aria-label={`Alerts${unread ? `, ${unread} unread` : ''}`}>
          <Icon name="bell" size={20} />
          {unread > 0 && <i className="dot-badge">{unread}</i>}
        </button>
      </header>

      <section className="hero card">
        <p className="hello">Namaste Priya 👋</p>
        <h2>What should I find for you today?</h2>
        <form className="search-box" onSubmit={submit}>
          <Icon name="search" size={19} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type in English, Hindi or Hinglish…" aria-label="Search products" enterKeyHint="search" />
          <button type="button" className="mic" onClick={onVoice} aria-label="Search by voice">
            <Icon name="mic" size={18} />
          </button>
        </form>
        <div className="examples">
          {EXAMPLES.map((x) => (
            <button key={x} className="chip" onClick={() => go(x)}>
              {x}
            </button>
          ))}
        </div>
      </section>

      {mockOnly && (
        <div className="notice">
          <Icon name="box" size={16} />
          <span>
            Running on the <b>Mock provider</b>: realistic <b>sample</b> prices, not live store data. Add API keys to connect real sources.
          </span>
        </div>
      )}

      <div className="sec-head">
        <h3>Popular categories</h3>
      </div>
      <div className="cats">
        {CATS.map((c) => (
          <button key={c.q} className="cat card" onClick={() => go(c.q)}>
            <span className="em">{c.e}</span>
            <b>{c.n}</b>
            <small>{c.h}</small>
          </button>
        ))}
      </div>

      {recent.length > 0 && (
        <>
          <div className="sec-head">
            <h3>Recent searches</h3>
          </div>
          <div className="list card">
            {recent.map((r) => (
              <button key={r} className="list-row" onClick={() => go(r)}>
                <span className="ri">
                  <Icon name="history" size={17} />
                </span>
                <span className="grow">
                  <b>{r}</b>
                </span>
                <Icon name="chev" size={16} />
              </button>
            ))}
          </div>
        </>
      )}

      <div className="sec-head">
        <h3>How Akaya ranks</h3>
      </div>
      <div className="signals card">
        {SIGNALS.map((s) => (
          <div key={s.t} className="sig">
            <span className={`gi ${s.c}`}>
              <Icon name={s.i} size={15} />
            </span>
            <span>{s.t}</span>
          </div>
        ))}
        <p className="fine">Akaya never checks out for you. "Buy" opens the store, and you pay there yourself.</p>
      </div>
    </Screen>
  );
}
