import { Sheet } from '../../components/Sheet';
import './Sheets.css';
import { Icon, type IconName } from '../../components/Icon';
import { Toggle } from '../../components/Controls';
import { useApp } from '../../state/store';
import { relDay } from '../../lib/time';

export function NotificationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, markAllRead, readNotification, setSetting } = useApp();
  const unread = state.notifications.filter((n) => !n.read).length;
  return (
    <Sheet open={open} onClose={onClose} title="Notifications" height={72}>
      <div className="ns-bar">
        <span className="muted">{unread ? `${unread} unread` : 'You are all caught up'}</span>
        {unread > 0 && (
          <button className="link" onClick={markAllRead}>
            Mark all read
          </button>
        )}
      </div>
      {!state.settings.notifications && (
        <div className="ns-off">
          <Icon name="bell" size={18} />
          <span className="grow">Notifications are off</span>
          <Toggle on={false} onChange={() => setSetting('notifications', true)} label="Turn notifications on" />
        </div>
      )}
      <div className="ns-list">
        {state.notifications.map((n) => (
          <button
            key={n.id}
            className={`list-row ns-row${n.read ? '' : ' unread'}`}
            onClick={() => readNotification(n.id)}
          >
            <span className="ri" style={{ color: 'var(--violet)' }}>
              <Icon name={n.icon as IconName} size={19} />
            </span>
            <span className="grow">
              <b>{n.title}</b>
              <small>{n.body}</small>
            </span>
            <time className="faint rc-time">{relDay(n.at)}</time>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
