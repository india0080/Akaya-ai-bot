import { useMemo, useState } from 'react';
import { Sheet } from '../../components/Sheet';
import { Icon } from '../../components/Icon';
import { AppTile } from '../../components/AppTile';
import { APP_BY_ID } from '../../integrations/catalog';
import { AUTO_LABEL, CHANNELS, CHANNEL_BY_ID, channelIssues, type FMChannel } from '../../future/channels';
import { ZONES, epochToZoned, fmtWhen, zonedToEpoch } from '../../future/tz';
import { fileThumb, humanSize, pickFiles } from '../../lib/media';
import type { FMMedia, FMRepeat, FutureMessage } from '../../state/types';
import { Preview } from './Preview';

export type Draft = Omit<FutureMessage, 'id' | 'status'>;

const SAMPLE_PEOPLE = ['Priya', 'Rahul', 'Neha'];
const REPEATS: { id: FMRepeat; label: string }[] = [
  { id: 'once', label: 'Once' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Birthday · yearly' },
];

function quickTimes(tz: string, now: number) {
  const today = epochToZoned(now, tz).date;
  const tomorrow = epochToZoned(now + 86400000, tz).date;
  const tonight = zonedToEpoch(today, '21:00', tz);
  return [
    { label: 'In 1 min (demo)', at: now + 60_000 },
    { label: 'Tonight 9 PM', at: tonight > now ? tonight : zonedToEpoch(tomorrow, '21:00', tz) },
    { label: 'Tomorrow 9 AM', at: zonedToEpoch(tomorrow, '09:00', tz) },
    { label: 'Midnight', at: zonedToEpoch(tomorrow, '00:00', tz) },
  ];
}

interface Props {
  open: boolean;
  /** message being edited, or null for a new one */
  initial: FutureMessage | null;
  /** epoch ms used for defaults and validation (from the parent's clock) */
  now: number;
  onClose: () => void;
  onSave: (d: Draft) => void;
}

export function Composer({ open, initial, now, onClose, onSave }: Props) {
  const [channels, setChannels] = useState<string[]>(initial?.channels ?? ['whatsapp']);
  const [to, setTo] = useState(initial?.to ?? 'Priya');
  const [subject, setSubject] = useState(initial?.subject ?? '');
  const [text, setText] = useState(initial?.text ?? '');
  const [media, setMedia] = useState<FMMedia | undefined>(initial?.media);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [tz, setTz] = useState(initial?.tz ?? 'Asia/Kolkata');
  const start = epochToZoned(initial?.when ?? now + 3_600_000, tz);
  const [date, setDate] = useState(start.date);
  const [time, setTime] = useState(start.time);
  const [repeat, setRepeat] = useState<FMRepeat>(initial?.repeat ?? 'once');
  const [touched, setTouched] = useState(false);

  const when = date && time ? zonedToEpoch(date, time, tz) : NaN;
  const selected = channels.map((c) => CHANNEL_BY_ID[c]).filter(Boolean) as FMChannel[];
  const hasEmail = selected.some((c) => c.kind === 'email');
  const onlyPosts = selected.length > 0 && selected.every((c) => c.kind === 'post');
  const limit = Math.min(...selected.map((c) => c.maxLen ?? Infinity));
  const issues = useMemo(() => selected.flatMap((c) => channelIssues(c, text, media)), [selected, text, media]);
  const errors = [
    ...(selected.length ? [] : ['Pick at least one channel']),
    ...(to.trim() ? [] : [onlyPosts ? 'Choose the account or page' : 'Add a recipient']),
    ...(text.trim() || media ? [] : ['Write a message']),
    ...(Number.isNaN(when) || when <= now ? ['Pick a time in the future'] : []),
    ...issues,
  ];

  const toggle = (id: string) => {
    setChannels((cs) => {
      const next = cs.includes(id) ? cs.filter((c) => c !== id) : [...cs, id];
      // posts default to "My account"; messages to a person
      const allPosts = next.length > 0 && next.every((c) => CHANNEL_BY_ID[c]?.kind === 'post');
      if (allPosts && SAMPLE_PEOPLE.includes(to)) setTo('My account');
      if (!allPosts && to === 'My account') setTo('Priya');
      return next;
    });
  };

  const addMedia = async () => {
    const [f] = await pickFiles('image/*,video/*', false);
    if (!f) return;
    setLoadingMedia(true);
    const thumb = await fileThumb(f, 480);
    setMedia({ kind: f.type.startsWith('video/') ? 'video' : 'image', name: f.name, size: f.size, thumb });
    setLoadingMedia(false);
  };

  const group = (kind: 'msg' | 'post') =>
    CHANNELS.filter((c) => (kind === 'post' ? c.kind === 'post' : c.kind !== 'post')).map((c) => {
      const app = APP_BY_ID[c.appId];
      const on = channels.includes(c.id);
      return (
        <button
          key={c.id}
          className={`fmc-ch${on ? ' on' : ''}`}
          onClick={() => toggle(c.id)}
          aria-pressed={on}
          data-ch={c.id}
        >
          {app && <AppTile app={app} size={26} />}
          <span>{c.label}</span>
          {on && <Icon name="check" size={12} strokeWidth={3} />}
        </button>
      );
    });

  return (
    <Sheet open={open} onClose={onClose} title={initial ? 'Edit scheduled message' : 'New Future Message'} height={94}>
      <div className="fmc">
        <span className="label">Send on</span>
        <small className="fmc-sub">Chats &amp; email</small>
        <div className="fmc-chs">{group('msg')}</div>
        <small className="fmc-sub">Social posts</small>
        <div className="fmc-chs">{group('post')}</div>
        {selected.length > 0 && (
          <ul className="fmc-notes">
            {selected.map((c) => (
              <li key={c.id}>
                <b>{c.label}</b>
                <em className={`fmc-auto a-${c.auto}`}>{AUTO_LABEL[c.auto]}</em>
                <span>{c.note}</span>
              </li>
            ))}
          </ul>
        )}

        <label className="fmc-field">
          <span className="label">{onlyPosts ? 'Account or page' : (selected[0]?.recipient ?? 'To')}</span>
          <input
            className="input"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Name, number, email or @handle"
          />
        </label>
        <div className="fmc-people">
          {(onlyPosts ? ['My account', 'Akaya Studio page'] : SAMPLE_PEOPLE).map((p) => (
            <button key={p} className={`fmc-p${to === p ? ' on' : ''}`} onClick={() => setTo(p)}>
              <span className="fm-av">{p[0]}</span>
              {p}
            </button>
          ))}
          <small className="faint">sample</small>
        </div>

        {hasEmail && (
          <label className="fmc-field">
            <span className="label">Subject</span>
            <input
              className="input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
            />
          </label>
        )}

        <label className="fmc-field">
          <span className="label">
            {onlyPosts ? 'Caption' : 'Message'}
            {Number.isFinite(limit) && (
              <i className={`fmc-count${text.length > limit ? ' over' : ''}`}>
                {text.length}/{limit}
              </i>
            )}
          </span>
          <textarea
            className="input"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={onlyPosts ? 'Write your caption… #hashtags' : `Write something for ${to || 'them'}…`}
          />
        </label>

        <div className="fmc-media">
          {media ? (
            <div className="fmc-mprev">
              {media.thumb ? (
                <img src={media.thumb} alt="" />
              ) : (
                <span className="fmc-mph">
                  <Icon name={media.kind === 'video' ? 'video' : 'image'} size={22} />
                </span>
              )}
              {media.kind === 'video' && (
                <span className="fmc-play">
                  <Icon name="play" size={14} />
                </span>
              )}
              <div className="grow">
                <b>{media.name}</b>
                <small>
                  {media.kind === 'video' ? 'Video' : 'Image'} · {humanSize(media.size)}
                </small>
              </div>
              <button className="icon-btn" onClick={() => setMedia(undefined)} aria-label="Remove media">
                <Icon name="close" size={16} />
              </button>
            </div>
          ) : (
            <button className="fmc-add" onClick={addMedia} disabled={loadingMedia}>
              <Icon name="image" size={18} /> {loadingMedia ? 'Preparing preview…' : 'Add photo or video'}
            </button>
          )}
        </div>

        <span className="label">When</span>
        <div className="fmc-quick">
          {quickTimes(tz, now).map((q) => (
            <button
              key={q.label}
              onClick={() => {
                const z = epochToZoned(q.at, tz);
                setDate(z.date);
                setTime(z.time);
              }}
            >
              {q.label}
            </button>
          ))}
        </div>
        <div className="fm-when">
          <label>
            <span className="label">Date</span>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            <span className="label">Time</span>
            <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>
        <label className="fmc-field">
          <span className="label">Time zone</span>
          <select className="input" value={tz} onChange={(e) => setTz(e.target.value)}>
            {ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label}
              </option>
            ))}
          </select>
        </label>
        <span className="label">Repeat</span>
        <div className="fmc-rep">
          {REPEATS.map((r) => (
            <button key={r.id} className={repeat === r.id ? 'on' : ''} onClick={() => setRepeat(r.id)}>
              {r.label}
            </button>
          ))}
        </div>
        {!Number.isNaN(when) && (
          <p className="fmc-whenline">
            <Icon name="clock" size={14} /> Sends {fmtWhen(when, tz, now)}
            {tz !== 'Asia/Kolkata' && <> · {fmtWhen(when, 'Asia/Kolkata', now)}</>}
            {repeat !== 'once' && <> · repeats {repeat === 'yearly' ? 'every year' : repeat}</>}
          </p>
        )}

        {selected.length > 0 && (text || media) && (
          <>
            <span className="label">Preview</span>
            <div className="fmc-previews">
              {selected.map((c) => (
                <Preview key={c.id} ch={c} to={to} subject={subject} text={text} media={media} when={when} tz={tz} />
              ))}
            </div>
          </>
        )}

        {touched && errors.length > 0 && (
          <ul className="fmc-errs" role="alert">
            {errors.map((e) => (
              <li key={e}>
                <Icon name="alert" size={14} /> {e}
              </li>
            ))}
          </ul>
        )}
        <button
          className="btn btn-primary btn-block fmc-save"
          onClick={() => {
            setTouched(true);
            if (errors.length) return;
            onSave({
              channels,
              to: to.trim(),
              subject: hasEmail ? subject.trim() : undefined,
              text: text.trim(),
              media,
              when,
              tz,
              repeat,
              attempts: 0,
              createdAt: initial?.createdAt,
            });
          }}
        >
          <Icon name="future" size={17} /> {initial ? 'Save changes' : 'Schedule'}
        </button>
        <p className="fmc-demo">
          Demo mode: Akaya simulates the send at the chosen time and notifies you. Real sending runs on the Future
          Message service once the channel is connected.
        </p>
      </div>
    </Sheet>
  );
}
