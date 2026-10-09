import { useState } from 'react';
import { Icon, Screen, ScreenHeader } from '@akaya/ui';
import { appLink, inr, platformName } from '../commerce/links';
import { Disclosure, OpenButton, PlatformTile, SampleTag } from '../commerce/LinkParts';
import { DEAL_CATEGORIES, DEALS, pctOff, SHOP_STORES, type DealCategory } from '../commerce/sample/deals';
import { AGENT_APPS } from '../lib/agentApps';
import { openExternal } from '../native/openExternal';

/** Shopping: search any store, today's deals (sample), and a hand-off to the Shopping Agent for comparisons. */
export function Shopping() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<DealCategory | 'all'>('all');
  const deals = DEALS.filter((d) => cat === 'all' || d.category === cat);
  const agent = AGENT_APPS.find((a) => a.id === 'shopping')!;

  return (
    <Screen className="cm shopping">
      <ScreenHeader title="Shopping & Deals" sub="Search stores · today's deals" />
      <div className="card sh-search">
        <Icon name="search" size={18} className="faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What do you want to buy?"
          aria-label="Product search"
        />
      </div>
      <div className="sh-stores">
        {SHOP_STORES.map((s) => (
          <button
            key={s}
            className="card sh-store"
            disabled={!q.trim()}
            onClick={() =>
              openExternal(
                appLink({ platform: s, intent: 'search', params: { q }, campaign: 'deals', content: 'store-search' }),
              )
            }
          >
            <PlatformTile id={s} size={30} />
            <small>{platformName(s)}</small>
          </button>
        ))}
      </div>
      <p className="fine pad-x">
        {q.trim() ? 'Tap a store to see results there.' : 'Type a product, then pick a store.'}
      </p>

      <div className="sec-head">
        <h3>Today's deals</h3>
        <SampleTag text="SAMPLE PRICES" />
      </div>
      <div className="chips pad-x">
        {DEAL_CATEGORIES.map((c) => (
          <button key={c.id} className={`chip${cat === c.id ? ' on' : ''}`} onClick={() => setCat(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="deal-list">
        {deals.map((d) => (
          <article key={d.id} className="card deal">
            <span className="deal-em">{d.emoji}</span>
            <div className="deal-body">
              <b>{d.title}</b>
              <span className="deal-store">
                <PlatformTile id={d.platform} size={16} /> {platformName(d.platform)} ·{' '}
                <Icon name="star" size={11} fill /> {d.rating}
              </span>
              <span className="deal-price">
                <b>{inr(d.price)}</b>
                <s>{inr(d.mrp)}</s>
                <i>{pctOff(d)}% off</i>
              </span>
            </div>
            <OpenButton
              variant="primary"
              className="btn-sm"
              icon="external"
              link={appLink({
                platform: d.platform,
                intent: 'search',
                params: { q: d.q },
                campaign: 'deals',
                content: 'deal-card',
              })}
              label={`Buy on ${platformName(d.platform)}`}
            />
          </article>
        ))}
      </div>
      <Disclosure className="pad-x" platforms={deals.map((d) => d.platform)} />

      <button className="card sh-agent" onClick={() => window.open(agent.url, '_blank', 'noopener')}>
        <span className="sh-agent-ic" style={{ background: agent.grad }}>
          {agent.emoji}
        </span>
        <span className="grow">
          <b>Compare across stores</b>
          <small>{agent.desc}</small>
        </span>
        <Icon name="chev" size={18} className="faint" />
      </button>
      <p className="fine pad-x">
        Sample deals and prices. Buttons open the store's own app or site; you check the live price and pay there.
      </p>
    </Screen>
  );
}
