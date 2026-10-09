import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Screen } from '../components/Screen';
import { Pearl } from '../components/Pearl';
import { Icon } from '../components/Icon';
import { Avatar } from '../components/Avatar';
import { Segmented } from '../components/Controls';
import { useToast } from '../components/Toast';
import { useApp } from '../state/store';
import { greeting } from '../lib/time';
import { Bento } from './home/Bento';
import { TodayRow } from './home/TodayRow';
import { FeatureSlider } from './home/FeatureSlider';
import { RecentChats } from './home/RecentChats';
import { AppTile } from '../components/AppTile';
import { APP_BY_ID } from '../integrations/catalog';
import { NotificationsSheet } from './sheets/NotificationsSheet';
import { ReadScreenSheet } from './sheets/ReadScreenSheet';
import { TodaySheet } from './sheets/TodaySheet';
import { AgentsSheet, ExploreSheet, LoanSheet } from './sheets/FeatureSheets';
import './Home.css';

const TIPS = [
  'Tap the mic and just speak!',
  'I can translate 99+ languages.',
  'Try Read Screen on any app.',
  'Hehe, that tickles!',
  'Need a reminder? Just ask.',
];

export type HomeSheet = 'notifications' | 'read' | 'today' | 'agents' | 'explore' | 'loan';

export function Home() {
  const { state, setSetting } = useApp();
  const toast = useToast();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const sheet = params.get('sheet') as HomeSheet | null;
  const open = (s: HomeSheet, extra: Record<string, string> = {}) => setParams({ sheet: s, ...extra });
  const close = () => setParams({}, { replace: true });

  const [tip, setTip] = useState<string | null>(null);
  const tipN = useRef(0);
  const tipTimer = useRef(0);
  useEffect(() => () => clearTimeout(tipTimer.current), []);
  const connectedApps = Object.values(state.integrations)
    .sort((a, b) => b.connectedAt - a.connectedAt)
    .map((c) => APP_BY_ID[c.appId])
    .filter(Boolean);
  const unread = state.notifications.filter((n) => !n.read).length;
  const { mode } = state.settings;

  return (
    <Screen nav className="home">
      <header className="h-head">
        <button onClick={() => nav('/more')} aria-label="Profile and settings">
          <Avatar size={44} />
        </button>
        <div className="grow">
          <small>{greeting()},</small>
          <b>{state.user.name}</b>
        </div>
        <button
          className="icon-btn card bell"
          onClick={() => open('notifications')}
          aria-label={`Notifications, ${unread} unread`}
        >
          <Icon name="bell" size={20} />
          {unread > 0 && state.settings.notifications && <i className="dot" />}
        </button>
      </header>

      <section className="h-hero">
        <div className="h-mode">
          <Segmented
            value={mode}
            onChange={(v) => {
              setSetting('mode', v);
              toast(
                v === 'on-device' ? 'On-device AI · works offline' : 'Online mode · full cloud models',
                v === 'on-device' ? 'chip' : 'globe',
              );
            }}
            options={[
              {
                value: 'on-device',
                label: (
                  <>
                    <em className={`live${mode === 'on-device' ? ' on' : ''}`} />
                    On-device
                  </>
                ),
              },
              {
                value: 'online',
                label: (
                  <>
                    <Icon name="globe" size={13} />
                    Online
                  </>
                ),
              },
            ]}
          />
        </div>
        <Pearl
          width={390}
          height={196}
          r={66}
          cy={116}
          scene
          interactive
          label="Akaya. Tap me"
          onTap={() => {
            setTip(TIPS[tipN.current++ % TIPS.length]);
            clearTimeout(tipTimer.current);
            tipTimer.current = window.setTimeout(() => setTip(null), 2600);
          }}
        />
        <AnimatePresence>
          {tip && (
            <motion.div
              key={tip}
              className="h-tip"
              initial={{ opacity: 0, scale: 0.7, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {tip}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
      <h2 className="h-ask">
        How can I help you <span className="grad-text">today?</span>
      </h2>

      <Bento onReadScreen={() => open('read')} />

      <div className="sec-head">
        <h3>Today</h3>
        <button className="pill-link" onClick={() => open('today')}>
          See all <Icon name="chev" size={13} strokeWidth={2.6} />
        </button>
      </div>
      <TodayRow onOpen={(kind) => open('today', { kind })} />

      <div className="sec-head">
        <h3>Your apps</h3>
        <button className="pill-link" onClick={() => nav('/apps')}>
          Manage <Icon name="chev" size={13} strokeWidth={2.6} />
        </button>
      </div>
      <div className="h-apps">
        {connectedApps.map((app) => (
          <button key={app.id} className="card h-app" onClick={() => nav(`/apps?app=${app.id}`)}>
            <AppTile app={app} size={44} />
            <span className="lbl">{app.name}</span>
          </button>
        ))}
        <button className="card h-app" onClick={() => nav('/apps')}>
          <span className="h-app-add">
            <Icon name="plus" size={20} strokeWidth={2.4} />
          </span>
          <span className="lbl">Add apps</span>
        </button>
      </div>

      <div className="sec-head">
        <h3>Do more with Akaya</h3>
      </div>
      <FeatureSlider onOpen={(s) => open(s)} />

      <div className="sec-head">
        <h3>Recent chats</h3>
        <button className="pill-link" onClick={() => nav('/history')}>
          History <Icon name="chev" size={13} strokeWidth={2.6} />
        </button>
      </div>
      <RecentChats />

      <NotificationsSheet open={sheet === 'notifications'} onClose={close} />
      <ReadScreenSheet open={sheet === 'read'} onClose={close} />
      <TodaySheet open={sheet === 'today'} onClose={close} kind={params.get('kind')} />
      <AgentsSheet open={sheet === 'agents'} onClose={close} />
      <ExploreSheet open={sheet === 'explore'} onClose={close} />
      <LoanSheet open={sheet === 'loan'} onClose={close} />
    </Screen>
  );
}
