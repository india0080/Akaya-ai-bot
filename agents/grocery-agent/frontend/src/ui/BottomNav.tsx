import type { CSSProperties } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Icon, type IconName } from './Icon';
import './BottomNav.css';

export interface NavTab {
  to: string;
  label: string;
  icon: IconName;
}
const BARS = [0.45, 0.75, 1, 0.6, 0.9, 0.7, 0.4];

function Tab({ to, label, icon }: NavTab) {
  return (
    <NavLink to={to} className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
      {({ isActive }) => (
        <>
          <span className="nav-ic">
            <Icon name={icon} size={24} fill={isActive} strokeWidth={isActive ? 2.1 : 1.8} />
          </span>
          <span className="nav-lb">{label}</span>
        </>
      )}
    </NavLink>
  );
}

/** Akaya floating tab bar: two tabs | glowing voice orb | two tabs (same style as the main app). */
export function BottomNav({
  left,
  right,
  onOrb,
  orbLabel,
  orbLive,
}: {
  left: NavTab[];
  right: NavTab[];
  onOrb: () => void;
  orbLabel: string;
  orbLive?: boolean;
}) {
  useLocation();
  return (
    <>
      <div className="nav-fade" />
      <nav className="bottom-nav" aria-label="Main">
        {left.map((t) => (
          <Tab key={t.to} {...t} />
        ))}
        <div className="nav-orb-slot">
          <button className={`nav-orb${orbLive ? ' is-live' : ''}`} onClick={onOrb} aria-label={orbLabel}>
            <span className="orb-halo" />
            <span className="orb-ring" />
            <span className="orb-core">
              <span className="orb-gloss" />
              <span className="orb-wave" aria-hidden="true">
                {BARS.map((h, i) => (
                  <i key={i} style={{ '--h': h, '--d': `${i * -0.13}s` } as CSSProperties} />
                ))}
              </span>
            </span>
          </button>
        </div>
        {right.map((t) => (
          <Tab key={t.to} {...t} />
        ))}
      </nav>
    </>
  );
}
