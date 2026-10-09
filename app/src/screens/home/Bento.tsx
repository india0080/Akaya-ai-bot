import { useNavigate } from 'react-router-dom';
import { Pearl } from '../../components/Pearl';
import { Icon, type IconName } from '../../components/Icon';
import { Toggle } from '../../components/Controls';
import { useToast } from '../../components/Toast';
import { useApp } from '../../state/store';

function Tile({
  icon,
  tone,
  title,
  sub,
  onClick,
  className = '',
}: {
  icon: IconName;
  tone: string;
  title: string;
  sub?: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button className={`card b-tile ${className}`} onClick={onClick}>
      <span className={`gi gi-${tone}`}>
        <Icon name={icon} size={19} strokeWidth={2} />
      </span>
      <span className="b-txt">
        <b>{title}</b>
        {sub && <small>{sub}</small>}
      </span>
    </button>
  );
}

/** Home quick actions: design E (bento). Voice opens from the mic in the Ask bar above. */
export function Bento({ onReadScreen }: { onReadScreen: () => void }) {
  const { state, setSetting } = useApp();
  const nav = useNavigate();
  const toast = useToast();
  const on = state.settings.floating;
  const setFloating = (v: boolean) => {
    setSetting('floating', v);
    toast(v ? 'Floating ON · Akaya will float over your apps' : 'Floating is off', 'float');
  };
  return (
    <div className="bento">
      <div className={`b-float${on ? '' : ' off'}`} role="group" aria-label="Floating">
        <div className="b-float-top">
          <span className="b-on">
            <i />
            {on ? 'ON' : 'OFF'}
          </span>
          <Toggle on={on} onChange={setFloating} label="Floating bubble" />
        </div>
        <button className="b-float-hit" onClick={() => setFloating(!on)} aria-label="Toggle Floating">
          <Pearl width={92} height={84} r={28} shadow={false} glow={0.25} mood={on ? 'idle' : 'sleeping'} />
        </button>
        <div className="b-float-txt">
          <b>Floating</b>
          <small>{on ? 'Reply on any app' : 'Tap to turn on'}</small>
        </div>
      </div>
      <Tile
        className="wide"
        icon="ask"
        tone="violet"
        title="Ask Akaya"
        sub="Start a new chat"
        onClick={() => nav('/chat?new=1')}
      />
      <Tile
        className="sq"
        icon="translate"
        tone="green"
        title="Translate"
        sub="99+ langs"
        onClick={() => nav('/translate')}
      />
      <Tile className="sq" icon="read" tone="cyan" title="Read Screen" onClick={onReadScreen} />
      <Tile
        className="half"
        icon="future"
        tone="pink"
        title="Future Message"
        sub="Schedule sends"
        onClick={() => nav('/future')}
      />
      <Tile
        className="half"
        icon="note"
        tone="blue"
        title="Smart Note"
        sub="Save & organise"
        onClick={() => nav('/notes')}
      />
      <button className="b-vn" onClick={() => nav('/vnotes')}>
        <span className="b-vn-ic">
          <Icon name="wave" size={20} strokeWidth={2.2} />
        </span>
        <span className="b-txt">
          <b>Voice Notes</b>
          <small>Lecture & meeting notes, live</small>
        </span>
        <span className="b-vn-wave" aria-hidden="true">
          {[0.4, 0.8, 0.55, 1, 0.65, 0.9, 0.45, 0.7, 0.35].map((h, i) => (
            <i key={i} style={{ height: `${h * 100}%`, animationDelay: `${i * 0.11}s` }} />
          ))}
        </span>
      </button>
    </div>
  );
}
