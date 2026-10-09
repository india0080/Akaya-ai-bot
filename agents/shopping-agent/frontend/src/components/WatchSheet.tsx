import { useState } from 'react';
import { inr } from '../lib/format';
import { RangeSlider, Toggle } from '../ui/Controls';
import { Sheet } from '../ui/Sheet';

export function WatchSheet({
  open,
  onClose,
  price,
  title,
  initialTarget,
  initialAnyDrop = true,
  onSave,
  saveLabel = 'Watch price',
}: {
  open: boolean;
  onClose: () => void;
  price: number;
  title: string;
  initialTarget?: number;
  initialAnyDrop?: boolean;
  onSave: (target: number, anyDrop: boolean) => void;
  saveLabel?: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Price alert" height={70}>
      {open && <Body price={price} title={title} initialTarget={initialTarget} initialAnyDrop={initialAnyDrop} onSave={onSave} saveLabel={saveLabel} />}
    </Sheet>
  );
}

function Body({ price, title, initialTarget, initialAnyDrop, onSave, saveLabel }: { price: number; title: string; initialTarget?: number; initialAnyDrop: boolean; onSave: (t: number, a: boolean) => void; saveLabel: string }) {
  const step = price > 5000 ? 100 : price > 1000 ? 50 : 10;
  const [target, setTarget] = useState(initialTarget ?? Math.round((price * 0.9) / step) * step);
  const [anyDrop, setAnyDrop] = useState(initialAnyDrop);
  const pct = Math.round((1 - target / price) * 100);
  return (
    <div className="watch-body">
      <p className="muted small">{title}</p>
      <div className="target-big">
        <span className="label">Alert me at or below</span>
        <b className="grad-text">{inr(target)}</b>
        <small className="muted">
          {pct > 0 ? `${pct}% below` : 'At'} today's best {inr(price)}
        </small>
      </div>
      <RangeSlider label="Target price" min={Math.round((price * 0.5) / step) * step} max={price} step={step} value={target} onChange={setTarget} format={inr} />
      <div className="quick">
        {[5, 10, 15, 20].map((p) => (
          <button key={p} className="chip" onClick={() => setTarget(Math.round((price * (1 - p / 100)) / step) * step)}>
            −{p}%
          </button>
        ))}
      </div>
      <div className="list card flat">
        <div className="list-row">
          <div className="grow">
            <b>Also alert on any 5% drop</b>
            <small>Even before your target is reached</small>
          </div>
          <Toggle label="Any drop" on={anyDrop} onChange={setAnyDrop} />
        </div>
      </div>
      <button className="btn btn-primary btn-block" onClick={() => onSave(target, anyDrop)}>
        {saveLabel}
      </button>
      <p className="fine">Alerts arrive in-app instantly (SSE). Phone push is wired as a stub until Web Push / FCM keys are added.</p>
    </div>
  );
}
