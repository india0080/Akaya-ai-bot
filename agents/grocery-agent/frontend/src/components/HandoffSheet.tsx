import type { Handoff } from '../api/types';
import { inr } from '../lib/format';
import { Icon, Sheet } from '@akaya/ui';
import { StoreMark } from './bits';

/** Confirm screen: hands the filled cart to the store app. The user pays there; Akaya never does. */
export function HandoffSheet({
  handoff,
  onClose,
  onPaid,
}: {
  handoff: Handoff | null;
  onClose: () => void;
  onPaid: () => void;
}) {
  return (
    <Sheet open={!!handoff} onClose={onClose} title="Pay in the store app" height={88}>
      {handoff && (
        <div className="handoff">
          <div className="ho-top">
            <StoreMark store={handoff.store} size={52} />
            <span>
              <small>Amount to pay in {handoff.storeName}</small>
              <b>{inr(handoff.amount)}</b>
            </span>
          </div>
          <ol className="ho-steps">
            {handoff.steps.map((s, i) => (
              <li key={s}>
                <i>{i + 1}</i>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          <a className="btn btn-brand btn-block" href={handoff.appUrl}>
            <Icon name="external" size={16} /> Open {handoff.storeName} app
          </a>
          <a className="btn btn-ghost btn-block" href={handoff.webUrl} target="_blank" rel="noreferrer">
            <Icon name="globe" size={16} /> Open website instead
          </a>
          <div className="ho-sep">
            <span>after paying in the app</span>
          </div>
          <button className="btn btn-outline btn-block" onClick={onPaid}>
            <Icon name="check" size={16} /> I've paid in {handoff.storeName}
          </button>
          <p className="fine">{handoff.note} Tapping “I've paid” only starts order tracking.</p>
        </div>
      )}
    </Sheet>
  );
}
