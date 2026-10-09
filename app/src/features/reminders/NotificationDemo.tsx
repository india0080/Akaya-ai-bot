import { useEffect, useState } from 'react';
import { Icon, Sheet } from '@akaya/ui';
import { suggestFollowUp, type Reminder } from '@akaya/reminders';
import { fmtWhen } from '@akaya/tz';
import { ensureNotifyPermission, exactAlarmStatus, isNative, requestExactAlarms } from '../../native/notify';
import { CatIcon } from './parts';
import { useNow } from '../../lib/useNow';

const MIN = 60_000;

interface Shade {
  state: string;
  note: string;
  r: Pick<Reminder, 'title' | 'category' | 'priority' | 'due'>;
  body: string;
  actions?: string[];
  ongoing?: boolean;
  faded?: boolean;
}

/**
 * In-app preview of every reminder notification state (how Android shows them), plus real test alerts.
 * The previews are illustrations; "Test in 10 s" schedules a real notification.
 */
export function NotificationDemo({
  open,
  onClose,
  onTest,
}: {
  open: boolean;
  onClose: () => void;
  onTest: (urgent: boolean) => void;
}) {
  const [exact, setExact] = useState<'granted' | 'denied' | 'n/a'>('n/a');
  useEffect(() => {
    if (open) void exactAlarmStatus().then(setExact);
  }, [open]);
  const now = useNow();
  const follow = suggestFollowUp(
    {
      id: 'x',
      title: '',
      category: 'work',
      priority: 'normal',
      due: now - 2 * 3600_000,
      alerts: [0],
      repeat: { kind: 'none' },
      status: 'pending',
      createdAt: now,
      source: 'form',
    },
    now,
  );
  const shades: Shade[] = [
    {
      state: '1 day before',
      note: 'Early alert',
      r: { title: 'Home loan EMI', category: 'finance', priority: 'high', due: now + 86400_000 },
      body: `1 day to go · ${fmtWhen(now + 86400_000)}`,
      actions: ['Done', 'Snooze 10m', 'Reschedule'],
    },
    {
      state: '1 hour before',
      note: 'Early alert',
      r: { title: 'Call Rahul about the invoice', category: 'work', priority: 'normal', due: now + 3600_000 },
      body: `1 h to go · ${fmtWhen(now + 3600_000)}`,
      actions: ['Done', 'Snooze 10m', 'Reschedule'],
    },
    {
      state: 'At time',
      note: 'Normal',
      r: { title: 'Drink water', category: 'health', priority: 'normal', due: now },
      body: 'Due now · Health & Medicine',
      actions: ['Done', 'Snooze 10m', 'Reschedule'],
    },
    {
      state: 'Urgent',
      note: 'Louder channel · stays until you act',
      r: { title: 'Take BP medicine', category: 'health', priority: 'urgent', due: now },
      body: 'Due now · Health & Medicine',
      actions: ['Done', 'Snooze 10m', 'Reschedule'],
      ongoing: true,
    },
    {
      state: 'Snoozed',
      note: 'Rings again',
      r: { title: 'Pay electricity bill ₹1,240', category: 'finance', priority: 'high', due: now + 10 * MIN },
      body: `Snoozed · rings again ${fmtWhen(now + 10 * MIN)}`,
    },
    {
      state: 'Missed',
      note: 'Smart follow-up',
      r: { title: 'Reply to Neha about Friday', category: 'work', priority: 'normal', due: now - 2 * 3600_000 },
      body: `Missed · Akaya suggests: ${follow.label}`,
      actions: ['Remind then', 'Reschedule'],
    },
    {
      state: 'Done',
      note: 'Cleared',
      r: { title: 'Morning exercise', category: 'personal', priority: 'normal', due: now - 3 * 3600_000 },
      body: 'Marked done · streak 5 days',
      faded: true,
    },
  ];
  return (
    <Sheet open={open} onClose={onClose} title="Reminder notifications" height={92}>
      <div className="rm-demo">
        <p className="muted">
          How each state looks on Android. Buttons work right from the notification, even when Akaya is closed.{' '}
          <span className="tag sample-tag">Demo</span>
        </p>
        <div className="rm-demo-try">
          <button
            className="btn btn-primary btn-sm"
            onClick={async () => {
              await ensureNotifyPermission();
              onTest(false);
            }}
          >
            <Icon name="bell" size={15} /> Test in 10 s
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={async () => {
              await ensureNotifyPermission();
              onTest(true);
            }}
          >
            <Icon name="alert" size={15} /> Urgent test
          </button>
        </div>
        {isNative && exact === 'denied' && (
          <button className="card rm-exact" onClick={() => void requestExactAlarms().then(setExact)}>
            <Icon name="alarm" size={18} />
            <span className="grow">
              <b>Allow exact alarms</b>
              <small>So reminders ring on the minute, even in battery saver.</small>
            </span>
            <Icon name="chev" size={15} />
          </button>
        )}
        <div className="rm-shade">
          {shades.map((s) => (
            <div key={s.state} className={`rm-n${s.ongoing ? ' ongoing' : ''}${s.faded ? ' faded' : ''}`}>
              <div className="rm-n-state">
                <b>{s.state}</b>
                <small>{s.note}</small>
              </div>
              <div className="rm-n-card">
                <div className="rm-n-top">
                  <CatIcon category={s.r.category} size={30} />
                  <small className="grow">
                    Akaya · {s.state === 'Missed' ? fmtWhen(s.r.due).split(', ')[1] : 'now'}
                    {s.ongoing ? ' · Ongoing' : ''}
                  </small>
                  {s.r.priority === 'urgent' && <span className="rm-n-urg">URGENT</span>}
                </div>
                <b>{s.r.title}</b>
                <span>{s.body}</span>
                {s.actions && (
                  <div className="rm-n-acts">
                    {s.actions.map((a) => (
                      <i key={a}>{a}</i>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Sheet>
  );
}
