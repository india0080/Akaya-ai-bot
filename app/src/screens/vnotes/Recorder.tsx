import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Pearl } from '../../components/Pearl';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { useApp } from '../../state/store';
import { uid, fmtTime } from '../../lib/time';
import { notesProvider, buildNotes, MODE_BY_ID } from '../../notes';
import { LiveRecorder, speechSupported } from '../../notes/recorder';
import { putAudio } from '../../notes/audioStore';
import { fmtClock } from '../../notes/export';
import { BUSINESS, LECTURE, type ScriptLine } from '../../notes/scripts';
import type { LectureLevel, NoteMeta, NoteModeId, Segment, SpeechLang, StructuredNotes } from '../../notes/types';
import { NotePanels, TabBar, Wave, type NoteTab } from './NotePanels';
import './VoiceNotes.css';

type Phase = 'starting' | 'recording' | 'paused' | 'saving' | 'error';
const WORD_S = 0.2;
const BARS = 34;

/**
 * Live recording: timer, mic-driven waveform and pearl, live transcript, and notes that rebuild
 * through the NotesProvider after every new sentence. `?demo=lecture|business` streams a sample.
 */
export function Recorder() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const { saveVoiceNote } = useApp();
  const demo = params.get('demo') as 'lecture' | 'business' | null;
  const mode = (params.get('mode') as NoteModeId) || (demo === 'business' ? 'business' : 'lecture');
  const m = MODE_BY_ID[mode] ?? MODE_BY_ID.lecture;
  const meta: NoteMeta = {
    mode: m.id,
    title: params.get('title') || (demo === 'business' ? 'Q4 launch plan – Akaya Pro' : m.defaultTitle),
    subject: params.get('subject') || (demo === 'business' ? 'Business' : m.defaultSubject),
    level: m.id === 'lecture' ? (params.get('level') as LectureLevel) || 'University' : undefined,
  };
  const metaRef = useRef(meta);

  const [phase, setPhase] = useState<Phase>('starting');
  const [error, setError] = useState('');
  const [lang, setLang] = useState<SpeechLang>((params.get('lang') as SpeechLang) || 'en-IN');
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [interim, setInterim] = useState('');
  const [notes, setNotes] = useState<StructuredNotes>(() => buildNotes([], meta));
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [bars, setBars] = useState<number[]>(() => Array(BARS).fill(0.06));
  const [tab, setTab] = useState<NoteTab>((params.get('tab') as NoteTab) || 'notes');
  const [warn, setWarn] = useState('');

  const level = useRef(0);
  const clock = useRef({ acc: 0, since: 0, running: false });
  const rec = useRef<LiveRecorder | null>(null);
  const segsRef = useRef<Segment[]>([]);
  const demoDone = useRef(0);
  const interimAt = useRef<number | null>(null);
  const langRef = useRef(lang);

  const now = () => {
    const c = clock.current;
    return (c.acc + (c.running ? performance.now() - c.since : 0)) / 1000;
  };
  const addSegment = (s: Segment) => {
    segsRef.current = [...segsRef.current, s];
    setSegments(segsRef.current);
    notesProvider
      .update(segsRef.current, metaRef.current)
      .then(setNotes, () => setWarn('Notes could not update. Your transcript is safe.'));
  };

  // start: mic + speech, or the demo stream
  useEffect(() => {
    let alive = true;
    const go = async () => {
      await Promise.resolve();
      if (!demo) {
        const r = new LiveRecorder(langRef.current, {
          onInterim: (t) => {
            if (t && interimAt.current === null) interimAt.current = now();
            setInterim(t);
          },
          onFinal: (t) => {
            const at = interimAt.current ?? now();
            interimAt.current = null;
            setInterim('');
            addSegment({ id: uid(), t: Math.max(0, at - 0.3), text: t, lang: langRef.current });
          },
          onError: setWarn,
        });
        try {
          await r.start();
        } catch {
          if (alive) {
            setPhase('error');
            setError('Microphone access is needed to record. Allow it in your browser, or try a sample.');
          }
          return;
        }
        if (!alive) {
          r.stop();
          return;
        }
        rec.current = r;
        if (!speechSupported()) setWarn('Live transcription needs Chrome or Edge. Audio is still being recorded.');
      }
      if (!alive) return;
      clock.current = { acc: 0, since: performance.now(), running: true };
      setStartedAt(Date.now());
      setPhase('recording');
    };
    go();
    return () => {
      alive = false;
      rec.current?.stop();
      rec.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // clock tick: timer, waveform, demo stream
  useEffect(() => {
    const script: ScriptLine[] | null = demo === 'business' ? BUSINESS : demo ? LECTURE : null;
    const id = window.setInterval(() => {
      if (!clock.current.running) return;
      const t = now();
      setElapsed(t);
      if (script) {
        let speaking = false;
        let partial = '';
        for (let i = demoDone.current; i < script.length; i++) {
          const line = script[i];
          if (t < line.at) break;
          const words = line.text.split(' ');
          const shown = Math.floor((t - line.at) / WORD_S) + 1;
          if (shown >= words.length) {
            demoDone.current = i + 1;
            addSegment({
              id: `d${i}`,
              t: line.at,
              text: line.text,
              speaker: line.speaker,
              lang: line.lang ?? 'en-IN',
              hint: line.hint,
            });
          } else {
            partial = (line.speaker ? '' : '') + words.slice(0, shown).join(' ');
            speaking = true;
            break;
          }
        }
        setInterim(partial);
        level.current = speaking ? 0.25 + Math.random() * 0.55 : 0.03 + Math.random() * 0.04;
      } else level.current = rec.current?.level ?? 0;
      setBars((b) => [...b.slice(1), Math.max(0.06, level.current)]);
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pause = () => {
    const c = clock.current;
    if (phase === 'recording') {
      c.acc += performance.now() - c.since;
      c.running = false;
      rec.current?.pause();
      level.current = 0;
      setPhase('paused');
    } else if (phase === 'paused') {
      c.since = performance.now();
      c.running = true;
      rec.current?.resume();
      setPhase('recording');
    }
  };

  const bookmark = () => {
    const t = now();
    setBookmarks((b) => [...b, t]);
    toast(`Bookmarked at ${fmtClock(t)}`, 'bookmark');
  };

  const switchLang = () => {
    const next: SpeechLang = lang === 'en-IN' ? 'hi-IN' : 'en-IN';
    langRef.current = next;
    setLang(next);
    rec.current?.setLang(next);
    toast(next === 'hi-IN' ? 'Listening in Hindi (hi-IN)' : 'Listening in English (en-IN)', 'lang');
  };

  const stop = async () => {
    if (phase !== 'recording' && phase !== 'paused') return;
    const duration = now();
    clock.current.running = false;
    setPhase('saving');
    const id = uid();
    let audio = false;
    let size: number | undefined;
    const r = rec.current;
    rec.current = null;
    if (r) {
      const blob = await r.stop();
      if (blob) {
        try {
          await putAudio(id, blob);
          audio = true;
          size = blob.size;
        } catch {
          setWarn('Could not store the audio on this device.');
        }
      }
    }
    // keep any words still being spoken
    let segs = segsRef.current;
    if (interim.trim() && !demo)
      segs = [...segs, { id: uid(), t: Math.max(0, duration - 2), text: interim.trim(), lang }];
    const final = await notesProvider.update(segs, metaRef.current).catch(() => buildNotes(segs, metaRef.current));
    saveVoiceNote({
      id,
      ...metaRef.current,
      lang,
      createdAt: startedAt || Date.now(),
      duration: Math.round(duration),
      segments: segs,
      bookmarks,
      notes: final,
      audio,
      size: size ?? (demo ? Math.round(duration * 16000) : undefined),
      sample: !!demo,
    });
    toast('Notes saved', 'check');
    nav(`/vnotes/${id}`, { replace: true });
  };

  const live = phase === 'recording';
  const last = segments[segments.length - 1];
  const caption = interim || last?.text || (live ? 'Listening…' : '');

  return (
    <Screen className="vn">
      <ScreenHeader
        title={m.label}
        sub={demo ? 'Demo · sample recording' : 'Record, transcribe, take notes'}
        right={
          <button className="vn-lang-btn card" onClick={switchLang} aria-label="Switch language">
            <Icon name="lang" size={15} /> {lang === 'en-IN' ? 'EN' : 'हि'}
          </button>
        }
      />

      {phase === 'error' ? (
        <div className="card vn-err">
          <Pearl width={120} height={110} r={36} mood="sleeping" shadow={false} />
          <b>Can’t use the microphone</b>
          <p>{error}</p>
          <div className="vn-err-btns">
            <button className="btn btn-ghost" onClick={() => nav('/vnotes/rec?demo=lecture', { replace: true })}>
              Sample lecture
            </button>
            <button className="btn btn-primary" onClick={() => nav('/vnotes/rec?demo=business', { replace: true })}>
              Sample meeting
            </button>
          </div>
        </div>
      ) : (
        <section className="vn-rec">
          <div className="vn-rec-top">
            <div className="vn-pearl">
              <Pearl
                width={140}
                height={140}
                r={34}
                mood={live ? 'listening' : phase === 'saving' ? 'thinking' : 'idle'}
                levelRef={level}
                shadow={false}
                glow={0.5}
              />
            </div>
            <div className="vn-rec-info">
              <span className={`vn-status ${phase}`}>
                <i />
                {phase === 'recording'
                  ? 'Recording…'
                  : phase === 'paused'
                    ? 'Paused'
                    : phase === 'saving'
                      ? 'Saving notes…'
                      : 'Starting…'}
              </span>
              <div className="vn-timer">{fmtClock(elapsed)}</div>
              <div className="vn-title">{meta.title}</div>
            </div>
          </div>
          <Wave levels={bars} />
          <div className="vn-chips">
            <span>
              <Icon name="clock" size={12} /> {startedAt ? fmtTime(startedAt) : '--:--'}
            </span>
            <span>
              <Icon name="cal" size={12} />{' '}
              {new Date(startedAt || 0).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span>
              <Icon name={m.icon} size={12} /> {meta.subject}
              {meta.level ? ` · ${meta.level}` : ''}
            </span>
          </div>
          <div className="vn-caption" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.p key={last?.id ?? 'none'} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}>
                {caption}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="vn-ctrls">
            <button className="vn-c" onClick={bookmark} disabled={!live} aria-label="Bookmark">
              <span>
                <Icon name="bookmark" size={20} />
                {bookmarks.length > 0 && <em>{bookmarks.length}</em>}
              </span>
              Bookmark
            </button>
            <button
              className="vn-stop"
              onClick={stop}
              disabled={phase !== 'recording' && phase !== 'paused'}
              aria-label="Stop and save"
            >
              <span className="vn-stop-ring" />
              <span className="vn-stop-sq" />
            </button>
            <button
              className="vn-c"
              onClick={pause}
              disabled={phase !== 'recording' && phase !== 'paused'}
              aria-label={phase === 'paused' ? 'Resume' : 'Pause'}
            >
              <span>
                <Icon name={phase === 'paused' ? 'play' : 'pause'} size={20} />
              </span>
              {phase === 'paused' ? 'Resume' : 'Pause'}
            </button>
          </div>
        </section>
      )}

      {warn && (
        <p className="vn-warn">
          <Icon name="help" size={14} /> {warn}
        </p>
      )}

      {phase !== 'error' && (
        <>
          <TabBar tab={tab} onTab={setTab} counts={{ actions: notes.actions.length }} />
          <NotePanels
            tab={tab}
            mode={m.id}
            segments={segments}
            interim={interim}
            notes={notes}
            live={live}
            bookmarks={bookmarks}
          />
          <p className="vn-foot">Notes are generated automatically and may miss details. Check before sharing.</p>
        </>
      )}
    </Screen>
  );
}
