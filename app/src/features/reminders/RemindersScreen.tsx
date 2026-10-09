import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Icon, type IconName, Screen, ScreenHeader, Segmented, Toggle } from '@akaya/ui';
import {
  CATEGORIES,
  CATEGORY_BY_ID,
  countByView,
  effectiveDue,
  filterReminders,
  PRIORITIES,
  sortReminders,
  suggestFollowUp,
  templateDue,
  type CategoryId,
  type Priority,
  type ReminderView,
  type SortMode,
} from '@akaya/reminders';
import { epochToZoned, fmtWhen } from '@akaya/tz';
import { useApp } from '../../state/store';
import { ReminderRow } from './parts';
import { useReminders } from './ReminderProvider';
import { useNow } from '../../lib/useNow';

const TZ = 'Asia/Kolkata';
const VIEWS: ReminderView[] = ['upcoming', 'completed', 'missed'];

/** IST day heading for grouping: "Today" / "Tomorrow" / "Sat, 11 Oct" (fmtWhen without the time) */
function dayHeading(ts: number, now: number): string {
  const w = fmtWhen(ts, TZ, now);
  return w.slice(0, w.lastIndexOf(', '));
}

/**
 * Reminders dashboard: Upcoming / Completed / Missed, category + priority filters, search, sort.
 * Query params (used by the Home Today slider, chat cards and notifications):
 *   view, category, priority, q, day=today, id (open detail), reschedule=1, new=1, text
 */
export function RemindersScreen() {
  const { state, setSetting } = useApp();
  const ui = useReminders();
  const [params, setParams] = useSearchParams();
  const view = (VIEWS.includes(params.get('view') as ReminderView) ? params.get('view') : 'upcoming') as ReminderView;
  const category = (params.get('category') ?? 'all') as CategoryId | 'all';
  const priority = (params.get('priority') ?? 'all') as Priority | 'all';
  const day = params.get('day');
  const [q, setQ] = useState(params.get('q') ?? '');
  const [sort, setSort] = useState<SortMode>('time');
  const now = useNow();

  const set = (k: string, v: string | null) =>
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        if (v === null || v === 'all') n.delete(k);
        else n.set(k, v);
        return n;
      },
      { replace: true },
    );

  // deep links: open a reminder, the composer, or reschedule (then clear the one-shot params)
  useEffect(() => {
    const id = params.get('id');
    const isNew = params.get('new');
    if (!id && !isNew) return;
    if (id) ui.openDetail(id, params.get('reschedule') === '1');
    if (isNew)
      ui.compose({ text: params.get('text') ?? undefined, category: category === 'all' ? undefined : category });
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        ['id', 'reschedule', 'new', 'text'].forEach((k) => n.delete(k));
        return n;
      },
      { replace: true },
    );
  }, [params, setParams, ui, category]);

  const base = useMemo(
    () =>
      filterReminders(
        state.reminders,
        { category, priority, q, date: day === 'today' ? epochToZoned(now, TZ).date : undefined },
        now,
      ),
    [state.reminders, category, priority, q, day, now],
  );
  const counts = countByView(base, now);
  const list = sortReminders(
    base.filter((r) => filterReminders([r], { view }, now).length),
    view,
    sort,
  );
  const groups: [string, typeof list][] = [];
  for (const r of list) {
    const h =
      view === 'upcoming'
        ? dayHeading(effectiveDue(r), now)
        : view === 'completed'
          ? dayHeading(r.doneAt ?? r.due, now)
          : dayHeading(r.due, now);
    const g = groups.at(-1);
    if (sort === 'time' && g && g[0] === h) g[1].push(r);
    else if (sort === 'priority' && groups.length) groups[0][1].push(r);
    else groups.push([sort === 'priority' ? 'By priority' : h, [r]]);
  }
  const cat = category === 'all' ? null : CATEGORY_BY_ID[category];

  return (
    <Screen className="rm-screen">
      <ScreenHeader
        title="Reminders"
        sub={cat ? cat.label : day === 'today' ? 'Due today · IST' : 'Never miss a thing · IST'}
        right={
          <button className="icon-btn card" aria-label="Notification states (demo)" onClick={ui.openDemo}>
            <Icon name="bell" size={19} />
          </button>
        }
      />
      <div className="card rm-search">
        <Icon name="search" size={18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search reminders"
          aria-label="Search reminders"
        />
        {q && (
          <button aria-label="Clear search" onClick={() => setQ('')}>
            <Icon name="close" size={15} />
          </button>
        )}
      </div>
      <div className="pad-x">
        <Segmented<ReminderView>
          className="full rm-tabs"
          value={view}
          onChange={(v) => set('view', v === 'upcoming' ? null : v)}
          options={VIEWS.map((v) => ({ value: v, label: `${v[0].toUpperCase()}${v.slice(1)} ${counts[v]}` }))}
        />
      </div>
      <div className="chips rm-filter">
        <button className={`chip${category === 'all' ? ' on' : ''}`} onClick={() => set('category', null)}>
          All
        </button>
        {CATEGORIES.filter((c) => c.id !== 'general').map((c) => (
          <button key={c.id} className={`chip${category === c.id ? ' on' : ''}`} onClick={() => set('category', c.id)}>
            <Icon name={c.icon as IconName} size={13} />
            {c.label}
          </button>
        ))}
      </div>
      <div className="rm-filter2">
        <div className="chips">
          {[{ id: 'all' as const, label: 'Any priority', color: 'var(--text-3)' }, ...PRIORITIES].map((p) => (
            <button
              key={p.id}
              className={`chip rm-pchip${priority === p.id ? ' on' : ''}`}
              style={{ '--pc': p.color } as React.CSSProperties}
              onClick={() => set('priority', p.id)}
            >
              {p.id !== 'all' && <i />}
              {p.label}
            </button>
          ))}
        </div>
        <button
          className="rm-sort"
          onClick={() => setSort(sort === 'time' ? 'priority' : 'time')}
          aria-label="Change sort"
        >
          <Icon name="sort" size={14} /> {sort === 'time' ? 'Time' : 'Priority'}
        </button>
      </div>
      {day === 'today' && (
        <button className="chip on rm-day" onClick={() => set('day', null)}>
          Today only <Icon name="close" size={12} />
        </button>
      )}

      {view === 'missed' && (
        <div className="card rm-auto">
          <Icon name="spark" size={18} />
          <span className="grow">
            <b>Smart follow-up</b>
            <small>
              {state.settings.autoFollowUp
                ? 'Akaya re-schedules missed reminders for you.'
                : 'Akaya suggests a new time for each missed reminder.'}
            </small>
          </span>
          <Toggle
            on={state.settings.autoFollowUp}
            onChange={(v) => setSetting('autoFollowUp', v)}
            label="Auto follow-up"
          />
        </div>
      )}

      <div className="rm-list">
        {groups.map(([h, rs]) => (
          <section key={`${view}-${sort}-${h}`}>
            <h4>{h}</h4>
            {rs.map((r) => {
              const f = view === 'missed' ? suggestFollowUp(r, now) : null;
              const followed = state.reminders.some((x) => x.followUpOf === r.id && x.status === 'pending');
              return (
                <ReminderRow
                  key={r.id}
                  r={r}
                  now={now}
                  onOpen={() => ui.openDetail(r.id)}
                  onDone={() => ui.h.onDone(r)}
                  extra={
                    f && (
                      <div className="rm-suggest">
                        <Icon name="spark" size={13} />
                        {followed ? (
                          <span className="grow">Follow-up scheduled</span>
                        ) : (
                          <>
                            <span className="grow">
                              Remind again: <b>{f.label}</b>?
                            </span>
                            <button onClick={() => ui.h.onFollowUp(r, f.due)}>Yes</button>
                            <button onClick={() => ui.openDetail(r.id, true)}>Pick time</button>
                          </>
                        )}
                      </div>
                    )
                  }
                />
              );
            })}
          </section>
        ))}
        {!list.length && (
          <div className="empty rm-empty">
            <Icon name={view === 'missed' ? 'check' : 'alarm'} size={28} />
            {view === 'missed'
              ? 'Nothing missed. Nice!'
              : view === 'completed'
                ? 'Nothing completed yet.'
                : q
                  ? 'No reminders match.'
                  : 'No reminders here yet.'}
          </div>
        )}
      </div>

      <div className="sec-head">
        <h3>Quick add</h3>
      </div>
      <div className="rm-quick">
        {(cat ? [cat] : CATEGORIES.filter((c) => c.templates.length)).flatMap((c) =>
          c.templates.slice(0, cat ? 4 : 1).map((t) => (
            <button
              key={`${c.id}-${t.title}`}
              className="card rm-q"
              onClick={() =>
                void ui.add({
                  title: t.title,
                  category: c.id,
                  priority: t.priority,
                  due: templateDue(t.time, Date.now(), t.inDays),
                  alerts: t.alerts,
                  repeat: t.repeat,
                  source: 'template',
                })
              }
            >
              <span className={`gi gi-${c.tone}`}>
                <Icon name={c.icon as IconName} size={16} />
              </span>
              <b>{t.title}</b>
              <small>{fmtWhen(templateDue(t.time, now, t.inDays), TZ, now).replace(' IST', '')}</small>
            </button>
          )),
        )}
      </div>
      <p className="fine pad-x">Times in IST. Reminders marked Sample are demo data; delete them any time.</p>

      <button
        className="rm-fab"
        aria-label="New reminder"
        onClick={() => ui.compose({ category: category === 'all' ? undefined : category })}
      >
        <Icon name="plus" size={26} strokeWidth={2.4} />
      </button>
    </Screen>
  );
}
