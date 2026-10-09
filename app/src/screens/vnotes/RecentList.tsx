import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { MODE_BY_ID } from '../../notes/modes';
import { fmtClock, fmtSize } from '../../notes/export';
import { fmtTime } from '../../lib/time';
import type { VoiceNote } from '../../notes/types';

export function RecentList({ notes }: { notes: VoiceNote[] }) {
  const nav = useNavigate();
  if (!notes.length)
    return (
      <div className="card vn-recent-empty">
        <Icon name="wave" size={20} /> Your recordings will appear here.
      </div>
    );
  return (
    <div className="card vn-recent">
      {notes.map((v) => {
        const m = MODE_BY_ID[v.mode];
        return (
          <button key={v.id} className="vn-ri" onClick={() => nav(`/vnotes/${v.id}`)}>
            <span className={`vn-ri-play gi gi-${m.tone}`}>
              <Icon name={m.icon} size={17} />
            </span>
            <span className="grow">
              <b>{v.title}</b>
              <small>
                {new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} ·{' '}
                {fmtTime(v.createdAt)} · {m.short}
              </small>
            </span>
            <span className="vn-ri-r">
              <b>{fmtClock(v.duration)}</b>
              <small>{fmtSize(v.size)}</small>
            </span>
          </button>
        );
      })}
    </div>
  );
}
