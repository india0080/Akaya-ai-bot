import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../api/types';
import { days, inr } from '../lib/format';
import { Icon } from '../ui/Icon';
import { BadgeChip, RiskChip, Stars, StoreMark } from './bits';

export function ProductCard({ p, i, compared, onCompare }: { p: Product; i: number; compared: boolean; onCompare: () => void }) {
  const nav = useNavigate();
  const b = p.best;
  return (
    <motion.article
      className={`pcard card${b.fakeRisk.level === 'high' ? ' is-risky' : ''}`}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(i, 8) * 0.05 }}
      data-key={p.key}
    >
      <button className="pcard-main" onClick={() => nav(`/product/${encodeURIComponent(p.key)}`)} aria-label={`Open ${p.title}`}>
        <div className="pcard-thumb">
          <span>{p.emoji ?? '🛍️'}</span>
          <i className="rank">#{p.rank}</i>
        </div>
        <div className="pcard-body">
          {p.badges.length > 0 && (
            <div className="badges">
              {p.badges.map((x) => (
                <BadgeChip key={x} b={x} />
              ))}
            </div>
          )}
          <h4>{p.title}</h4>
          <div className="pcard-meta">
            <Stars value={b.rating} count={b.ratingCount} />
            <span className="dot" />
            <span className="deliv">
              <Icon name="truck" size={12} /> {days(b.delivery.days)}
            </span>
          </div>
          <div className="pcard-price">
            <b>{inr(b.price)}</b>
            {b.mrp > b.price && <s>{inr(b.mrp)}</s>}
            {b.discountPct > 0 && <em>{b.discountPct}% off</em>}
          </div>
          <div className="pcard-store">
            <StoreMark store={b.store} size={18} />
            <span>
              on <b>{b.storeName}</b>
              {p.offers.length > 1 && <span className="faint"> · {p.offers.length} stores</span>}
            </span>
          </div>
          <RiskChip risk={b.fakeRisk} compact />
        </div>
      </button>
      <div className="pcard-foot">
        <div className="score" title="Akaya score">
          <span style={{ width: `${Math.round(Math.max(0, p.score) * 100)}%` }} />
          <small>Score {Math.round(p.score * 100)}</small>
        </div>
        <button className={`cmp-btn${compared ? ' on' : ''}`} onClick={onCompare} aria-pressed={compared}>
          <Icon name={compared ? 'check' : 'compare'} size={14} strokeWidth={2.3} />
          {compared ? 'Comparing' : 'Compare'}
        </button>
      </div>
    </motion.article>
  );
}
