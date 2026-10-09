import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Screen, ScreenHeader, Pearl, Icon, useToast, Sheet } from '@akaya/ui';
import { useApp } from '../../state/store';
import { fmtTime } from '../../lib/time';
import { MODE_BY_ID } from '../../notes/modes';
import { fmtClock, fmtSize, toMarkdown } from '../../notes/export';
import { deleteAudio, getAudio } from '../../notes/audioStore';
import type { VoiceNote } from '../../notes/types';
import { NotePanels, TabBar, Wave, type NoteTab } from './NotePanels';
import { RecentList } from './RecentList';
import './VoiceNotes.css';

function staticWave(id: string, n = 46): number[] {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return Array.from({ length: n }, (_, i) => {
    h = (h * 1103515245 + 12345) >>> 0;
    return 0.18 + (((h >>> 8) % 1000) / 1000) * 0.62 * (0.6 + 0.4 * Math.sin(i / 3));
  });
}

export function NoteView() {
  const { id } = useParams();
  const { state } = useApp();
  const v = state.voiceNotes.find((x) => x.id === id);
  if (!v)
    return (
      <Screen className="vn">
        <ScreenHeader title="Voice Notes" />
        <div className="card vn-err">
          <b>Recording not found</b>
          <p>It may have been deleted.</p>
        </div>
      </Screen>
    );
  return <Viewer key={v.id} v={v} />;
}

const SPEEDS = [1, 1.5, 2];

function Viewer({ v }: { v: VoiceNote }) {
  const nav = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const { state, updateVoiceNote, deleteVoiceNote } = useApp();
  const m = MODE_BY_ID[v.mode];
  const [tab, setTab] = useState<NoteTab>((params.get('tab') as NoteTab) || 'notes');
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [url, setUrl] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [wave] = useState(() => staticWave(v.id));
  const audio = useRef<HTMLAudioElement>(null);
  const level = useRef(0);
  const dur = Math.max(1, v.duration);

  useEffect(() => {
    if (!v.audio) return;
    let u: string | null = null;
    getAudio(v.id)
      .then((b) => {
        if (b) {
          u = URL.createObjectURL(b);
          setUrl(u);
        }
      })
      .catch(() => {});
    return () => {
      if (u) URL.revokeObjectURL(u);
    };
  }, [v.id, v.audio]);

  // transcript playback clock for recordings without audio (samples)
  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => {
      level.current = 0.2 + Math.random() * 0.5;
      if (url) return;
      setPos((p) => {
        const n = p + 0.1 * speed;
        if (n >= dur) {
          setPlaying(false);
          return dur;
        }
        return n;
      });
    }, 100);
    return () => {
      window.clearInterval(t);
      level.current = 0;
    };
  }, [playing, url, speed, dur]);

  const seek = (t: number) => {
    const n = Math.min(dur, Math.max(0, t));
    setPos(n);
    if (audio.current) audio.current.currentTime = n;
  };
  const toggle = () => {
    if (url && audio.current) {
      if (playing) audio.current.pause();
      else audio.current.play().catch(() => setPlaying(false));
    }
    if (!url && !playing && pos >= dur) setPos(0);
    setPlaying(!playing);
  };
  const cycleSpeed = () => {
    const s = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(s);
    if (audio.current) audio.current.playbackRate = s;
  };

  const active = [...v.segments].reverse().find((s) => s.t <= pos + 0.05);
  const md = () => toMarkdown(v);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(md());
      toast('Notes copied', 'copy');
    } catch {
      toast('Copy is not available here', 'help');
    }
  };
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: v.title, text: md() });
      } catch {
        /* cancelled */
      }
    } else copy();
  };
  const exportMd = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([md()], { type: 'text/markdown' }));
    a.download = `${
      v.title
        .replace(/[^\w\- ]+/g, '')
        .trim()
        .replace(/\s+/g, '-') || 'voice-note'
    }.md`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Exported as Markdown', 'download');
  };
  const remove = () => {
    deleteVoiceNote(v.id);
    if (v.audio) deleteAudio(v.id);
    toast('Recording deleted', 'trash');
    nav('/vnotes', { replace: true });
  };

  const others = state.voiceNotes.filter((x) => x.id !== v.id).slice(0, 3);

  return (
    <Screen className="vn">
      <ScreenHeader
        title={m.label}
        sub={`${new Date(v.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${fmtTime(v.createdAt)}`}
        right={
          <button className="icon-btn card" onClick={() => setConfirmDel(true)} aria-label="Delete recording">
            <Icon name="trash" size={18} />
          </button>
        }
      />

      <section className="vn-rec player">
        <div className="vn-rec-top">
          <div className="vn-pearl">
            <Pearl
              width={104}
              height={104}
              r={30}
              mood={playing ? 'listening' : 'happy'}
              levelRef={level}
              shadow={false}
              glow={0.45}
            />
          </div>
          <div className="vn-rec-info">
            <span className="vn-status done">
              <i />
              {v.audio ? 'Saved recording' : 'Sample · transcript playback'}
            </span>
            <div className="vn-title big">{v.title}</div>
            <div className="vn-chips">
              <span>
                <Icon name="clock" size={12} /> {fmtClock(v.duration)}
              </span>
              <span>
                <Icon name={m.icon} size={12} /> {v.subject}
                {v.level ? ` · ${v.level}` : ''}
              </span>
              {v.size ? <span>{fmtSize(v.size)}</span> : null}
            </div>
          </div>
        </div>
        <Wave levels={wave} progress={pos / dur} />
        <input
          className="vn-scrub"
          type="range"
          min={0}
          max={dur}
          step={0.1}
          value={pos}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Seek"
          style={{ ['--p' as string]: `${(pos / dur) * 100}%` }}
        />
        <div className="vn-times">
          <span>{fmtClock(pos)}</span>
          <span>{fmtClock(dur)}</span>
        </div>
        <div className="vn-ctrls play">
          <button className="vn-c sm" onClick={cycleSpeed} aria-label="Playback speed">
            <span className="vn-speed">{speed}×</span>
          </button>
          <button className="vn-c" onClick={() => seek(pos - 5)} aria-label="Back 5 seconds">
            <span>
              <Icon name="back5" size={22} />
            </span>
          </button>
          <button className="vn-play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
            <Icon name={playing ? 'pause' : 'play'} size={26} fill />
          </button>
          <button className="vn-c" onClick={() => seek(pos + 5)} aria-label="Forward 5 seconds">
            <span>
              <Icon name="fwd5" size={22} />
            </span>
          </button>
          <button className="vn-c sm" onClick={() => setTab('transcript')} aria-label="Show transcript">
            <span className="vn-speed">
              <Icon name="text" size={16} />
            </span>
          </button>
        </div>
        {v.bookmarks.length > 0 && (
          <div className="vn-bms">
            <Icon name="bookmark" size={13} fill />
            {v.bookmarks.map((b) => (
              <button key={b} onClick={() => seek(b)}>
                {fmtClock(b)}
              </button>
            ))}
          </div>
        )}
        {url && (
          <audio
            ref={audio}
            src={url}
            onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
            onEnded={() => setPlaying(false)}
            onPause={() => setPlaying(false)}
            onPlay={() => setPlaying(true)}
          />
        )}
      </section>

      <div className="vn-share">
        <button className="card" onClick={copy}>
          <Icon name="copy" size={17} /> Copy
        </button>
        <button className="card" onClick={share}>
          <Icon name="share" size={17} /> Share
        </button>
        <button className="card" onClick={exportMd}>
          <Icon name="download" size={17} /> Export
        </button>
        <button
          className="card"
          onClick={() => nav(`/chat?new=1&q=${encodeURIComponent(`Make a revision quiz from my notes "${v.title}"`)}`)}
        >
          <Icon name="ask" size={17} /> Ask
        </button>
      </div>

      <TabBar tab={tab} onTab={setTab} counts={{ actions: v.notes.actions.filter((a) => !a.done).length }} />
      <NotePanels
        tab={tab}
        mode={v.mode}
        segments={v.segments}
        notes={v.notes}
        bookmarks={v.bookmarks}
        activeId={playing || pos > 0 ? active?.id : undefined}
        onSeek={(t) => {
          seek(t);
          if (!playing) toggle();
        }}
        onToggleAction={(aid) =>
          updateVoiceNote(v.id, (x) => ({
            ...x,
            notes: { ...x.notes, actions: x.notes.actions.map((a) => (a.id === aid ? { ...a, done: !a.done } : a)) },
          }))
        }
      />

      {others.length > 0 && (
        <>
          <div className="sec-head">
            <h3>Recent recordings</h3>
            <button className="pill-link" onClick={() => nav('/vnotes')}>
              View all <Icon name="chev" size={13} strokeWidth={2.6} />
            </button>
          </div>
          <RecentList notes={others} />
        </>
      )}

      <Sheet open={confirmDel} onClose={() => setConfirmDel(false)} title="Delete recording?" height={42}>
        <p className="vn-del-p">
          “{v.title}”: the transcript, notes{v.audio ? ' and audio' : ''} will be removed from this device.
        </p>
        <div className="vn-err-btns">
          <button className="btn btn-ghost" onClick={() => setConfirmDel(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={remove}>
            Delete
          </button>
        </div>
      </Sheet>
    </Screen>
  );
}
