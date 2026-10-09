import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Screen, ScreenHeader, Icon, useToast } from '@akaya/ui';
import { useApp } from '../state/store';
import { LANGS, PHRASES, translate } from '../lib/mock';
import { speak } from '../lib/speech';
import './Features.css';

const SPEECH: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  es: 'es-ES',
  fr: 'fr-FR',
  ja: 'ja-JP',
  ar: 'ar-SA',
};

function Picker({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <label className="lang-pick card">
      <small>{label}</small>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name} · {l.native}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Translate() {
  const { state, logActivity } = useApp();
  const toast = useToast();
  // Opened from History: ?text=…&out=…&from=hi&to=en restores a saved translation.
  const [params] = useSearchParams();
  const saved = { text: params.get('text'), out: params.get('out') };
  const [from, setFrom] = useState(params.get('from') ?? 'hi');
  const [to, setTo] = useState(params.get('to') ?? 'en');
  const [text, setText] = useState(saved.text ?? PHRASES[0].hi);
  const [spin, setSpin] = useState(0);
  const out = saved.text && saved.out && text === saved.text ? saved.out : translate(text, to);
  const langName = (c: string) => LANGS.find((l) => l.code === c)?.name ?? c;
  const save = (t: string, result: string | null) => {
    if (!t.trim() || !result) return;
    logActivity({
      kind: 'translation',
      title: `Translate to ${langName(to)}`,
      langs: `${langName(from)} → ${langName(to)}`,
      input: t.trim(),
      output: result,
    });
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
    if (out) setText(out);
    setSpin((s) => s + 180);
  };
  return (
    <Screen className="feature">
      <ScreenHeader title="Translate" sub="99+ languages · sample phrasebook in this demo" />
      <div className="tr-langs">
        <Picker value={from} onChange={setFrom} label="From" />
        <motion.button className="tr-swap" onClick={swap} animate={{ rotate: spin }} aria-label="Swap languages">
          <Icon name="swap" size={20} strokeWidth={2.2} />
        </motion.button>
        <Picker value={to} onChange={setTo} label="To" />
      </div>
      <div className="card tr-box">
        <textarea
          className="tr-in"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => save(text, out)}
          placeholder="Type or paste text…"
          aria-label="Text to translate"
        />
        <div className="tr-tools">
          <button onClick={() => speak(text, state.settings.voiceSpeed, SPEECH[from])} aria-label="Listen">
            <Icon name="volume" size={18} />
          </button>
          <span className="grow" />
          <span className="faint">{text.length}/500</span>
        </div>
      </div>
      <motion.div key={out ?? 'none'} className="tr-out" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <small>{LANGS.find((l) => l.code === to)?.name}</small>
        <p>
          {out === null
            ? 'This demo translates the sample phrases below. Live translation connects to the Akaya API.'
            : out || '…'}
        </p>
        <div className="tr-tools">
          <button
            onClick={() => out && speak(out, state.settings.voiceSpeed, SPEECH[to])}
            aria-label="Listen to translation"
          >
            <Icon name="volume" size={18} />
          </button>
          <button
            onClick={() => {
              if (!out) return;
              navigator.clipboard?.writeText(out).catch(() => {});
              toast('Translation copied', 'copy');
            }}
            aria-label="Copy translation"
          >
            <Icon name="copy" size={18} />
          </button>
        </div>
      </motion.div>
      <h4 className="set-h">Try a phrase</h4>
      <div className="tr-phrases">
        {PHRASES.map((p) => (
          <button
            key={p.en}
            className="card"
            onClick={() => {
              setText(p[from]);
              save(p[from], translate(p[from], to));
            }}
          >
            {p[from]}
          </button>
        ))}
      </div>
    </Screen>
  );
}
