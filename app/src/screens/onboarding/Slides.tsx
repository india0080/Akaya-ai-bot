/* The five animated feature-intro illustrations. Motion follows the approved motion notes. */
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { Pearl, Icon } from '@akaya/ui';
import { useClock, useStages, useTyped } from '../../lib/anim';

const spring = { type: 'spring' as const, stiffness: 260, damping: 20 };

/* 1 · Floating reply ------------------------------------------------------- */
export function SlideFloating() {
  // 0 card · 1 incoming · 2 voice chip · 3 draft · 4 finger tap · 5 sent
  const s = useStages([350, 900, 1600, 3300, 3900], 7600);
  const draft = useTyped('Sure, 4 PM works for me. Talk then!', s >= 3, 30);
  return (
    <div className="ill">
      <motion.div
        className="ob-card chat"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={spring}
      >
        <div className="chat-head">
          <Icon name="back" size={16} />
          <span className="av-r">R</span>
          <div className="grow">
            <b>Rahul</b>
            <small>online</small>
          </div>
          <Icon name="dots" size={16} />
        </div>
        <div className="chat-body">
          {s >= 1 && (
            <motion.div className="bub in" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              Can we move tomorrow's call to 4 PM?<i>10:42</i>
            </motion.div>
          )}
          {s >= 2 && s < 5 && (
            <motion.div
              className="voice-chip"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={spring}
            >
              <Icon name="mic" size={13} />
              <span className="wave">
                {[0, 1, 2, 3, 4].map((i) => (
                  <i key={i} style={{ animationDelay: `${i * 0.12}s` }} />
                ))}
              </span>
              हाँ, 4 बजे ठीक है
            </motion.div>
          )}
          {s >= 5 && (
            <motion.div
              className="bub out"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={spring}
            >
              Sure, 4 PM works for me. Talk then!<i>10:43 ✓✓</i>
            </motion.div>
          )}
        </div>
        {s >= 3 && s < 5 && (
          <motion.div
            className="draft"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={spring}
          >
            <div className="draft-tags">
              <span className="tag t-violet">
                <Icon name="spark" size={10} />
                DRAFT
              </span>
              <motion.span
                className="tag t-green"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ ...spring, delay: 0.3 }}
              >
                HINDI → ENGLISH
              </motion.span>
            </div>
            <p>
              {draft}
              <span className="caret" />
            </p>
            <div className="draft-btns">
              <span className="btn btn-ghost btn-sm">Edit</span>
              <motion.span
                className="btn btn-primary btn-sm send"
                animate={s === 4 ? { scale: [1, 0.9, 1] } : {}}
                transition={{ duration: 0.35, delay: 0.25 }}
              >
                Send <Icon name="send" size={13} />
              </motion.span>
            </div>
          </motion.div>
        )}
      </motion.div>
      {s === 4 && (
        <>
          <motion.div
            className="finger"
            initial={{ x: 60, y: 60, opacity: 0 }}
            animate={{ x: 0, y: 0, opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            <svg width="34" height="40" viewBox="0 0 34 40">
              <path
                d="M10 4.5c0-2 3.4-2 3.4 0v13l2.2-1c1.4-.6 2.8.2 3 1.4l.2.6 1.6-.6c1.3-.4 2.7.4 2.9 1.5l1.7-.5c1.4-.3 2.8.6 2.8 2v7.6c0 6-4 10-10 10h-1.2c-3.3 0-5.7-1.4-7.6-4L3.4 25.6c-1-1.5.7-3.4 2.4-2.4L10 26z"
                fill="#fff"
                stroke="#2a2b45"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
          <motion.div
            className="ripple"
            initial={{ scale: 0.3, opacity: 0.9 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          />
        </>
      )}
      <motion.div className="dock" initial={{ x: 120 }} animate={{ x: 0 }} transition={{ ...spring, delay: 0.2 }}>
        <Pearl
          width={96}
          height={96}
          r={30}
          mood={s >= 5 ? 'happy' : s >= 3 ? 'thinking' : 'idle'}
          gaze={{ x: -0.7, y: 0.25 }}
        />
      </motion.div>
      <div className="app-chips">
        <span className="tag chip-w">
          <Icon name="float" size={12} />
          Floating on
        </span>
        <span className="tag chip-w c-green">
          <Icon name="chat" size={12} />
          WhatsApp
        </span>
        <span className="tag chip-w c-blue">
          <Icon name="mail" size={12} />
          Gmail
        </span>
      </div>
    </div>
  );
}

/* 2 · Voice reminders ------------------------------------------------------ */
export function SlideVoice() {
  const s = useStages([200, 2300, 2800, 3300], 8000);
  const quote = useTyped('"Remind me to call Rahul at 5, and follow up with Neha tomorrow"', s >= 1, 34);
  const lvl = useRef(0);
  const t = useClock();
  useEffect(() => {
    lvl.current = s < 2 ? 0.35 + 0.3 * Math.abs(Math.sin(t * 5.3) * Math.sin(t * 2.1)) : 0.05;
  }, [s, t]);
  return (
    <div className="ill">
      <div className="v-pearl">
        <Pearl width={230} height={210} r={54} mood={s < 2 ? 'listening' : 'happy'} levelRef={lvl} />
      </div>
      <motion.div className="ob-card quote" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        {quote}
      </motion.div>
      <div className="wavebar">
        {Array.from({ length: 17 }, (_, i) => (
          <i
            key={i}
            style={{ height: s < 2 ? 4 + 18 * Math.abs(Math.sin(t * 6 + i * 0.7)) * (0.4 + 0.6 * Math.sin(i / 3)) : 4 }}
          />
        ))}
      </div>
      {s >= 2 && (
        <motion.div
          className="ob-card res r1"
          initial={{ y: -40, opacity: 0, rotate: -6 }}
          animate={{ y: 0, opacity: 1, rotate: -1.5 }}
          transition={spring}
        >
          <span className="ri" style={{ background: 'var(--tint-orange)', color: 'var(--orange)' }}>
            <Icon name="alarm" size={19} />
          </span>
          <div className="grow">
            <b>Call Rahul</b>
            <small>Today · 5:00 PM</small>
          </div>
          <span className="tag t-green">
            <motion.span initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} style={{ display: 'flex' }}>
              <Icon name="check" size={11} strokeWidth={3} />
            </motion.span>
            Reminder set
          </span>
        </motion.div>
      )}
      {s >= 3 && (
        <motion.div
          className="ob-card res r2"
          initial={{ y: -40, opacity: 0, rotate: 6 }}
          animate={{ y: 0, opacity: 1, rotate: 1.2 }}
          transition={spring}
        >
          <span className="ri" style={{ background: 'var(--tint-green)', color: 'var(--green-text)' }}>
            <Icon name="follow" size={19} />
          </span>
          <div className="grow">
            <b>Follow up with Neha</b>
            <small>Tomorrow · 10:00 AM</small>
          </div>
          <span className="tag t-blue">Follow-up</span>
        </motion.div>
      )}
    </div>
  );
}

/* 3 · 99+ languages -------------------------------------------------------- */
const CHIPS = [
  ['नमस्ते', 'Hindi'],
  ['Hola', 'Español'],
  ['こんにちは', '日本語'],
  ['வணக்கம்', 'Tamil'],
  ['Bonjour', 'Français'],
  ['مرحبا', 'Arabic'],
];
const PAIRS = [
  ['आप कैसे हैं? चलो कल मिलते हैं।', "How are you? Let's meet tomorrow."],
  ['¿Dónde está la estación de metro?', 'Where is the metro station?'],
  ['மிக்க நன்றி!', 'Thank you so much!'],
];
export function SlideTranslate() {
  const t = useClock();
  const pair = PAIRS[Math.floor(t / 3.2) % PAIRS.length];
  const showEn = t % 3.2 > 1.2;
  const front = Math.sin(t * 0.35);
  return (
    <div className="ill">
      <div className="t-stage">
        <Pearl width={360} height={230} r={54} cy={112} scene gaze={{ x: Math.cos(t * 0.35) * 0.6, y: front * 0.2 }} />
        {CHIPS.map(([w, l], i) => {
          const a = t * 0.35 + (i / CHIPS.length) * Math.PI * 2;
          const x = Math.cos(a) * 132;
          const y = Math.sin(a) * 78;
          const z = Math.sin(a);
          return (
            <div
              key={l}
              className="lang"
              style={{
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${0.85 + z * 0.15})`,
                zIndex: z > 0 ? 3 : 1,
                opacity: 0.75 + z * 0.25,
              }}
            >
              {w}
              <small>{l}</small>
            </div>
          );
        })}
      </div>
      <div className="ob-card tcard">
        <div className="t-pills">
          <motion.span layout className="tag pill">
            {showEn ? 'Detected' : 'Hindi'}
          </motion.span>
          <span className="swap">⇄</span>
          <motion.span layout className="tag pill">
            English
          </motion.span>
          <span className="grow" />
          <Icon name="mic" size={15} className="faint" />
        </div>
        <div className="src">{pair[0]}</div>
        <motion.div
          key={pair[1] + showEn}
          className="dst"
          initial={{ opacity: 0, y: 6, filter: 'blur(4px)' }}
          animate={{ opacity: showEn ? 1 : 0.25, y: 0, filter: 'blur(0px)' }}
        >
          {showEn ? pair[1] : '· · ·'}
        </motion.div>
      </div>
    </div>
  );
}

/* 4 · Future Message ------------------------------------------------------- */
export function SlideFuture() {
  const s = useStages([200, 2600, 3200, 3900], 8200);
  const msg = useTyped('Happy birthday, Neha! Wishing you a year full of laughter and big wins 🎉', s >= 1, 36);
  return (
    <div className="ill">
      <div className="f-top">
        <motion.div animate={s >= 4 ? { y: [0, -16, 0] } : {}} transition={{ duration: 0.5 }}>
          <Pearl width={100} height={100} r={32} mood={s >= 4 ? 'happy' : 'idle'} gaze={{ x: 0.5, y: 0.3 }} />
        </motion.div>
        <motion.div
          className="ob-card say"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...spring, delay: 0.3 }}
        >
          {s >= 4 ? 'Scheduled! ✓' : "I'll send it at midnight"}
        </motion.div>
      </div>
      <svg className="f-path" width="220" height="110" viewBox="0 0 220 110">
        <path
          d="M10 100 C 60 90, 100 40, 190 22"
          stroke="#E8743B"
          strokeWidth="2"
          strokeDasharray="4 6"
          fill="none"
          strokeLinecap="round"
          opacity=".55"
        />
      </svg>
      <motion.div
        className="plane"
        initial={false}
        animate={
          s >= 4
            ? { x: [0, 60, 150, 260], y: [80, 50, 6, -40], opacity: [1, 1, 1, 0], rotate: [-20, -25, -18, -10] }
            : { x: 0, y: 80, opacity: s >= 3 ? 1 : 0 }
        }
        transition={{ duration: 1.2, ease: 'easeIn' }}
      >
        <Icon name="send" size={26} strokeWidth={2} />
      </motion.div>
      <motion.div
        className="ob-card fcard"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={spring}
      >
        <div className="f-to">
          <span className="av-n">N</span>
          <div className="grow">
            <small>TO</small>
            <b>Neha</b>
          </div>
          <span className="tag t-orange">
            <Icon name="future" size={12} />
            Future Message
          </span>
        </div>
        <div className="f-msg">
          {msg}
          {s < 2 && <span className="caret" />}
        </div>
        <div className="f-when">
          <motion.div className="when b" animate={s >= 2 ? { rotateX: [90, 0] } : { rotateX: 0 }}>
            <Icon name="cal" size={17} />
            <div>
              <small>DATE</small>
              <b>{s >= 2 ? 'Fri, 9 Oct' : 'Pick date'}</b>
            </div>
          </motion.div>
          <motion.div
            className="when v"
            animate={s >= 2 ? { rotateX: [90, 0] } : { rotateX: 0 }}
            transition={{ delay: 0.15 }}
          >
            <motion.span
              animate={s >= 2 ? { rotate: 360 } : {}}
              transition={{ duration: 0.8 }}
              style={{ display: 'flex' }}
            >
              <Icon name="clock" size={17} />
            </motion.span>
            <div>
              <small>TIME</small>
              <b>{s >= 2 ? '12:00 AM' : 'Pick time'}</b>
            </div>
          </motion.div>
        </div>
        <motion.div className="btn btn-primary btn-block f-btn" animate={s === 3 ? { scale: [1, 0.94, 1] } : {}}>
          <Icon name={s >= 4 ? 'check' : 'send'} size={15} />
          {s >= 4 ? 'Scheduled · sends in 14 h' : 'Schedule send'}
        </motion.div>
      </motion.div>
    </div>
  );
}

/* 5 · Agents --------------------------------------------------------------- */
const STEPS: { icon: 'clock' | 'mail' | 'spark'; t: string; s: string; c: string; bg: string }[] = [
  { icon: 'clock', t: 'Every day at 8:00 AM', s: 'Trigger', c: 'var(--blue)', bg: 'var(--tint-blue)' },
  { icon: 'mail', t: 'Check mails & calendar', s: 'Gmail · Calendar', c: 'var(--violet)', bg: 'var(--tint-violet)' },
  { icon: 'spark', t: 'Send me a 1-min brief', s: 'Voice + text', c: 'var(--orange)', bg: 'var(--tint-orange)' },
];
const AGENT_CHIPS: [string, 'alarm' | 'follow' | 'note' | 'chat', string][] = [
  ['Bill reminders', 'alarm', 'var(--orange)'],
  ['Follow-up nudges', 'follow', 'var(--green-text)'],
  ['Daily notes', 'note', 'var(--cyan)'],
  ['Auto-reply drafts', 'chat', 'var(--violet)'],
];
export function SlideAgents() {
  const s = useStages([500, 1000, 1500, 2000, 2700], 9000);
  return (
    <div className="ill">
      <div className="a-pearl">
        <Pearl width={120} height={120} r={38} mood={s >= 4 ? 'happy' : 'idle'} gaze={{ x: 0.6, y: 0.35 }} />
      </div>
      <motion.div
        className="ob-card acard"
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={spring}
      >
        <div className="a-head">
          <span className="gi gi-violet" style={{ width: 32, height: 32, borderRadius: 11 }}>
            <Icon name="agent" size={18} />
          </span>
          <div className="grow">
            <b>Morning brief</b>
            <small className={s >= 1 ? 'on' : ''}>● {s >= 1 ? 'Active' : 'Paused'}</small>
          </div>
          <span className={`toggle${s >= 1 ? ' on' : ''}`}>
            <span />
          </span>
        </div>
        <div className="a-steps">
          <div className="a-line" />
          <motion.div
            className="a-dot"
            animate={{ top: s >= 4 ? 96 : s >= 3 ? 50 : s >= 2 ? 6 : 6, opacity: s >= 2 ? 1 : 0 }}
          />
          {STEPS.map((st, i) => (
            <div key={st.t} className={`a-step${s >= i + 2 ? ' lit' : ''}`}>
              <span className="si" style={{ background: st.bg, color: st.c }}>
                <Icon name={st.icon} size={16} />
              </span>
              <div>
                <b>{st.t}</b>
                <small>{st.s}</small>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
      <div className="a-chips">
        {AGENT_CHIPS.map(([t, ic, c], i) => (
          <motion.span
            key={t}
            className="ob-card a-chip"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...spring, delay: 0.8 + i * 0.12 }}
          >
            <span style={{ color: c, display: 'flex' }}>
              <Icon name={ic} size={14} />
            </span>
            {t}
          </motion.span>
        ))}
      </div>
      {s >= 5 && (
        <motion.div
          className="offline"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: [0.9, 1.04, 1] }}
        >
          <Icon name="chip" size={13} />
          Offline mode: on-device AI works without internet
        </motion.div>
      )}
    </div>
  );
}
