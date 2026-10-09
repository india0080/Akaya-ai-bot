import { SnapSlider } from './SnapSlider';
import { Icon, type IconName, Pearl } from '@akaya/ui';
import { useNavigate } from 'react-router-dom';
import type { HomeSheet } from '../Home';
import { AppTile } from '../../components/AppTile';
import { APP_BY_ID } from '../../integrations/catalog';

const CARDS: {
  id: HomeSheet | 'apps';
  tag: string;
  title: string;
  text: string;
  cta: string;
  icon: IconName;
  bg: string;
}[] = [
  {
    id: 'apps',
    tag: 'APPS',
    title: 'Connect your\napps',
    text: 'Gmail, Notion, Slack + 97 more',
    cta: 'Connect apps',
    icon: 'apps',
    bg: 'linear-gradient(135deg,#06a960,#0dabf4)',
  },
  {
    id: 'agents',
    tag: 'AGENTS',
    title: 'Daily tasks on\nautopilot',
    text: 'Morning brief, bill alerts',
    cta: 'Create agent',
    icon: 'agent',
    bg: 'linear-gradient(135deg,#7625ef,#0269f8)',
  },
  {
    id: 'explore',
    tag: 'EXPLORE',
    title: 'Prompts & tools',
    text: 'Discover what Akaya can do',
    cta: 'Explore',
    icon: 'explore',
    bg: 'linear-gradient(135deg,#0dabf4,#0269f8)',
  },
  {
    id: 'loan',
    tag: 'FINANCE',
    title: 'Instant Loan',
    text: 'Check offers and plan EMIs',
    cta: 'Check now',
    icon: 'loan',
    bg: 'linear-gradient(135deg,#ff9a5c,#E8743B 60%,#d9488f)',
  },
];

/** Swipeable feature cards (native scroll-snap) with synced dots. */
const STACK = ['notion', 'gmail', 'slack'].map((id) => APP_BY_ID[id]);

export function FeatureSlider({ onOpen }: { onOpen: (id: HomeSheet) => void }) {
  const nav = useNavigate();
  return (
    <SnapSlider labels={CARDS.map((c) => c.tag)}>
      {CARDS.map((c) => (
        <button
          key={c.id}
          className="fc"
          style={{ background: c.bg }}
          onClick={() => (c.id === 'apps' ? nav('/apps') : onOpen(c.id))}
        >
          {c.id !== 'apps' && (
            <span className="fc-big">
              <Icon name={c.icon} size={120} strokeWidth={1.3} />
            </span>
          )}
          {c.id === 'apps' && (
            <span className="fc-stack">
              {STACK.map((app) => (
                <AppTile key={app.id} app={app} size={38} />
              ))}
            </span>
          )}
          {c.id === 'agents' && (
            <span className="fc-pearl">
              <Pearl width={74} height={74} r={24} shadow={false} glow={0.15} />
            </span>
          )}
          <span className="fc-tag">{c.tag}</span>
          <h4>{c.title}</h4>
          <p>{c.text}</p>
          <span className="fc-go">
            {c.cta}
            <Icon name="chev" size={12} strokeWidth={2.6} />
          </span>
        </button>
      ))}
    </SnapSlider>
  );
}
