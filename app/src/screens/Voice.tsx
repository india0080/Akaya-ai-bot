import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Screen } from '../components/Screen';
import { Pearl, type Mood } from '../components/Pearl';
import { Icon } from '../components/Icon';
import { useApp } from '../state/store';
import { mockReply } from '../lib/mock';
import { createRecognizer, speak, stopSpeaking, type SpeechRec } from '../lib/speech';
import './Voice.css';

type Phase = 'idle' | 'listening' | 'thinking' | 'speaking' | 'denied';
const DEMO_LINE = 'Remind me to call Rahul at 5 PM';
const LANG_CODE: Record<string, string> = {
  English: 'en-IN',
  Hindi: 'hi-IN',
  Tamil: 'ta-IN',
  Bengali: 'bn-IN',
  Marathi: 'mr-IN',
};

/**
 * Voice: real microphone via getUserMedia; an AnalyserNode drives the pearl's listening rings.
 * Uses the Web Speech API for live transcription when available, and speaks the reply.
 */
export function Voice() {
  const { state, addToday, logActivity } = useApp();
  const nav = useNavigate();
  const [phase, setPhase] = useState<Phase>('idle');
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const [demo, setDemo] = useState(false);
  const [bars, setBars] = useState<number[]>(Array(24).fill(0.08));
  const level = useRef(0);
  const media = useRef<{
    stream?: MediaStream;
    ctx?: AudioContext;
    raf?: number;
    rec?: SpeechRec | null;
    demoT?: number[];
  }>({});
  const transcriptRef = useRef('');

  const cleanup = () => {
    const m = media.current;
    if (m.raf) cancelAnimationFrame(m.raf);
    m.stream?.getTracks().forEach((t) => t.stop());
    m.ctx?.close().catch(() => {});
    m.rec?.abort();
    m.demoT?.forEach(clearTimeout);
    media.current = {};
    level.current = 0;
  };
  useEffect(
    () => () => {
      cleanup();
      stopSpeaking();
    },
    [],
  );

  const meter = (analyser: AnalyserNode) => {
    const data = new Uint8Array(analyser.fftSize);
    let frame = 0;
    const loop = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (const v of data) sum += ((v - 128) / 128) ** 2;
      const rms = Math.sqrt(sum / data.length);
      level.current = Math.min(1, rms * 4.5);
      if (frame++ % 3 === 0) setBars((b) => [...b.slice(1), Math.max(0.08, level.current)]);
      media.current.raf = requestAnimationFrame(loop);
    };
    loop();
  };

  const startDemo = () => {
    setDemo(true);
    setPhase('listening');
    setTranscript('');
    setReply('');
    let t = 0;
    const tick = () => {
      t += 0.05;
      level.current = 0.25 + 0.5 * Math.abs(Math.sin(t * 9) * Math.sin(t * 3.3));
      setBars((b) => [...b.slice(1), level.current]);
      media.current.raf = requestAnimationFrame(tick);
    };
    tick();
    const words = DEMO_LINE.split(' ');
    media.current.demoT = words.map((_, i) =>
      window.setTimeout(
        () => {
          transcriptRef.current = words.slice(0, i + 1).join(' ');
          setTranscript(transcriptRef.current);
        },
        400 + i * 260,
      ),
    );
    media.current.demoT.push(window.setTimeout(() => stop(), 400 + words.length * 260 + 600));
  };

  const start = async () => {
    stopSpeaking();
    setTranscript('');
    setReply('');
    transcriptRef.current = '';
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase('denied');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(analyser);
      media.current = { stream, ctx };
      setDemo(false);
      setPhase('listening');
      meter(analyser);
      const rec = createRecognizer(LANG_CODE[state.settings.language] ?? 'en-IN');
      if (rec) {
        rec.onresult = (e) => {
          let s = '';
          for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript;
          transcriptRef.current = s;
          setTranscript(s);
        };
        rec.onerror = () => {};
        try {
          rec.start();
        } catch {
          /* already started */
        }
        media.current.rec = rec;
      }
    } catch {
      setPhase('denied');
    }
  };

  const stop = () => {
    const heard = transcriptRef.current.trim();
    cleanup();
    setBars(Array(24).fill(0.08));
    setPhase('thinking');
    window.setTimeout(() => {
      const q = heard || 'Hello';
      const r = heard
        ? mockReply(q, state.settings.mode)
        : "I didn't catch that. Try again, or tap a suggestion below.";
      if (/remind/i.test(q)) {
        const d = new Date();
        d.setHours(17, 0, 0, 0);
        addToday({
          kind: 'reminder',
          title: q.replace(/remind me (to )?/i, '').replace(/^./, (c) => c.toUpperCase()),
          time: d.getTime(),
        });
      }
      if (heard) logActivity({ kind: 'voice', title: 'Voice Chat', input: heard, output: r });
      setReply(r);
      setPhase('speaking');
      speak(r, state.settings.voiceSpeed, 'en-IN', () => setPhase((p) => (p === 'speaking' ? 'idle' : p)));
    }, 900);
  };

  const mood: Mood =
    phase === 'listening' ? 'listening' : phase === 'thinking' ? 'thinking' : phase === 'speaking' ? 'happy' : 'idle';
  const status = {
    idle: 'Tap the mic and just speak',
    listening: demo ? 'Listening… (demo)' : 'Listening…',
    thinking: 'Thinking…',
    speaking: 'Akaya says',
    denied: 'Microphone is blocked',
  }[phase];

  return (
    <Screen nav className="voice">
      <header className="v-head">
        <h2>Voice</h2>
        <span className="grow" />
        <button className="v-notes-btn" onClick={() => nav('/vnotes')}>
          <Icon name="wave" size={15} strokeWidth={2.3} /> Voice Notes
        </button>
        <span className={`tag ${state.settings.mode === 'on-device' ? 't-green' : 't-blue'}`}>
          <Icon name={state.settings.mode === 'on-device' ? 'chip' : 'globe'} size={12} />
          {state.settings.mode === 'on-device' ? 'On-device' : 'Online'}
        </span>
      </header>
      <div className="v-stage">
        <Pearl
          width={390}
          height={300}
          r={84}
          cy={150}
          scene={phase !== 'listening'}
          mood={mood}
          levelRef={phase === 'listening' ? level : undefined}
          interactive
          label="Akaya"
        />
      </div>
      <div className="v-status">{status}</div>
      <div className="v-text">
        <AnimatePresence mode="wait">
          {phase === 'denied' ? (
            <motion.div key="d" className="card v-denied" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p>Allow microphone access in your browser settings to talk to Akaya. You can also try a demo.</p>
              <div className="v-row">
                <button className="btn btn-ghost btn-sm" onClick={start}>
                  Try again
                </button>
                <button className="btn btn-brand btn-sm" onClick={startDemo}>
                  Demo mode
                </button>
              </div>
            </motion.div>
          ) : reply && phase !== 'listening' ? (
            <motion.p key="r" className="v-reply" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {phase === 'thinking' ? '' : reply}
            </motion.p>
          ) : (
            <motion.p
              key="t"
              className={`v-transcript${transcript ? '' : ' faint'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {transcript
                ? `“${transcript}”`
                : phase === 'listening'
                  ? 'Go ahead, I’m listening'
                  : 'Try: “Remind me to call Rahul at 5”'}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      <div className="v-bars" aria-hidden="true">
        {bars.map((b, i) => (
          <i key={i} style={{ height: 4 + b * 34 }} />
        ))}
      </div>
      <div className="v-controls">
        <button className="icon-btn card" onClick={() => nav('/chat')} aria-label="Type instead">
          <Icon name="keyboard" size={20} />
        </button>
        <button
          className={`v-mic${phase === 'listening' ? ' on' : ''}`}
          onClick={() => (phase === 'listening' ? stop() : start())}
          aria-label={phase === 'listening' ? 'Stop listening' : 'Start listening'}
        >
          <Icon name={phase === 'listening' ? 'stop' : 'mic'} size={30} strokeWidth={2.2} />
        </button>
        <button className="icon-btn card" onClick={startDemo} aria-label="Demo" title="Demo mode">
          <Icon name="spark" size={18} />
        </button>
      </div>
    </Screen>
  );
}
