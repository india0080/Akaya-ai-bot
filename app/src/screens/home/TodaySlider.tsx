import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@akaya/ui';
import { useApp } from '../../state/store';
import { SnapSlider } from './SnapSlider';
import { todayCards } from './todayCards';
import { useNow } from '../../lib/useNow';

/** Home "Today": swipeable cards (reminders, calendar, follow-ups, health, bills, dates, habits, future messages, missed). */
export function TodaySlider() {
  const { state } = useApp();
  const nav = useNavigate();
  const now = useNow(60_000);
  const cards = useMemo(() => todayCards(state, now), [state, now]);
  return (
    <SnapSlider labels={cards.map((c) => c.label)} className="today-slider">
      {cards.map((c) => (
        <button key={c.id} className={`card tdy t-${c.tone}`} onClick={() => nav(c.to)}>
          <span className="tdy-top">
            <span className="tdy-ic">
              <Icon name={c.icon} size={18} />
            </span>
            <b>{c.label}</b>
          </span>
          <span className="tdy-n">
            {c.count}
            <small>{c.unit}</small>
            {c.badge && (
              <span className="tdy-badge">
                <Icon name="flame" size={11} /> {c.badge}
              </span>
            )}
          </span>
          {c.progress !== undefined && (
            <span className="tdy-bar">
              <i style={{ width: `${Math.round(c.progress * 100)}%` }} />
            </span>
          )}
          <span className="tdy-items">
            {c.items.length ? (
              c.items.map((it, i) => (
                <span key={i}>
                  <em>{it.title}</em>
                  <small>{it.sub}</small>
                </span>
              ))
            ) : (
              <span className="tdy-empty">{c.empty}</span>
            )}
          </span>
          <span className="tdy-go">
            Open <Icon name="chev" size={12} strokeWidth={2.6} />
          </span>
        </button>
      ))}
    </SnapSlider>
  );
}
