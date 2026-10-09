import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';

/** Header for pushed screens (Translate, Notes, …) with a back button. */
export function ScreenHeader({ title, right, sub }: { title: ReactNode; right?: ReactNode; sub?: ReactNode }) {
  const nav = useNavigate();
  return (
    <header className="screen-header">
      <button
        className="icon-btn card"
        onClick={() => (window.history.length > 1 ? nav(-1) : nav('/home'))}
        aria-label="Back"
      >
        <Icon name="back" size={20} />
      </button>
      <div className="sh-title">
        <h2>{title}</h2>
        {sub && <small>{sub}</small>}
      </div>
      <div className="sh-right">{right}</div>
    </header>
  );
}
