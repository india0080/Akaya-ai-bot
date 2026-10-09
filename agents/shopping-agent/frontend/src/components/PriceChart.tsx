import { useState } from 'react';
import type { History } from '../api/types';
import { inr, storeMeta } from '../lib/format';

const W = 330;
const H = 150;
const P = { l: 8, r: 8, t: 14, b: 22 };

/** Multi-store price history as an SVG line chart with a tap-to-inspect cursor. */
export function PriceChart({ h }: { h: History }) {
  const [hover, setHover] = useState<number | null>(null);
  const all = h.series.flatMap((s) => s.points.map((p) => p.price));
  if (!all.length) return <div className="empty">No history yet</div>;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const pad = (max - min) * 0.12 || max * 0.05;
  const lo = min - pad;
  const hi = max + pad;
  const n = Math.max(...h.series.map((s) => s.points.length));
  const x = (i: number) => P.l + (i / Math.max(1, n - 1)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);
  const path = (pts: { price: number }[]) =>
    pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.price).toFixed(1)}`).join('');
  const main = h.series[0];
  const area = `${path(main.points)}L${x(main.points.length - 1)},${H - P.b}L${x(0)},${H - P.b}Z`;
  const yAvg = y(h.stats.avg);
  const hi_ = hover ?? n - 1;
  const pick = (clientX: number, el: SVGSVGElement) => {
    const r = el.getBoundingClientRect();
    const rel = ((clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(n - 1, Math.round(((rel - P.l) / (W - P.l - P.r)) * (n - 1)))));
  };
  return (
    <div className="chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Price history, ${h.days} days. Low ${inr(h.stats.low)}, high ${inr(h.stats.high)}`}
        onPointerMove={(e) => pick(e.clientX, e.currentTarget)}
        onPointerDown={(e) => pick(e.clientX, e.currentTarget)}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="pc-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--violet)" stopOpacity="0.28" />
            <stop offset="1" stopColor="var(--violet)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={P.l} x2={W - P.r} y1={yAvg} y2={yAvg} className="avg-line" />
        <text x={W - P.r} y={yAvg - 4} className="avg-txt" textAnchor="end">
          avg {inr(h.stats.avg)}
        </text>
        <path d={area} fill="url(#pc-fill)" />
        {h.series
          .slice()
          .reverse()
          .map((s, si) => (
            <path
              key={s.store}
              d={path(s.points)}
              fill="none"
              stroke={si === h.series.length - 1 ? 'var(--violet)' : storeMeta(s.store).color}
              strokeWidth={si === h.series.length - 1 ? 2.4 : 1.5}
              strokeOpacity={si === h.series.length - 1 ? 1 : 0.55}
              strokeLinejoin="round"
            />
          ))}
        <line x1={x(hi_)} x2={x(hi_)} y1={P.t - 6} y2={H - P.b} className="cursor" />
        {main.points[hi_] && <circle cx={x(hi_)} cy={y(main.points[hi_].price)} r={4.5} className="dot" />}
        <text x={P.l} y={H - 6} className="axis">
          {h.days} days ago
        </text>
        <text x={W - P.r} y={H - 6} className="axis" textAnchor="end">
          Today
        </text>
      </svg>
      {main.points[hi_] && (
        <div className="chart-tip">
          <b>{inr(main.points[hi_].price)}</b>
          <span>
            {main.storeName} ·{' '}
            {new Date(main.points[hi_].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </span>
        </div>
      )}
      <div className="legend">
        {h.series.map((s, i) => (
          <span key={s.store}>
            <i style={{ background: i === 0 ? 'var(--violet)' : storeMeta(s.store).color }} />
            {s.storeName}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Sparkline({ points: raw, w = 86, h = 30 }: { points: number[]; w?: number; h?: number }) {
  const points = raw.length < 2 ? [raw[0] ?? 0, raw[0] ?? 0] : raw;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const d = points
    .map(
      (v, i) =>
        `${i ? 'L' : 'M'}${((i / (points.length - 1)) * w).toFixed(1)},${(h - 3 - ((v - min) / (max - min || 1)) * (h - 6)).toFixed(1)}`,
    )
    .join('');
  const down = points[points.length - 1] < points[0];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke={down ? 'var(--green)' : 'var(--violet)'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
