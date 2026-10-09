import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { WatchItem } from '../api/types';
import { SampleTag, StoreMark } from '../components/bits';
import { Sparkline } from '../components/PriceChart';
import { WatchSheet } from '../components/WatchSheet';
import { inr } from '../lib/format';
import { Icon, Screen, useToast } from '@akaya/ui';

export function Watchlist() {
  const nav = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState<WatchItem[] | null>(null);
  const [edit, setEdit] = useState<WatchItem | null>(null);
  const [busy, setBusy] = useState(false);
  const load = () => api.watchlist().then(setItems, () => setItems([]));
  useEffect(() => {
    api.watchlist().then(setItems, () => setItems([]));
  }, []);
  const check = () => {
    setBusy(true);
    api
      .checkPrices()
      .then((r) => {
        // fired alerts arrive as a live heads-up banner (SSE), so only toast when nothing fired
        if (!r.alerts.length) toast(`Checked ${r.checked}: no drops yet`, 'refresh');
        return load();
      })
      .finally(() => setBusy(false));
  };
  return (
    <Screen nav className="watch">
      <header className="tab-head">
        <div>
          <h1>Watchlist</h1>
          <small className="muted">Price alerts across stores</small>
        </div>
        <button className="btn btn-sm btn-outline" onClick={check} disabled={busy || !items?.length}>
          <Icon name="refresh" size={14} className={busy ? 'spinning' : ''} /> Check now
        </button>
      </header>
      {items && items.length === 0 && (
        <div className="empty-hero card">
          <span className="gi gi-pink big">
            <Icon name="heart" size={26} />
          </span>
          <h3>Nothing watched yet</h3>
          <p className="muted">
            Open any product and tap "Set a price alert". Akaya checks prices and pings you when they drop.
          </p>
          <button className="btn btn-brand" onClick={() => nav('/home')}>
            Find something
          </button>
        </div>
      )}
      <div className="wlist">
        {items?.map((w) => {
          const change = Math.round((1 - w.currentPrice / w.priceAtAdd) * 100);
          const hit = w.targetPrice !== undefined && w.currentPrice <= w.targetPrice;
          const toGo = w.targetPrice ? Math.max(0, w.currentPrice - w.targetPrice) : 0;
          return (
            <article key={w.id} className={`witem card${hit ? ' hit' : ''}`}>
              <button className="w-main" onClick={() => nav(`/product/${encodeURIComponent(w.productKey)}`)}>
                <span className="w-em">{w.emoji}</span>
                <span className="grow">
                  <b>{w.title}</b>
                  <small>
                    <StoreMark store={w.store} size={14} /> {w.storeName}
                  </small>
                </span>
                <Sparkline points={w.history.map((x) => x.price)} />
              </button>
              <div className="w-prices">
                <div>
                  <small>Now</small>
                  <b>{inr(w.currentPrice)}</b>
                  {change !== 0 && (
                    <em className={change > 0 ? 'down' : 'up'}>{change > 0 ? `▼ ${change}%` : `▲ ${-change}%`}</em>
                  )}
                </div>
                <div>
                  <small>Target</small>
                  <b>{w.targetPrice ? inr(w.targetPrice) : 'Any drop'}</b>
                </div>
                <div>
                  <small>Lowest seen</small>
                  <b>{inr(w.lowestSeen)}</b>
                </div>
              </div>
              {w.targetPrice && (
                <div className="w-progress">
                  <div className="bar">
                    <i
                      style={{
                        width: `${hit ? 100 : Math.max(6, Math.round((1 - toGo / Math.max(1, w.priceAtAdd - w.targetPrice)) * 100))}%`,
                      }}
                    />
                  </div>
                  <small>{hit ? 'Target reached: go grab it' : `${inr(toGo)} to go`}</small>
                </div>
              )}
              <div className="w-actions">
                <SampleTag show={w.sample} />
                <span className="grow" />
                <button className="btn btn-sm btn-ghost" onClick={() => setEdit(w)}>
                  <Icon name="edit" size={14} /> Edit
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  aria-label="Remove"
                  onClick={() =>
                    api.unwatch(w.id).then(() => {
                      toast('Removed from watchlist', 'trash');
                      load();
                    })
                  }
                >
                  <Icon name="trash" size={14} />
                </button>
                <a className="btn btn-sm btn-primary" href={w.url} target="_blank" rel="noopener noreferrer sponsored">
                  Buy <Icon name="external" size={13} />
                </a>
              </div>
            </article>
          );
        })}
      </div>
      {items && items.length > 0 && (
        <p className="fine center">
          Checked automatically every 30 s in the demo (configurable). You always buy on the store.
        </p>
      )}
      <WatchSheet
        open={!!edit}
        onClose={() => setEdit(null)}
        price={edit?.currentPrice ?? 0}
        title={edit?.title ?? ''}
        initialTarget={edit?.targetPrice}
        initialAnyDrop={edit?.anyDrop}
        saveLabel="Update alert"
        onSave={(t, a) =>
          edit &&
          api.updateWatch(edit.id, { targetPrice: t, anyDrop: a }).then(() => {
            setEdit(null);
            toast(`Alert set at ${inr(t)}`, 'bell');
            load();
          })
        }
      />
    </Screen>
  );
}
