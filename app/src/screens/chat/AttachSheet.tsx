import { Sheet, Icon, type IconName, Toggle } from '@akaya/ui';
import type { ChatMode } from '../../state/types';

export type PickKind =
  | 'camera'
  | 'photos'
  | 'files'
  | 'scan'
  | 'screen'
  | 'voice'
  | 'location'
  | 'contact'
  | 'apps'
  | 'notes'
  | 'image'
  | 'schedule';

const TILES: { k: PickKind; icon: IconName; label: string; sub: string; tone: string }[] = [
  { k: 'camera', icon: 'camera', label: 'Camera', sub: 'Take a photo', tone: 'gi-blue' },
  { k: 'photos', icon: 'image', label: 'Photos', sub: 'Gallery & videos', tone: 'gi-pink' },
  { k: 'files', icon: 'file', label: 'Files', sub: 'PDF, DOCX, XLSX…', tone: 'gi-violet' },
  { k: 'scan', icon: 'scan', label: 'Scan', sub: 'Document', tone: 'gi-cyan' },
  { k: 'screen', icon: 'monitor', label: 'Read screen', sub: 'Screenshot', tone: 'gi-orange' },
  { k: 'voice', icon: 'mic', label: 'Voice note', sub: 'Record audio', tone: 'gi-green' },
  { k: 'location', icon: 'location', label: 'Location', sub: 'Share where', tone: 'gi-pink' },
  { k: 'contact', icon: 'contact', label: 'Contact', sub: 'Share a card', tone: 'gi-blue' },
  { k: 'apps', icon: 'apps', label: 'Apps', sub: 'Integrations', tone: 'gi-violet' },
  { k: 'notes', icon: 'note', label: 'Smart Notes', sub: 'Add a note', tone: 'gi-orange' },
  { k: 'image', icon: 'wand', label: 'Create image', sub: 'Describe it', tone: 'gi-cyan' },
  { k: 'schedule', icon: 'future', label: 'Schedule', sub: 'Future Message', tone: 'gi-green' },
];

export function AttachSheet({
  open,
  onClose,
  onPick,
  modes,
  onMode,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (k: PickKind) => void;
  modes: ChatMode[];
  onMode: (m: ChatMode, on: boolean) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Add to your message" height={88}>
      <div className="ax-grid">
        {TILES.map((t) => (
          <button
            key={t.k}
            className={`ax-tile${t.k === 'image' && modes.includes('image') ? ' on' : ''}`}
            onClick={() => onPick(t.k)}
            data-k={t.k}
          >
            <span className={`gi ${t.tone}`}>
              <Icon name={t.icon} size={21} />
            </span>
            <b>{t.label}</b>
            <small>{t.sub}</small>
          </button>
        ))}
      </div>
      <div className="card ax-modes">
        <div className="ax-mode">
          <span className="gi gi-blue">
            <Icon name="globe" size={18} />
          </span>
          <span className="grow">
            <b>Web search</b>
            <small>Look things up online for this message</small>
          </span>
          <Toggle on={modes.includes('web')} onChange={(v) => onMode('web', v)} label="Web search" />
        </div>
        <div className="ax-mode">
          <span className="gi gi-violet">
            <Icon name="brain" size={18} />
          </span>
          <span className="grow">
            <b>Deep think</b>
            <small>Slower, more careful answers</small>
          </span>
          <Toggle on={modes.includes('deep')} onChange={(v) => onMode('deep', v)} label="Deep think" />
        </div>
      </div>
    </Sheet>
  );
}
