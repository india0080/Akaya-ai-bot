import { useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '@akaya/ui';
import { useApp } from '../../state/store';
import { relDay } from '../../lib/time';

const iconFor = (title: string): [IconName, string] =>
  /translat|hindi|english/i.test(title)
    ? ['translate', 'var(--green-text)']
    : /list|note/i.test(title)
      ? ['note', 'var(--orange)']
      : ['ask', 'var(--violet)'];

export function RecentChats() {
  const { state } = useApp();
  const nav = useNavigate();
  const chats = state.chats.filter((c) => c.messages.length).slice(0, 3);
  if (!chats.length) return <div className="card list empty">No chats yet. Say hi to Akaya!</div>;
  return (
    <div className="card list">
      {chats.map((c) => {
        const [ic, col] = iconFor(c.title);
        const last = c.messages[c.messages.length - 1];
        return (
          <button key={c.id} className="list-row" onClick={() => nav(`/chat/${c.id}`)}>
            <span className="ri" style={{ color: col }}>
              <Icon name={ic} size={19} />
            </span>
            <span className="grow">
              <b>{c.title}</b>
              <small>{last?.text}</small>
            </span>
            <time className="faint rc-time">{relDay(c.updatedAt)}</time>
          </button>
        );
      })}
    </div>
  );
}
