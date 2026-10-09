import { Icon, type IconName } from '../../components/Icon';
import { AppTile } from '../../components/AppTile';
import { APP_BY_ID } from '../../integrations/catalog';
import { humanSize } from '../../lib/media';
import type { Attachment, ChatMode } from '../../state/types';

const KIND_ICON: Record<Attachment['kind'], IconName> = {
  image: 'image',
  video: 'video',
  file: 'file',
  audio: 'mic',
  location: 'location',
  contact: 'contact',
  app: 'apps',
  note: 'note',
  scan: 'scan',
  screen: 'monitor',
  generated: 'wand',
};
const visual = (a: Attachment) => !!a.thumb && ['image', 'video', 'scan', 'screen', 'generated'].includes(a.kind);

/** removable chips/thumbnails above the composer */
export function ComposerChips({
  items,
  modes,
  onRemove,
  onMode,
}: {
  items: Attachment[];
  modes: ChatMode[];
  onRemove: (id: string) => void;
  onMode: (m: ChatMode, on: boolean) => void;
}) {
  if (!items.length && !modes.length) return null;
  return (
    <div className="ax-chips" aria-label="Attachments">
      {modes.map((m) => (
        <span key={m} className={`ax-modechip m-${m}`}>
          <Icon name={m === 'web' ? 'globe' : m === 'deep' ? 'brain' : 'wand'} size={13} />
          {m === 'web' ? 'Web search' : m === 'deep' ? 'Deep think' : 'Create image'}
          <button aria-label={`Turn off ${m}`} onClick={() => onMode(m, false)}>
            <Icon name="close" size={11} strokeWidth={2.6} />
          </button>
        </span>
      ))}
      {items.map((a) =>
        visual(a) ? (
          <span key={a.id} className="ax-thumb" title={a.name}>
            <img src={a.thumb} alt={a.name} />
            {a.kind === 'video' && (
              <span className="ax-play">
                <Icon name="play" size={10} />
              </span>
            )}
            <button className="ax-x" aria-label={`Remove ${a.name}`} onClick={() => onRemove(a.id)}>
              <Icon name="close" size={11} strokeWidth={2.8} />
            </button>
          </span>
        ) : (
          <span key={a.id} className={`ax-chip k-${a.kind}`} title={a.name}>
            {a.kind === 'app' && APP_BY_ID[a.meta ?? ''] ? (
              <AppTile app={APP_BY_ID[a.meta ?? '']} size={22} />
            ) : (
              <span className="ax-ic">
                {a.kind === 'file' ? <em>{a.meta}</em> : <Icon name={KIND_ICON[a.kind]} size={14} />}
              </span>
            )}
            <span className="ax-name">
              <b>{a.name}</b>
              <small>{a.kind === 'file' ? humanSize(a.size) : a.kind === 'app' ? 'App' : (a.meta ?? '')}</small>
            </span>
            <button className="ax-x in" aria-label={`Remove ${a.name}`} onClick={() => onRemove(a.id)}>
              <Icon name="close" size={11} strokeWidth={2.8} />
            </button>
          </span>
        ),
      )}
    </div>
  );
}

/** attachment previews inside a chat bubble */
export function MessageAttachments({ items }: { items: Attachment[] }) {
  const pics = items.filter(visual);
  const rest = items.filter((a) => !visual(a));
  return (
    <div className="ma">
      {pics.length > 0 && (
        <div className={`ma-pics n${Math.min(pics.length, 4)}`}>
          {pics.slice(0, 4).map((a, i) => (
            <span key={a.id} className="ma-pic">
              <img src={a.thumb} alt={a.name} />
              {a.kind === 'video' && (
                <span className="ax-play">
                  <Icon name="play" size={12} />
                </span>
              )}
              {a.kind === 'generated' && <em className="ma-tag">Sample</em>}
              {a.kind === 'scan' && <em className="ma-tag">Scan</em>}
              {i === 3 && pics.length > 4 && <i className="ma-more">+{pics.length - 4}</i>}
            </span>
          ))}
        </div>
      )}
      {rest.map((a) => (
        <div key={a.id} className={`ma-card k-${a.kind}`}>
          {a.kind === 'location' ? (
            <span className="ma-map" aria-hidden="true">
              <Icon name="location" size={20} />
            </span>
          ) : a.kind === 'app' && APP_BY_ID[a.meta ?? ''] ? (
            <AppTile app={APP_BY_ID[a.meta ?? '']} size={34} />
          ) : (
            <span className="ma-ic">
              {a.kind === 'file' ? <em>{a.meta}</em> : <Icon name={KIND_ICON[a.kind]} size={17} />}
            </span>
          )}
          <span className="grow">
            <b>{a.name}</b>
            <small>
              {a.kind === 'file'
                ? `${a.meta} · ${humanSize(a.size)}`
                : a.kind === 'app'
                  ? 'Connected app'
                  : (a.meta ?? '')}
            </small>
            {a.kind === 'audio' && a.thumb && <audio controls src={a.thumb} preload="none" />}
          </span>
        </div>
      ))}
    </div>
  );
}
