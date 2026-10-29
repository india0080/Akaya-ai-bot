import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Screen, Pearl, Icon, Segmented, useToast } from '@akaya/ui';
import { Avatar } from '../components/Avatar';
import { ScreenState } from '../components/ScreenState';
import { requestMic } from '../lib/mic';
import { useMicAccess } from '../lib/useMicAccess';
import { useApp } from '../state/store';
import { greeting } from '../lib/time';
import { Bento } from './home/Bento';
import { TodaySlider } from './home/TodaySlider';
import { FeatureSlider } from './home/FeatureSlider';
import { RecentChats } from './home/RecentChats';
import { AppTile } from '../components/AppTile';
import { connectedApps } from '../integrations/catalog';
import { NotificationsSheet } from './sheets/NotificationsSheet';
import { ReadScreenSheet } from './sheets/ReadScreenSheet';
import { TodaySheet } from './sheets/TodaySheet';
import { AgentsSheet, ExploreSheet, LoanSheet } from './sheets/FeatureSheets';
import './Home.css';

const TIPS = [
  'Tap the bar below and just ask!',
  'I can translate 99+ languages.',
  'Try Read Screen on any app.',
  'Hehe, that tickles!',
  'Need a reminder? Just ask.',
];

export type HomeSheet = 'notifications' | 'read' | 'today' | 'agents' | 'explore' | 'loan';

// Pearl geometry here and in the Chat header (padding 6px 14px 8px 10px; 40px back button, 10px gap, 44px pearl r=16)
const PEARL_R = 66;
const PEARL_CY = 116;
const CHAT_PEARL = { left: 10 + 40 + 10 + 22, top: 6 + 22, r: 16 };
/** Chat composer: padding-bottom 12px + safe area */
const COMPOSER_GAP = 12;
const EASE = [0.32, 0.72, 0, 1] as const;

interface Leave {
  pearl: { x: number; y: number; scale: number };
  pill: number;
}

export function Home() {
  const { state, setSetting } = useApp();
  const mic = useMicAccess();
  const toast = useToast();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const sheet = params.get('sheet') as HomeSheet | null;
  const open = (s: HomeSheet, extra: Record<string, string> = {}) => setParams({ sheet: s, ...extra });
  const close = () => setParams({}, { replace: true });

  const [tip, setTip] = useState<string | null>(null);
  const tipN = useRef(0);
  const tipTimer = useRef(0);
  const goTimer = useRef(0);
  useEffect(
    () => () => {
      clearTimeout(tipTimer.current);
      clearTimeout(goTimer.current);
    },
    [],
  );
  const [leave, setLeave] = useState<Leave | null>(null);
  const pearlRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const proxyRef = useRef<HTMLInputElement>(null);
  const myApps = connectedApps(state.integrations);
  const unread = state.notifications.filter((n) => !n.read).length;
  const { mode } = state.settings;

  /** Shrink the pearl into the Chat header and slide the Ask bar down into the composer, then open Chat. */
  const openChat = (query = 'focus=1') => {
    if (leave) return;
    // focusing an input inside the tap keeps the soft keyboard up across the route change
    if (query.includes('focus')) proxyRef.current?.focus({ preventScroll: true });
    const go = () => nav(`/chat?${query}`, { state: { from: 'home' } });
    const dev = document.getElementById('device')?.getBoundingClientRect();
    const pearl = pearlRef.current?.getBoundingClientRect();
    const pill = pillRef.current?.getBoundingClientRect();
    if (!dev || !pearl || !pill) return go();
    const top = document.querySelector('.home > .h-head')?.getBoundingClientRect().top ?? dev.top;
    setLeave({
      pearl: {
        x: dev.left + CHAT_PEARL.left - (pearl.left + pearl.width / 2),
        y: top + CHAT_PEARL.top - (pearl.top + PEARL_CY),
        scale: CHAT_PEARL.r / PEARL_R,
      },
      pill: dev.bottom - COMPOSER_GAP - pill.bottom,
    });
    goTimer.current = window.setTimeout(go, 400);
  };

  return (
    <Screen className={`home${leave ? ' leaving' : ''}`}>
      <input ref={proxyRef} className="h-proxy" aria-hidden="true" tabIndex={-1} />
      <header className="h-head">
        <button onClick={() => nav('/more')} aria-label="Profile and settings">
          <Avatar size={44} />
        </button>
        <div className="grow">
          <small>{greeting()},</small>
          <b>{state.user.name}</b>
        </div>
        <div className="h-actions">
          <button className="icon-btn card" onClick={() => nav('/history')} aria-label="History">
            <Icon name="history" size={20} />
          </button>
          <button
            className="icon-btn card bell"
            onClick={() => open('notifications')}
            aria-label={`Notifications, ${unread} unread`}
          >
            <Icon name="bell" size={20} />
            {unread > 0 && state.settings.notifications && <i className="dot" />}
          </button>
          <button className="icon-btn card" onClick={() => nav('/more')} aria-label="Settings">
            <Icon name="gear" size={20} />
          </button>
        </div>
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
        <motion.div
          ref={pearlRef}
          className="h-pearl"
          style={{ transformOrigin: `50% ${PEARL_CY}px` }}
          animate={leave ? leave.pearl : { x: 0, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <Pearl
            width={390}
            height={196}
            r={PEARL_R}
            cy={PEARL_CY}
            scene={!leave}
            interactive
            label="Akaya. Tap me"
            onTap={() => {
              setTip(TIPS[tipN.current++ % TIPS.length]);
              clearTimeout(tipTimer.current);
              tipTimer.current = window.setTimeout(() => setTip(null), 2600);
            }}
          />
        </motion.div>
        <AnimatePresence>
          {tip && !leave && (
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
      <motion.div
        ref={pillRef}
        className="card h-pill"
        animate={{ y: leave ? leave.pill : 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <button className="h-pill-main" onClick={() => openChat()} aria-label="Ask Akaya anything (opens Chat)">
          <span className="h-pill-kb" aria-hidden="true">
            <Icon name="keyboard" size={20} />
          </span>
          <i className="h-pill-div" aria-hidden="true" />
          <span className="h-pill-ph">Ask Akaya anything…</span>
        </button>
        <button
          className="h-pill-voice"
          aria-label={mic === 'checking' ? 'Checking the microphone' : 'Talk to Akaya (Voice)'}
          aria-busy={mic === 'checking'}
          disabled={mic === 'checking'}
          onClick={() => {
            if (mic === 'ready' || mic === 'prompt') nav('/voice');
          }}
        >
          {mic === 'checking' ? (
            <span className="screen-state-spin light" />
          ) : (
            <span className="h-pill-wave" aria-hidden="true">
              {[0.45, 0.8, 1, 0.65, 0.9, 0.5].map((h, i) => (
                <i key={i} style={{ '--h': h, '--d': `${i * -0.14}s` } as CSSProperties} />
              ))}
            </span>
          )}
        </button>
      </motion.div>

      {(mic === 'denied' || mic === 'unsupported') && (
        <ScreenState
          className="h-mic-state"
          icon={mic === 'unsupported' ? 'mic' : 'alert'}
          title={mic === 'unsupported' ? 'Microphone isn’t available' : 'Microphone is blocked'}
          body={
            mic === 'unsupported'
              ? 'This browser or device has no microphone. You can still ask Akaya by typing.'
              : 'Voice is off until Akaya is allowed to use the microphone. You can still type, or try again after changing the setting.'
          }
        >
          <div className="screen-state-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => openChat()}>
              Type instead
            </button>
            {mic === 'denied' && (
              <button
                className="btn btn-brand btn-sm"
                onClick={() => {
                  void requestMic().then((next) => {
                    if (next === 'ready') nav('/voice');
                  });
                }}
              >
                Try again
              </button>
            )}
          </div>
        </ScreenState>
      )}

      <Bento onReadScreen={() => open('read')} />

      <div className="sec-head">
        <h3>Today</h3>
        <button className="pill-link" onClick={() => nav('/reminders')}>
          Reminders <Icon name="chev" size={13} strokeWidth={2.6} />
        </button>
      </div>
      <TodaySlider />

      <div className="sec-head">
        <h3>Your apps</h3>
        <button className="pill-link" onClick={() => nav('/apps')}>
          Manage <Icon name="chev" size={13} strokeWidth={2.6} />
        </button>
      </div>
      <div className="h-apps">
        {myApps.map((app) => (
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
