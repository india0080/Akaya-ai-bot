import type { CSSProperties } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Icon, type IconName } from './Icon';
import './BottomNav.css';

const LEFT: { to: string; label: string; icon: IconName }[] = [
  { to: '/home', label: 'Home', icon: 'home' },
  { to: '/chat', label: 'Chat', icon: 'chat' },
];
const RIGHT: { to: string; label: string; icon: IconName }[] = [
  { to: '/history', label: 'History', icon: 'history' },
  { to: '/more', label: 'More', icon: 'more' },
];
const BARS = [0.45, 0.75, 1, 0.6, 0.9, 0.7, 0.4];

function Tab({ to, label, icon }: { to: string; label: string; icon: IconName }) {
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

/** Floating tab bar: Home | Chat | [Voice orb] | History | More. The orb opens Voice. */
export function BottomNav() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const live = pathname.startsWith('/voice');
  return (
    <>
      <div className="nav-fade" />
      <nav className="bottom-nav" aria-label="Main">
        {LEFT.map((t) => (
          <Tab key={t.to} {...t} />
        ))}
        <div className="nav-orb-slot">
          <button
            className={`nav-orb${live ? ' is-live' : ''}`}
            onClick={() => nav('/voice')}
            aria-label="Voice: talk to Akaya"
            aria-current={live ? 'page' : undefined}
          >
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
        {RIGHT.map((t) => (
          <Tab key={t.to} {...t} />
        ))}
      </nav>
    </>
  );
}
