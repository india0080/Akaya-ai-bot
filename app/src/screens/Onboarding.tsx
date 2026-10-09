import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Logo } from '../components/Logo';
import { Icon } from '../components/Icon';
import { useApp } from '../state/store';
import { SlideAgents, SlideFloating, SlideFuture, SlideTranslate, SlideVoice } from './onboarding/Slides';
import './Onboarding.css';

const SLIDES = [
  {
    kick: 'Floating reply',
    title: 'Reply on any app,\nin any language',
    body: 'Akaya floats over WhatsApp, Gmail and more. Speak Hindi, send polished English in one tap.',
    Ill: SlideFloating,
    tint: ['rgba(255,170,120,.45)', 'rgba(200,180,255,.55)'],
  },
  {
    kick: 'Voice reminders',
    title: "Just say it.\nI'll remember.",
    body: 'Set reminders and follow-ups by voice. Akaya nudges you at the right time, so nothing slips.',
    Ill: SlideVoice,
    tint: ['rgba(150,200,255,.55)', 'rgba(210,170,255,.5)'],
  },
  {
    kick: '99+ languages',
    title: 'Talk to anyone in\n99+ languages',
    body: 'Translate text, voice and chats instantly, from Hindi and Tamil to Spanish, Japanese and many more.',
    Ill: SlideTranslate,
    tint: ['rgba(120,230,190,.45)', 'rgba(160,200,255,.55)'],
  },
  {
    kick: 'Future Message',
    title: 'Write it now,\nsend it later',
    body: 'Schedule wishes, nudges and updates. Akaya sends them right on time.',
    Ill: SlideFuture,
    tint: ['rgba(255,170,215,.5)', 'rgba(200,180,255,.55)'],
  },
  {
    kick: 'AI Agents',
    title: 'Agents that handle\nyour daily tasks',
    body: 'Create agents that run your routines every day, automatically.',
    Ill: SlideAgents,
    tint: ['rgba(170,140,255,.55)', 'rgba(130,210,255,.5)'],
  },
];

const variants = {
  enter: (d: number) => ({ x: d > 0 ? 340 : -340, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -340 : 340, opacity: 0 }),
};

export function Onboarding() {
  const { finishOnboarding } = useApp();
  const nav = useNavigate();
  const start = Number(new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('s') ?? 1) - 1;
  const [[i, dir], setI] = useState<[number, number]>([Math.min(4, Math.max(0, start)), 0]);
  const go = (n: number) => n >= 0 && n < SLIDES.length && setI([n, n > i ? 1 : -1]);
  const done = () => {
    finishOnboarding();
    nav('/home', { replace: true });
  };
  const S = SLIDES[i];
  const last = i === SLIDES.length - 1;

  return (
    <main className="screen onboarding">
      <div
        className="ob-bg"
        style={{
          background: `radial-gradient(280px 240px at 82% 170px, ${S.tint[0]}, transparent 70%), radial-gradient(300px 280px at 12% 280px, ${S.tint[1]}, transparent 70%)`,
        }}
      />
      <div className="ob-top">
        <Logo size={21} />
        {!last && (
          <button className="ob-skip" onClick={done}>
            Skip
          </button>
        )}
      </div>
      <div className="ob-viewport">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={i}
            className="ob-slide"
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: 'spring', stiffness: 300, damping: 32 }, opacity: { duration: 0.2 } }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60 || info.velocity.x < -500) go(i + 1);
              else if (info.offset.x > 60 || info.velocity.x > 500) go(i - 1);
            }}
          >
            <S.Ill />
            <div className="ob-txt">
              <div className="ob-kick">{S.kick}</div>
              <h1>{S.title}</h1>
              <p>{S.body}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="ob-bar">
        <div className="ob-dots" role="tablist">
          {SLIDES.map((s, k) => (
            <button key={s.kick} className={k === i ? 'a' : ''} aria-label={`Slide ${k + 1}`} onClick={() => go(k)} />
          ))}
        </div>
        {last ? (
          <button className="ob-next full" onClick={done}>
            Get started <Icon name="chev" size={18} strokeWidth={2.6} />
          </button>
        ) : (
          <button className="ob-next" onClick={() => go(i + 1)}>
            Next
            <span>
              <Icon name="chev" size={18} strokeWidth={2.6} />
            </span>
          </button>
        )}
      </div>
    </main>
  );
}
