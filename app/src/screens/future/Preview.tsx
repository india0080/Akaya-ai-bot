import { AppTile } from '../../components/AppTile';
import { Icon } from '@akaya/ui';
import { APP_BY_ID } from '../../integrations/catalog';
import type { FMChannel } from '../../future/channels';
import { fmtWhen } from '@akaya/tz';
import type { FMMedia } from '../../state/types';

/** How the message will look on each platform (approximate, for review before scheduling). */
export function Preview({
  ch,
  to,
  subject,
  text,
  media,
  when,
  tz,
}: {
  ch: FMChannel;
  to: string;
  subject?: string;
  text: string;
  media?: FMMedia;
  when: number;
  tz: string;
}) {
  const app = APP_BY_ID[ch.appId];
  const over = ch.maxLen && text.length > ch.maxLen;
  const body = ch.maxLen ? text.slice(0, ch.maxLen) : text;
  const img = media?.thumb ? (
    <div className="pv-media">
      <img src={media.thumb} alt="" />
      {media.kind === 'video' && (
        <span className="fmc-play">
          <Icon name="play" size={14} />
        </span>
      )}
    </div>
  ) : media ? (
    <div className="pv-media ph">
      <Icon name={media.kind === 'video' ? 'video' : 'image'} size={22} />
    </div>
  ) : null;
  const time = Number.isNaN(when) ? '' : fmtWhen(when, tz);

  return (
    <div className={`card pv pv-${ch.kind} pv-${ch.id}`}>
      <div className="pv-h">
        {app && <AppTile app={app} size={22} />}
        <b>{ch.label}</b>
        <small>{time}</small>
      </div>
      {ch.kind === 'email' ? (
        <div className="pv-mail">
          <div>
            <small>To</small> {to}
          </div>
          <div>
            <small>Subject</small> {subject || '(no subject)'}
          </div>
          {img}
          <p>{body}</p>
        </div>
      ) : ch.kind === 'chat' ? (
        <div className="pv-chat">
          <small className="pv-to">{to}</small>
          {img}
          {body && <div className="pv-bub">{body}</div>}
        </div>
      ) : (
        <div className="pv-post">
          <div className="pv-acct">
            <span className="fm-av">{to[0] ?? 'A'}</span>
            <b>{to}</b>
          </div>
          {img}
          {ch.id === 'youtube' ? (
            <p>
              <b>{body.split('\n')[0].slice(0, 100) || 'Untitled video'}</b>
            </p>
          ) : (
            <p>{body}</p>
          )}
        </div>
      )}
      {over && <em className="pv-warn">Trimmed to {ch.maxLen} characters</em>}
      {ch.needsMedia && !media && (
        <em className="pv-warn">Needs {ch.needsMedia === 'video' ? 'a video' : 'an image or video'}</em>
      )}
    </div>
  );
}
