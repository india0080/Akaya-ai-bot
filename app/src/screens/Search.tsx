import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { Icon, type IconName } from '../components/Icon';
import { useApp } from '../state/store';
import './Features.css';

const FEATURES: { t: string; icon: IconName; to: string }[] = [
  { t: 'Floating', icon: 'float', to: '/more' },
  { t: 'Ask Akaya / New chat', icon: 'ask', to: '/chat' },
  { t: 'Voice', icon: 'mic', to: '/voice' },
  { t: 'Translate', icon: 'translate', to: '/translate' },
  { t: 'Read Screen', icon: 'read', to: '/home?sheet=read' },
  { t: 'Future Message', icon: 'future', to: '/future' },
  { t: 'Smart Note', icon: 'note', to: '/notes' },
  { t: 'Agents', icon: 'agent', to: '/home?sheet=agents' },
  { t: 'Explore', icon: 'explore', to: '/home?sheet=explore' },
  { t: 'Instant Loan', icon: 'loan', to: '/home?sheet=loan' },
  { t: 'History', icon: 'history', to: '/history' },
  { t: 'Settings', icon: 'more', to: '/more' },
];

export function Search() {
  const { state } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const k = q.trim().toLowerCase();
  const feats = FEATURES.filter((f) => !k || f.t.toLowerCase().includes(k));
  const chats = k
    ? state.chats.filter(
        (c) => c.title.toLowerCase().includes(k) || c.messages.some((m) => m.text.toLowerCase().includes(k)),
      )
    : [];
  const notes = k ? state.notes.filter((n) => n.text.toLowerCase().includes(k)) : [];
  return (
    <Screen className="feature">
      <ScreenHeader title="Search" />
      <label className="card note-search big">
        <Icon name="search" size={19} className="faint" />
        <input
          autoFocus
          placeholder="Search features, chats and notes"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      {feats.length > 0 && <h4 className="set-h">Features</h4>}
      <div className="card list" style={{ margin: '0 16px' }}>
        {feats.map((f) => (
          <button key={f.t} className="list-row" onClick={() => nav(f.to)}>
            <span className="ri" style={{ color: 'var(--violet)' }}>
              <Icon name={f.icon} size={18} />
            </span>
            <span className="grow">
              <b>{f.t}</b>
            </span>
            <Icon name="chev" size={15} className="faint" />
          </button>
        ))}
      </div>
      {chats.length > 0 && <h4 className="set-h">Chats</h4>}
      {chats.length > 0 && (
        <div className="card list" style={{ margin: '0 16px' }}>
          {chats.map((c) => (
            <button key={c.id} className="list-row" onClick={() => nav(`/chat/${c.id}`)}>
              <span className="ri" style={{ color: 'var(--blue)' }}>
                <Icon name="chat" size={18} />
              </span>
              <span className="grow">
                <b>{c.title}</b>
                <small>{c.messages[c.messages.length - 1]?.text}</small>
              </span>
            </button>
          ))}
        </div>
      )}
      {notes.length > 0 && <h4 className="set-h">Notes</h4>}
      {notes.length > 0 && (
        <div className="card list" style={{ margin: '0 16px' }}>
          {notes.map((n) => (
            <button key={n.id} className="list-row" onClick={() => nav('/notes')}>
              <span className="ri" style={{ color: 'var(--orange)' }}>
                <Icon name="note" size={18} />
              </span>
              <span className="grow">
                <b>{n.text}</b>
              </span>
            </button>
          ))}
        </div>
      )}
      {k && !feats.length && !chats.length && !notes.length && <div className="empty">No results for “{q}”.</div>}
    </Screen>
  );
}
