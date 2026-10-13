import type { Plan } from '../../content/types';
import { ButtonLink } from '../ui/Button';

export function PlanGrid({ plans, compact }: { plans: Plan[]; compact?: boolean }) {
  return (
    <div className="four">
      {plans.map((p) => (
        <article key={p.id} className={`card price${p.highlight ? ' hot' : ''}`}>
          <h3>{p.name}</h3>
          <p className="amt">{p.monthly}<small>{p.suffix}</small></p>
          {p.yearly && p.yearly !== p.monthly && <p className="muted small">or {p.yearly}/year</p>}
          <p><b>{p.credits}</b></p>
          <ul className="ticks">{(compact ? p.features.slice(0, 3) : p.features).map((f) => <li key={f}>{f}</li>)}</ul>
          <ButtonLink {...p.cta} size="sm" />
        </article>
      ))}
    </div>
  );
}
