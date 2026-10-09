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
import { fmtTime, greeting } from '../lib/time';
import { NotificationsSheet } from './sheets/NotificationsSheet';
import { ReadScreenSheet } from './sheets/ReadScreenSheet';
import { TodaySheet } from './sheets/TodaySheet';
import { AgentsSheet, ExploreSheet, LoanSheet } from './sheets/FeatureSheets';
import './Home.css';

const TIPS = [
  'Tap the bar below and just ask!',
  'I can translate 99+ languages.',
  'Hehe, that tickles!',
  'Need a reminder? Just ask.',
  'Try + to add photos or files.',
];

export type HomeSheet = 'notifications' | 'read' | 'today' | 'agents' | 'explore' | 'loan';

// geometry shared with the Chat header (padding 6px 14px 8px 10px, 44px pearl, r=16)
const PEARL_R = 76;
const PEARL_CY = 134;
const CHAT_PEARL = { left: 10 + 22, top: 6 + 22, r: 16 };
const EASE = [0.32, 0.72, 0, 1] as const;

interface Leave {
  pearl: { x: number; y: number; scale: number };
  pill: number;
}

/** Minimal Home: header, AI-mode toggle, the pearl and one long "Ask Akaya" bar that morphs into Chat. */
export function Home() {
  const { state, setSetting } = useApp();
  const toast = useToast();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const sheet = params.get('sheet') as HomeSheet | null;
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
  const [now] = useState(() => Date.now());
  const [leave, setLeave] = useState<Leave | null>(null);
  const headRef = useRef<HTMLElement>(null);
  const pearlRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const proxyRef = useRef<HTMLInputElement>(null);

  const unread = state.notifications.filter((n) => !n.read).length;
  const { mode, floating } = state.settings;
  const next = state.today.filter((t) => !t.done && t.time >= now).sort((a, b) => a.time - b.time)[0];
  const recent = state.chats[0];

  /** shrink the pearl into the Chat header and drop the bar into the composer, then open Chat */
  const openChat = (query = 'focus=1') => {
    if (leave) return;
    // focusing an input inside the tap keeps the soft keyboard up across the route change
    if (query.includes('focus')) proxyRef.current?.focus({ preventScroll: true });
    const dev = document.getElementById('device')?.getBoundingClientRect();
    const head = headRef.current?.getBoundingClientRect();
    const pearl = pearlRef.current?.getBoundingClientRect();
    const pill = pillRef.current?.getBoundingClientRect();
    if (!dev || !head || !pearl || !pill) return nav(`/chat?${query}`, { state: { from: 'home' } });
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 76;
    const composerBottom = dev.bottom - (navH + 22);
    setLeave({
      pearl: {
        x: dev.left + CHAT_PEARL.left - (pearl.left + pearl.width / 2),
        y: head.top + CHAT_PEARL.top - (pearl.top + PEARL_CY),
        scale: CHAT_PEARL.r / PEARL_R,
      },
      pill: composerBottom - pill.bottom,
    });
    goTimer.current = window.setTimeout(() => nav(`/chat?${query}`, { state: { from: 'home' } }), 400);
  };

  return (
    <Screen nav className={`home home-min${leave ? ' leaving' : ''}`}>
      <input ref={proxyRef} className="h-proxy" aria-hidden="true" tabIndex={-1} />
      <header className="h-head" ref={headRef}>
        <button onClick={() => nav('/more')} aria-label="Profile and settings">
          <Avatar size={44} />
        </button>
        <motion.div className="grow" animate={{ opacity: leave ? 0 : 1 }} transition={{ duration: 0.2 }}>
          <small>{greeting()},</small>
          <b>{state.user.name}</b>
        </motion.div>
        <button
          className="icon-btn card bell"
          onClick={() => setParams({ sheet: 'notifications' })}
          aria-label={`Notifications, ${unread} unread`}
        >
          <Icon name="bell" size={20} />
          {unread > 0 && state.settings.notifications && <i className="dot" />}
        </button>
      </header>

      <motion.div
        className="h-controls"
        animate={{ opacity: leave ? 0 : 1, y: leave ? -8 : 0 }}
        transition={{ duration: 0.22 }}
      >
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
        <button
          className={`h-float${floating ? ' on' : ''}`}
          aria-pressed={floating}
          onClick={() => {
            setSetting('floating', !floating);
            toast(floating ? 'Floating bubble off' : 'Floating bubble on', 'float');
          }}
        >
          <Icon name="float" size={14} />
          Floating
          <i className="h-float-sw" />
        </button>
      </motion.div>

      <section className="h-stage">
        <motion.div
          ref={pearlRef}
          className="h-pearl"
          style={{ transformOrigin: `50% ${PEARL_CY}px` }}
          animate={leave ? leave.pearl : { x: 0, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <Pearl
            width={390}
            height={262}
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

      <motion.div
        ref={pillRef}
        className="card h-pill"
        animate={{ y: leave ? leave.pill : 0 }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        <button className="h-pill-plus" aria-label="Add photos, files and more" onClick={() => openChat('attach=menu')}>
          <Icon name="plus" size={20} strokeWidth={2.4} />
        </button>
        <button className="h-pill-input" onClick={() => openChat()} aria-label="Ask Akaya anything">
          Ask Akaya anything…
        </button>
        <button className="h-pill-mic" aria-label="Talk to Akaya" onClick={() => nav('/voice')}>
          <Icon name="mic" size={19} />
        </button>
      </motion.div>

      <motion.div className="h-strip" animate={{ opacity: leave ? 0 : 1 }} transition={{ duration: 0.18 }}>
        {next && (
          <button className="h-chip" onClick={() => setParams({ sheet: 'today' })}>
            <Icon name="alarm" size={14} />
            <span>
              {next.title} · {fmtTime(next.time)}
            </span>
          </button>
        )}
        {recent && (
          <button className="h-chip" onClick={() => nav(`/chat/${recent.id}`)}>
            <Icon name="history" size={14} />
            <span>{recent.title}</span>
          </button>
        )}
      </motion.div>

      <NotificationsSheet open={sheet === 'notifications'} onClose={close} />
      <ReadScreenSheet open={sheet === 'read'} onClose={close} />
      <TodaySheet open={sheet === 'today'} onClose={close} kind={params.get('kind')} />
      <AgentsSheet open={sheet === 'agents'} onClose={close} />
      <ExploreSheet open={sheet === 'explore'} onClose={close} />
      <LoanSheet open={sheet === 'loan'} onClose={close} />
    </Screen>
  );
}
