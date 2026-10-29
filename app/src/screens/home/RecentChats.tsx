import { useNavigate } from 'react-router-dom';
import { Icon, type IconName } from '@akaya/ui';
import { ScreenState } from '../../components/ScreenState';
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
  if (!chats.length)
    return (
      <ScreenState
        className="rc-empty"
        icon="chat"
        tone="violet"
        title="No chats yet"
        body="Say hi to Akaya. Your latest conversations will show up here."
      >
        <div className="screen-state-actions">
          <button className="btn btn-brand btn-sm" onClick={() => nav('/chat')}>
            Start a chat
          </button>
        </div>
      </ScreenState>
    );
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
