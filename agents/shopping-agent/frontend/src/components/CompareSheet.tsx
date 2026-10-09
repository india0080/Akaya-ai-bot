import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import type { Compare } from '../api/types';
import { Sheet } from '../ui/Sheet';
import { Icon } from '../ui/Icon';
import { SampleTag } from './bits';

export function CompareSheet({ open, onClose, keys }: { open: boolean; onClose: () => void; keys: string[] }) {
  return (
    <Sheet open={open} onClose={onClose} title="Compare" height={90}>
      {open && <CompareBody keys={keys} onClose={onClose} />}
    </Sheet>
  );
}

function CompareBody({ keys, onClose }: { keys: string[]; onClose: () => void }) {
  const [data, setData] = useState<Compare | null>(null);
  const [err, setErr] = useState('');
  const nav = useNavigate();
  const k = keys.join(',');
  useEffect(() => {
    api
      .compare(k.split(','))
      .then(setData)
      .catch((e: Error) => setErr(e.message));
  }, [k]);
  if (err) return <div className="empty">{err}</div>;
  if (!data) return <div className="empty">Comparing…</div>;
  const cols = data.products.length;
  return (
    <div className="compare">
      <div className="cmp-grid" style={{ gridTemplateColumns: `92px repeat(${cols}, minmax(0, 1fr))` }}>
        <div />
        {data.products.map((p) => (
          <button
            key={p.key}
            className={`cmp-head${p.key === data.winner ? ' win' : ''}`}
            onClick={() => {
              onClose();
              nav(`/product/${encodeURIComponent(p.key)}`);
            }}
          >
            {p.key === data.winner && (
              <span className="crown">
                <Icon name="crown" size={11} /> Akaya pick
              </span>
            )}
            <span className="em">{p.emoji}</span>
            <b>{p.title}</b>
          </button>
        ))}
        {data.rows.map((r) => (
          <div className="cmp-row" key={r.label} style={{ display: 'contents' }}>
            <div className="cmp-lbl">{r.label}</div>
            {r.values.map((v, i) => (
              <div key={i} className={`cmp-val${r.best === i ? ' best' : ''}`}>
                {v}
              </div>
            ))}
          </div>
        ))}
      </div>
      <p className="fine">
        Green = best in row. Akaya pick = highest overall score (price, adjusted rating, review volume, seller trust and delivery, minus
        fake-review risk). <SampleTag show={data.sample} />
      </p>
    </div>
  );
}
