import { useState } from 'react';
import type { Filters, StoreId } from '../api/types';
import { inr, STORE_NAMES } from '../lib/format';
import { RangeSlider, Segmented, Toggle } from '../ui/Controls';
import { Sheet } from '../ui/Sheet';
import { StoreMark } from './bits';

const STORES = Object.keys(STORE_NAMES) as StoreId[];

export function FilterSheet({
  open,
  onClose,
  value,
  onApply,
  ceiling,
}: {
  open: boolean;
  onClose: () => void;
  value: Filters;
  onApply: (f: Filters) => void;
  ceiling: number;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Filters">
      {open && <FilterBody value={value} ceiling={ceiling} onApply={(f) => (onApply(f), onClose())} />}
    </Sheet>
  );
}

function FilterBody({ value, ceiling, onApply }: { value: Filters; ceiling: number; onApply: (f: Filters) => void }) {
  const top = Math.max(1000, Math.ceil(ceiling / 500) * 500);
  const [f, setF] = useState<Filters>(value);
  const set = (p: Partial<Filters>) => setF((c) => ({ ...c, ...p }));
  const stores = f.stores ?? [];
  return (
    <div className="filters">
      <RangeSlider label="Max price" min={200} max={top} step={100} value={Math.min(f.maxPrice ?? top, top)} onChange={(v) => set({ maxPrice: v >= top ? undefined : v })} format={(v) => (v >= top ? 'Any' : inr(v))} />
      <span className="label">Minimum rating</span>
      <Segmented
        value={String(f.minRating ?? 0)}
        onChange={(v) => set({ minRating: Number(v) || undefined })}
        options={[
          { value: '0', label: 'Any' },
          { value: '3.5', label: '3.5★+' },
          { value: '4', label: '4★+' },
          { value: '4.3', label: '4.3★+' },
        ]}
      />
      <span className="label">Delivery</span>
      <Segmented
        value={String(f.maxDeliveryDays ?? 0)}
        onChange={(v) => set({ maxDeliveryDays: Number(v) || undefined })}
        options={[
          { value: '0', label: 'Any' },
          { value: '1', label: 'Tomorrow' },
          { value: '2', label: '≤ 2 days' },
          { value: '5', label: '≤ 5 days' },
        ]}
      />
      <span className="label">Stores {stores.length ? `(${stores.length})` : '(all)'}</span>
      <div className="store-pick">
        {STORES.map((s) => (
          <button key={s} className={`chip${stores.includes(s) ? ' on' : ''}`} onClick={() => set({ stores: stores.includes(s) ? stores.filter((x) => x !== s) : [...stores, s] })}>
            <StoreMark store={s} size={16} /> {STORE_NAMES[s]}
          </button>
        ))}
      </div>
      <div className="list card flat">
        <div className="list-row">
          <div className="grow">
            <b>Hide fake-review risk</b>
            <small>Drops listings with strong fake-review signals</small>
          </div>
          <Toggle label="Hide fake-review risk" on={!!f.hideHighFakeRisk} onChange={(v) => set({ hideHighFakeRisk: v })} />
        </div>
        <div className="list-row">
          <div className="grow">
            <b>In stock only</b>
            <small>Skip sold-out offers</small>
          </div>
          <Toggle label="In stock only" on={!!f.inStockOnly} onChange={(v) => set({ inStockOnly: v })} />
        </div>
      </div>
      <div className="row-btns">
        <button className="btn btn-ghost" onClick={() => setF({})}>
          Reset
        </button>
        <button className="btn btn-brand grow" onClick={() => onApply(f)}>
          Show results
        </button>
      </div>
    </div>
  );
}
