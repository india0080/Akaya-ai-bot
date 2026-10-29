import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Screen, Pearl, type Mood, Icon } from '@akaya/ui';
import { ScreenState } from '../components/ScreenState';
import { useApp } from '../state/store';
import { mockReply } from '../lib/mock';
import { classifyMicError, micCaptureSupported, speechRecognitionSupported } from '../lib/mic';
import { useMicAccess } from '../lib/useMicAccess';
import { createRecognizer, speak, stopSpeaking, type SpeechRec } from '../lib/speech';
import { draftFromText, isReminderRequest, reminderReply, useReminders } from '../features/reminders';
import './Voice.css';

type Phase = 'checking' | 'arming' | 'idle' | 'listening' | 'thinking' | 'speaking' | 'denied' | 'unsupported';
const DEMO_LINE = 'Remind me to call Rahul at 5 PM';
const TRY_LINES = ['Remind me to call Rahul at 5', "What's on today?", 'Translate thank you to Hindi'];
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
  const { state, logActivity } = useApp();
  const reminders = useReminders();
  const nav = useNavigate();
  const access = useMicAccess();
  const [turn, setTurn] = useState<Phase>('idle');
  const phase: Phase =
    turn === 'listening' || turn === 'thinking' || turn === 'speaking' || turn === 'arming'
      ? turn
      : turn === 'denied' || turn === 'unsupported'
        ? turn
        : access === 'checking' || access === 'denied' || access === 'unsupported'
          ? access
          : 'idle';
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

  const startDemo = (line = DEMO_LINE) => {
    setDemo(true);
    setTurn('listening');
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
    const words = line.split(' ');
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
    if (!micCaptureSupported()) {
      setTurn('unsupported');
      return;
    }
    setTurn('arming');
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
      setTurn('listening');
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
    } catch (error) {
      setTurn(classifyMicError(error));
    }
  };

  const stop = () => {
    const heard = transcriptRef.current.trim();
    cleanup();
    setBars(Array(24).fill(0.08));
    setTurn('thinking');
    window.setTimeout(async () => {
      const q = heard || 'Hello';
      let r = heard ? mockReply(q, state.settings.mode) : "I didn't catch that. Try again, or tap a suggestion below.";
      if (heard && isReminderRequest(q)) {
        const { draft, title } = draftFromText(q, state.settings.reminderLead, 'voice');
        if (!draft) reminders.compose({ text: q, source: 'voice' });
        r = reminderReply(q, title, draft, draft ? await reminders.create(draft) : undefined);
      }
      if (heard) logActivity({ kind: 'voice', title: 'Voice Chat', input: heard, output: r });
      setReply(r);
      setTurn('speaking');
      speak(r, state.settings.voiceSpeed, /[\u0900-\u097F]/.test(r) ? 'hi-IN' : 'en-IN', () =>
        setTurn((p) => (p === 'speaking' ? 'idle' : p)),
      );
    }, 900);
  };

  const mood: Mood =
    phase === 'listening'
      ? 'listening'
      : phase === 'thinking' || phase === 'checking' || phase === 'arming'
        ? 'thinking'
        : phase === 'speaking'
          ? 'happy'
          : phase === 'denied' || phase === 'unsupported'
            ? 'sleeping'
            : 'idle';
  const status = {
    checking: 'Checking the microphone…',
    arming: 'Turning the microphone on…',
    idle: 'Tap the mic and just speak',
    listening: demo ? 'Listening… (demo)' : 'Listening…',
    thinking: 'Thinking…',
    speaking: 'Akaya says',
    denied: 'Microphone is blocked',
    unsupported: 'Microphone isn’t available',
  }[phase];
  const captions = speechRecognitionSupported();
  const micBusy = phase === 'checking' || phase === 'arming';

  return (
    <Screen className="voice">
      <header className="v-head">
        <button className="icon-btn card" aria-label="Back to Home" onClick={() => nav('/home')}>
          <Icon name="back" size={20} />
        </button>
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
          {phase === 'denied' || phase === 'unsupported' ? (
            <motion.div key={phase} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ScreenState
                icon={phase === 'unsupported' ? 'mic' : 'alert'}
                body={
                  phase === 'unsupported'
                    ? 'This browser or device has no microphone Akaya can use. Type in Chat, or play a demo of a voice reminder.'
                    : 'Akaya is not allowed to use the microphone. Turn it on in your browser or system settings, then try again. You can also type, or play a demo.'
                }
              >
                <div className="screen-state-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => nav('/chat')}>
                    Type instead
                  </button>
                  {phase === 'denied' && (
                    <button className="btn btn-ghost btn-sm" onClick={start}>
                      Try again
                    </button>
                  )}
                  <button className="btn btn-brand btn-sm" onClick={() => startDemo()}>
                    Demo mode
                  </button>
                </div>
              </ScreenState>
            </motion.div>
          ) : phase === 'checking' || phase === 'arming' ? (
            <motion.div key={phase} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ScreenState busy body="Hang on while Akaya connects to the microphone." />
            </motion.div>
          ) : reply && phase !== 'listening' ? (
            <motion.p key="r" className="v-reply" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {phase === 'thinking' ? '' : reply}
            </motion.p>
          ) : !transcript && phase !== 'listening' ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <ScreenState
                icon="mic"
                tone="violet"
                body={
                  captions
                    ? 'Nothing heard yet. Tap the mic, or play a sample line.'
                    : 'Nothing heard yet. This browser has no live captions, so Demo mode is the way to preview Voice.'
                }
              >
                <div className="screen-state-chips">
                  {TRY_LINES.map((line) => (
                    <button key={line} className="card" onClick={() => startDemo(line)}>
                      {line}
                    </button>
                  ))}
                </div>
              </ScreenState>
            </motion.div>
          ) : (
            <motion.p
              key="t"
              className={`v-transcript${transcript ? '' : ' faint'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {transcript ? `“${transcript}”` : 'Go ahead, I’m listening'}
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
          disabled={micBusy}
          aria-busy={micBusy}
          aria-label={phase === 'listening' ? 'Stop listening' : micBusy ? status : 'Start listening'}
        >
          {micBusy ? (
            <span className="screen-state-spin light" />
          ) : (
            <Icon name={phase === 'listening' ? 'stop' : 'mic'} size={30} strokeWidth={2.2} />
          )}
        </button>
        <button className="icon-btn card" onClick={() => startDemo()} aria-label="Demo" title="Demo mode">
          <Icon name="spark" size={18} />
        </button>
      </div>
    </Screen>
  );
}
