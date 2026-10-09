import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, Icon, type IconName } from '@akaya/ui';
import { Logo } from '../../components/Logo';
import { DemoBadge } from './AuthBits';
import '../SignUp.css';
import './Auth.css';

/** Shared frame for Log in / Verify / Forgot password. */
export function AuthLayout({
  icon,
  tone = 'violet',
  title,
  sub,
  back = '/signup',
  children,
}: {
  icon: IconName;
  tone?: 'violet' | 'orange' | 'green' | 'blue';
  title: string;
  sub: ReactNode;
  back?: string;
  children: ReactNode;
}) {
  const nav = useNavigate();
  return (
    <Screen className="signup auth">
      <header className="au-head">
        <button className="icon-btn card" onClick={() => nav(back, { replace: true })} aria-label="Back">
          <Icon name="back" size={20} />
        </button>
        <Logo size={20} />
        <span style={{ width: 40 }} />
      </header>
      <div className="au-hero">
        <span className={`au-icon gi gi-${tone}`}>
          <Icon name={icon} size={30} strokeWidth={2} />
        </span>
      </div>
      <h1 className="su-h1">{title}</h1>
      <p className="su-sub">{sub}</p>
      <DemoBadge />
      {children}
    </Screen>
  );
}
