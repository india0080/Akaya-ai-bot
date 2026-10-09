import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Pearl } from '../../components/Pearl';
import { Icon } from '../../components/Icon';
import { Segmented } from '../../components/Controls';
import { useApp } from '../../state/store';
import { MODES, MODE_BY_ID } from '../../notes/modes';
import { speechSupported } from '../../notes/recorder';
import type { LectureLevel, NoteModeId, SpeechLang, VoiceNote } from '../../notes/types';
import { RecentList } from './RecentList';
import './VoiceNotes.css';

/** Voice Notes home: pick a mode, set title/subject/language, record or try a live sample. */
export function VoiceNotes() {
  const nav = useNavigate();
  const { state } = useApp();
  const [mode, setMode] = useState<NoteModeId>('lecture');
  const [level, setLevel] = useState<LectureLevel>('University');
  const [lang, setLang] = useState<SpeechLang>('en-IN');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [all, setAll] = useState(false);
  const m = MODE_BY_ID[mode];
  const notes: VoiceNote[] = state.voiceNotes;

  const start = () => {
    const p = new URLSearchParams({
      mode,
      lang,
      title: title.trim() || m.defaultTitle,
      subject: subject.trim() || m.defaultSubject,
    });
    if (mode === 'lecture') p.set('level', level);
    nav(`/vnotes/rec?${p}`);
  };

  return (
    <Screen className="vn">
      <ScreenHeader title="Voice Notes" sub="Live transcript → smart notes" />

      <section className="vn-hero">
        <Pearl width={112} height={104} r={32} mood="listening" shadow={false} glow={0.45} />
        <div>
          <b>Record anything. Akaya writes the notes.</b>
          <p>Lectures, meetings, calls or ideas. Watch the transcript and notes build live.</p>
          <div className="vn-hero-tags">
            <span>Transcript</span>
            <span>Notes</span>
            <span>Mind map</span>
            <span>Actions</span>
          </div>
        </div>
      </section>

      <h3 className="vn-h">Choose a mode</h3>
      <div className="vn-modes" role="radiogroup" aria-label="Recording mode">
        {MODES.map((x) => (
          <button
            key={x.id}
            role="radio"
            aria-checked={mode === x.id}
            className={`vn-mode${mode === x.id ? ' on' : ''}`}
            onClick={() => setMode(x.id)}
          >
            <span className={`gi gi-${x.tone}`}>
              <Icon name={x.icon} size={19} />
            </span>
            {x.short}
          </button>
        ))}
      </div>

      <div className="card vn-setup">
        <div className="vn-focus">
          <b>{m.label}</b>
          <small>{m.focus}</small>
        </div>
        {mode === 'lecture' && (
          <Segmented<LectureLevel>
            className="full"
            value={level}
            onChange={setLevel}
            options={[
              { value: 'School', label: 'School' },
              { value: 'College', label: 'College' },
              { value: 'University', label: 'University' },
            ]}
          />
        )}
        <label className="vn-field">
          <span>Title</span>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={m.defaultTitle}
          />
        </label>
        <div className="vn-row2">
          <label className="vn-field">
            <span>{mode === 'lecture' ? 'Subject' : 'Tag'}</span>
            <input
              className="input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={m.defaultSubject}
            />
          </label>
          <div className="vn-field">
            <span>Language</span>
            <Segmented<SpeechLang>
              className="full"
              value={lang}
              onChange={setLang}
              options={[
                { value: 'en-IN', label: 'English' },
                { value: 'hi-IN', label: 'हिन्दी' },
              ]}
            />
          </div>
        </div>
        <button className="btn btn-primary btn-block vn-start" onClick={start}>
          <Icon name="mic" size={19} /> Start recording
        </button>
        {!speechSupported() && (
          <p className="vn-note">Live transcription works in Chrome and Edge. Other browsers still record audio.</p>
        )}
      </div>

      <h3 className="vn-h">Try a live demo</h3>
      <div className="vn-demos">
        <button className="card vn-demo" onClick={() => nav('/vnotes/rec?demo=lecture&mode=lecture&level=University')}>
          <span className="gi gi-blue">
            <Icon name="cap" size={19} />
          </span>
          <span>
            <b>Sample lecture</b>
            <small>Linear algebra, 1 min</small>
          </span>
        </button>
        <button className="card vn-demo" onClick={() => nav('/vnotes/rec?demo=business&mode=business')}>
          <span className="gi gi-orange">
            <Icon name="brief" size={19} />
          </span>
          <span>
            <b>Business meeting</b>
            <small>Q4 launch plan, 1 min</small>
          </span>
        </button>
      </div>

      <div className="sec-head">
        <h3>Recent recordings</h3>
        {notes.length > 3 && (
          <button className="pill-link" onClick={() => setAll(!all)}>
            {all ? 'Show less' : 'View all'} <Icon name="chev" size={13} strokeWidth={2.6} />
          </button>
        )}
      </div>
      <RecentList notes={all ? notes : notes.slice(0, 3)} />
    </Screen>
  );
}
