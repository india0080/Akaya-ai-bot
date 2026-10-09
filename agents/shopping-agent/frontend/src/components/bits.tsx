import { Icon } from '@akaya/ui';
import { BADGES, storeMeta } from '../lib/format';
import type { Badge, FakeRisk } from '../api/types';

export function StoreMark({ store, size = 22 }: { store: string; size?: number }) {
  const s = storeMeta(store);
  return (
    <span
      className="store-mark"
      style={{ background: s.color, width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {s.mono}
    </span>
  );
}

export function Stars({ value, count }: { value: number; count?: number }) {
  return (
    <span className="stars">
      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="#f5a524" />
      </svg>
      <b>{value.toFixed(1)}</b>
      {count !== undefined && <span className="faint">({count.toLocaleString('en-IN')})</span>}
    </span>
  );
}

export function BadgeChip({ b }: { b: Badge }) {
  const d = BADGES[b];
  return (
    <span className={`badge ${d.cls}`}>
      <Icon name={d.icon} size={11} strokeWidth={2.4} />
      {d.label}
    </span>
  );
}

export function RiskChip({ risk, compact = false }: { risk: FakeRisk; compact?: boolean }) {
  if (risk.level === 'low' && compact) return null;
  return (
    <span className={`risk risk-${risk.level}`}>
      <Icon name={risk.level === 'low' ? 'shield' : 'alert'} size={11} strokeWidth={2.3} />
      {risk.level === 'low'
        ? 'Reviews look genuine'
        : risk.level === 'medium'
          ? 'Some review red flags'
          : 'Fake-review risk'}
    </span>
  );
}

export function SampleTag({ show = true }: { show?: boolean }) {
  if (!show) return null;
  return (
    <span className="sample-tag" title="Mock provider: realistic sample data, not live prices">
      <Icon name="box" size={11} strokeWidth={2.3} /> SAMPLE DATA
    </span>
  );
}
