import { useEffect, useRef, useState } from 'react';
import { Pearl } from '../ui/Pearl';
import { Segmented } from '../ui/Controls';
import { Sheet } from '../ui/Sheet';
import { Icon } from '../ui/Icon';

/* Minimal Web Speech API typing (not in lib.dom) */
interface SR {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type SRCtor = new () => SR;
const getSR = (): SRCtor | undefined => (window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: SRCtor }).webkitSpeechRecognition;

export function VoiceSheet({ open, onClose, onResult, demos }: { open: boolean; onClose: () => void; onResult: (text: string) => void; demos: string[] }) {
  return (
    <Sheet open={open} onClose={onClose} title="Speak to search" height={78}>
      {open && <VoiceBody onResult={onResult} demos={demos} />}
    </Sheet>
  );
}

function VoiceBody({ onResult, demos }: { onResult: (t: string) => void; demos: string[] }) {
  const [lang, setLang] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [phase, setPhase] = useState<'idle' | 'listening' | 'done' | 'error'>('idle');
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const rec = useRef<SR | null>(null);
  const timer = useRef(0);
  const level = useRef(0);
  const supported = !!getSR();

  useEffect(
    () => () => {
      rec.current?.stop();
      window.clearInterval(timer.current);
    },
    [],
  );

  const listen = () => {
    const Ctor = getSR();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = lang;
    r.interimResults = true;
    r.continuous = false;
    let finalText = '';
    r.onresult = (e) => {
      const parts = Array.from(e.results);
      finalText = parts.map((x) => x[0].transcript).join(' ');
      setText(finalText);
      level.current = 0.8;
    };
    r.onerror = (e) => {
      setPhase('error');
      setErr(e.error === 'not-allowed' ? 'Microphone permission was denied.' : `Voice input failed (${e.error}). Try a demo phrase or type instead.`);
    };
    r.onend = () => {
      if (finalText) {
        setPhase('done');
        window.setTimeout(() => onResult(finalText), 500);
      } else setPhase((p) => (p === 'error' ? p : 'idle'));
    };
    rec.current = r;
    setText('');
    setErr('');
    setPhase('listening');
    r.start();
  };

  /** Plays a sample utterance word by word (labelled as simulated). */
  const simulate = (phrase: string) => {
    window.clearInterval(timer.current);
    const words = phrase.split(' ');
    let i = 0;
    setErr('');
    setPhase('listening');
    setText('');
    timer.current = window.setInterval(() => {
      i++;
      level.current = 0.5 + Math.random() * 0.5;
      setText(words.slice(0, i).join(' '));
      if (i >= words.length) {
        window.clearInterval(timer.current);
        level.current = 0;
        setPhase('done');
        window.setTimeout(() => onResult(phrase), 650);
      }
    }, 230);
  };

  return (
    <div className="voice">
      <Segmented
        value={lang}
        onChange={setLang}
        options={[
          { value: 'en-IN', label: 'English / Hinglish' },
          { value: 'hi-IN', label: 'हिन्दी' },
        ]}
      />
      <div className="voice-pearl">
        <Pearl width={190} height={170} r={56} mood={phase === 'listening' ? 'listening' : phase === 'done' ? 'happy' : 'idle'} levelRef={level} glow={1} />
      </div>
      <p className={`voice-text${text ? '' : ' faint'}`}>{text || (phase === 'listening' ? 'Listening…' : 'Try "1500 se kam ka school bag, jaldi chahiye"')}</p>
      {err && <p className="voice-err">{err}</p>}
      {supported ? (
        <button className={`btn btn-block ${phase === 'listening' ? 'btn-ghost' : 'btn-brand'}`} onClick={() => (phase === 'listening' ? rec.current?.stop() : listen())}>
          <Icon name={phase === 'listening' ? 'stop' : 'mic'} size={18} />
          {phase === 'listening' ? 'Stop' : 'Tap to speak'}
        </button>
      ) : (
        <p className="voice-err">Voice input isn't available in this browser. Type instead, or try a demo phrase.</p>
      )}
      <span className="label" style={{ marginTop: 14 }}>
        Demo phrases (simulated voice)
      </span>
      <div className="demo-phrases">
        {demos.map((d) => (
          <button key={d} className="chip" onClick={() => simulate(d)}>
            <Icon name="play" size={12} /> {d}
          </button>
        ))}
      </div>
    </div>
  );
}
