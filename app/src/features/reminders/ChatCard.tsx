import { useNavigate } from 'react-router-dom';
import { Icon } from '@akaya/ui';
import { useApp } from '../../state/store';
import { whenText } from './format';
import { CatIcon, ReminderMeta } from './parts';
import { useReminders } from './ReminderProvider';

/** Card under Akaya's chat reply for a reminder created from the conversation. */
export function ReminderChatCard({ id }: { id: string }) {
  const { state } = useApp();
  const ui = useReminders();
  const nav = useNavigate();
  const r = state.reminders.find((x) => x.id === id);
  if (!r) return <div className="rm-chat gone">Reminder removed.</div>;
  return (
    <div className="rm-chat">
      <div className="rm-chat-top">
        <CatIcon category={r.category} size={36} />
        <span className="grow">
          <b>{r.title}</b>
          <small>{r.status === 'done' ? 'Done' : whenText(r)}</small>
        </span>
      </div>
      <ReminderMeta r={r} />
      <div className="rm-chat-acts">
        <button className="btn btn-ghost" onClick={() => nav(`/reminders?id=${r.id}`)}>
          <Icon name="alarm" size={14} /> Open
        </button>
        <button className="btn btn-ghost" onClick={() => ui.h.onEdit(r)}>
          <Icon name="edit" size={14} /> Edit
        </button>
        <button className="btn btn-ghost" onClick={() => ui.h.onDelete(r)}>
          <Icon name="trash" size={14} /> Remove
        </button>
      </div>
    </div>
  );
}
