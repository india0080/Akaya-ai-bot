import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { History, Product as P, WatchItem } from '../api/types';
import { BadgeChip, RiskChip, SampleTag, Stars, StoreMark } from '../components/bits';
import { PriceChart } from '../components/PriceChart';
import { WatchSheet } from '../components/WatchSheet';
import { days, inr } from '../lib/format';
import { disclosureText } from '@akaya/affiliate';
import { Segmented, Icon, Screen, ScreenHeader, useToast } from '@akaya/ui';

export function Product() {
  const { key = '' } = useParams();
  return <ProductInner key={key} pkey={key} />;
}

const BREAKDOWN: { k: keyof P['best']['breakdown']; l: string }[] = [
  { k: 'price', l: 'Price' },
  { k: 'rating', l: 'Rating (adjusted)' },
  { k: 'reviews', l: 'Review volume' },
  { k: 'trust', l: 'Seller trust' },
  { k: 'delivery', l: 'Delivery speed' },
];

function ProductInner({ pkey }: { pkey: string }) {
  const toast = useToast();
  const [p, setP] = useState<P | null>(null);
  const [err, setErr] = useState('');
  const [range, setRange] = useState<'30' | '90' | '180'>('90');
  const [hist, setHist] = useState<History | null>(null);
  const [watching, setWatching] = useState<WatchItem | null>(null);
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    api.product(pkey).then(setP, (e: Error) => setErr(e.message));
    api.watchlist().then(
      (w) => setWatching(w.find((x) => x.productKey === pkey) ?? null),
      () => {},
    );
  }, [pkey]);
  useEffect(() => {
    api.history(pkey, Number(range)).then(setHist, () => {});
  }, [pkey, range]);

  if (err)
    return (
      <Screen>
        <ScreenHeader title="Product" />
        <div className="empty">{err}</div>
      </Screen>
    );
  if (!p)
    return (
      <Screen>
        <ScreenHeader title="Product" />
        <div className="empty">Loading…</div>
      </Screen>
    );
  const b = p.best;
  const h = b.histogram;

  return (
    <Screen className="product">
      <ScreenHeader
        title={p.brand}
        sub={`${p.offers.length} store${p.offers.length > 1 ? 's' : ''} compared`}
        right={
          <button
            className={`icon-btn card${watching ? ' on-heart' : ''}`}
            onClick={() => setSheet(true)}
            aria-label={watching ? 'Edit price alert' : 'Watch price'}
          >
            <Icon name="heart" size={19} fill={!!watching} />
          </button>
        }
      />
      <section className="p-hero">
        <div className="p-thumb">{p.emoji}</div>
        <div className="badges">
          {p.badges.map((x) => (
            <BadgeChip key={x} b={x} />
          ))}
          <SampleTag show={p.sample} />
        </div>
        <h2>{p.title}</h2>
        <div className="pcard-meta">
          <Stars value={b.rating} count={b.ratingCount} />
          <span className="dot" />
          <RiskChip risk={b.fakeRisk} />
        </div>
      </section>

      <section className="best card">
        <div className="best-top">
          <div>
            <span className="label">Best offer</span>
            <div className="pcard-price big">
              <b>{inr(b.price)}</b>
              {b.mrp > b.price && <s>{inr(b.mrp)}</s>}
              {b.discountPct > 0 && <em>{b.discountPct}% off</em>}
            </div>
          </div>
          <div className="best-store">
            <StoreMark store={b.store} size={30} />
            <small>{b.storeName}</small>
          </div>
        </div>
        <div className="best-meta">
          <span>
            <Icon name="truck" size={14} /> {days(b.delivery.days)}
            {b.delivery.free ? ' · free' : ''}
          </span>
          <span>
            <Icon name="store" size={14} /> {b.seller.name}
          </span>
          {b.delivery.cod && <span>COD</span>}
        </div>
        <a
          className="btn btn-primary btn-block"
          href={b.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
        >
          Buy on {b.storeName} <Icon name="external" size={16} />
        </a>
        <p className="fine">
          {disclosureText()}. Opens {b.storeName}; Akaya never checks out or pays for you.
        </p>
      </section>

      <div className="sec-head">
        <h3>Price history</h3>
        <Segmented
          className="mini"
          value={range}
          onChange={setRange}
          options={[
            { value: '30', label: '30d' },
            { value: '90', label: '90d' },
            { value: '180', label: '180d' },
          ]}
        />
      </div>
      <section className="card pad">
        {hist ? (
          <>
            <PriceChart h={hist} />
            <div className={`verdict v-${hist.verdict}`}>
              <Icon name={hist.verdict === 'wait' ? 'clock' : 'check'} size={16} strokeWidth={2.4} />
              <span>{hist.verdictText}</span>
            </div>
            <div className="stats">
              <span>
                <small>Lowest</small>
                <b>{inr(hist.stats.low)}</b>
              </span>
              <span>
                <small>Average</small>
                <b>{inr(hist.stats.avg)}</b>
              </span>
              <span>
                <small>Highest</small>
                <b>{inr(hist.stats.high)}</b>
              </span>
            </div>
          </>
        ) : (
          <div className="empty">Loading history…</div>
        )}
      </section>
      <button className="btn btn-outline btn-block watch-cta" onClick={() => setSheet(true)}>
        <Icon name="bell" size={17} />{' '}
        {watching ? `Alert at ${inr(watching.targetPrice ?? watching.currentPrice)}: edit` : 'Set a price alert'}
      </button>

      <div className="sec-head">
        <h3>All offers</h3>
      </div>
      <div className="list card">
        {p.offers.map((o) => (
          <div key={o.id} className={`list-row offer${o.id === b.id ? ' is-best' : ''}`}>
            <StoreMark store={o.store} size={30} />
            <div className="grow">
              <b>
                {o.storeName} {o.id === b.id && <span className="tag best-tag">Best</span>}
              </b>
              <small>
                {o.seller.name} · {days(o.delivery.days)} · {o.rating}★
                {o.fakeRisk.level !== 'low' ? ` · ${o.fakeRisk.level} review risk` : ''}
                {!o.inStock ? ' · out of stock' : ''}
              </small>
            </div>
            <div className="offer-r">
              <b>{inr(o.price)}</b>
              <a href={o.affiliateUrl} target="_blank" rel="noopener noreferrer sponsored" className="pill-link">
                Buy <Icon name="external" size={11} />
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="sec-head">
        <h3>Why it ranks #{p.rank}</h3>
        <span className="tag score-tag">Score {Math.round(p.score * 100)}</span>
      </div>
      <section className="card pad">
        {BREAKDOWN.map((x) => (
          <div key={x.k} className="bar-row">
            <span>{x.l}</span>
            <div className="bar">
              <i style={{ width: `${Math.round(b.breakdown[x.k] * 100)}%` }} />
            </div>
            <b>{Math.round(b.breakdown[x.k] * 100)}</b>
          </div>
        ))}
        {b.breakdown.fakePenalty > 0 && (
          <div className="bar-row neg">
            <span>Fake-review penalty</span>
            <div className="bar">
              <i style={{ width: `${Math.round((b.breakdown.fakePenalty / 0.3) * 100)}%` }} />
            </div>
            <b>−{Math.round(b.breakdown.fakePenalty * 100)}</b>
          </div>
        )}
      </section>

      <div className="sec-head">
        <h3>Review check</h3>
        <RiskChip risk={b.fakeRisk} />
      </div>
      <section className="card pad">
        {h && (
          <div className="histo">
            {h.map((v, i) => (
              <div key={i} className="h-row">
                <span>{5 - i}★</span>
                <div className="bar">
                  <i style={{ width: `${Math.round(v * 100)}%` }} className={i === 4 && v > 0.1 ? 'bad' : ''} />
                </div>
                <b>{Math.round(v * 100)}%</b>
              </div>
            ))}
          </div>
        )}
        {b.fakeRisk.signals.length ? (
          <ul className="signals-list">
            {b.fakeRisk.signals.map((sg) => (
              <li key={sg}>
                <Icon name="alert" size={14} /> {sg}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">
            No red flags: rating spread, verified share ({Math.round((b.verifiedShare ?? 0) * 100)}%) and review pace
            look normal.
          </p>
        )}
        <p className="fine">Heuristic signals, not proof. Verify reviews on the store before buying.</p>
      </section>

      {Object.keys(b.specs).length > 0 && (
        <>
          <div className="sec-head">
            <h3>Specs</h3>
          </div>
          <div className="list card specs">
            {Object.entries(b.specs).map(([k, v]) => (
              <div key={k} className="list-row">
                <small className="grow">{k}</small>
                <b>{v}</b>
              </div>
            ))}
          </div>
        </>
      )}
      <div style={{ height: 30 }} />

      <WatchSheet
        open={sheet}
        onClose={() => setSheet(false)}
        price={b.price}
        title={p.title}
        initialTarget={watching?.targetPrice}
        initialAnyDrop={watching?.anyDrop ?? true}
        saveLabel={watching ? 'Update alert' : 'Watch price'}
        onSave={(t, a) => {
          api.watch({ offerId: b.id, targetPrice: t, anyDrop: a }).then(
            (w) => {
              setWatching(w);
              setSheet(false);
              toast(`Watching: alert at ${inr(t)}`, 'bell');
            },
            (e: Error) => toast(e.message, 'alert'),
          );
        }}
      />
    </Screen>
  );
}
