import type { ReactNode } from 'react';
import { Icon, type IconName } from '@akaya/ui';
import './ScreenState.css';

/** Empty, loading, and blocked panels for Home, Chat, and Voice. */
export function ScreenState({
  icon,
  title,
  body,
  busy,
  tone = 'orange',
  children,
  className = '',
}: {
  icon?: IconName;
  title?: string;
  body?: string;
  busy?: boolean;
  tone?: 'orange' | 'violet';
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`card screen-state${className ? ` ${className}` : ''}`} role="status">
      {busy ? (
        <span className="screen-state-spin" aria-hidden="true" />
      ) : icon ? (
        <span className={`screen-state-ic tone-${tone}`} aria-hidden="true">
          <Icon name={icon} size={22} />
        </span>
      ) : null}
      {title ? <b>{title}</b> : null}
      {body ? <p>{body}</p> : null}
      {children}
    </div>
  );
}
