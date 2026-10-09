import { AnimatePresence, motion } from 'framer-motion';
import { Icon, type IconName } from '../../components/Icon';
import { MODE_BY_ID } from '../../notes/modes';
import { fmtClock } from '../../notes/export';
import type { NoteModeId, Segment, StructuredNotes } from '../../notes/types';
import { MindMap } from './MindMap';

export type NoteTab = 'transcript' | 'notes' | 'summary' | 'mind' | 'actions';
const TABS: { id: NoteTab; label: string; icon: IconName }[] = [
  { id: 'transcript', label: 'Transcript', icon: 'text' },
  { id: 'notes', label: 'Notes', icon: 'note' },
  { id: 'summary', label: 'Summary', icon: 'spark' },
  { id: 'mind', label: 'Mind map', icon: 'mindmap' },
  { id: 'actions', label: 'Action items', icon: 'task' },
];

export function TabBar({
  tab,
  onTab,
  counts,
}: {
  tab: NoteTab;
  onTab: (t: NoteTab) => void;
  counts?: Partial<Record<NoteTab, number>>;
}) {
  return (
    <div className="vn-tabs" role="tablist">
      {TABS.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={tab === t.id}
          className={`vn-tab${tab === t.id ? ' on' : ''}`}
          onClick={() => onTab(t.id)}
        >
          <Icon name={t.icon} size={15} strokeWidth={2.1} />
          {t.label}
          {!!counts?.[t.id] && <em>{counts[t.id]}</em>}
        </button>
      ))}
    </div>
  );
}

const initials = (n: string) => (n === 'You' ? 'Me' : n.slice(0, 1));

interface Props {
  tab: NoteTab;
  mode: NoteModeId;
  segments: Segment[];
  notes: StructuredNotes;
  interim?: string;
  live?: boolean;
  bookmarks?: number[];
  activeId?: string;
  onSeek?: (t: number) => void;
  onToggleAction?: (id: string) => void;
}

/** The five note views, shared by the live recorder and the saved-note screen. */
export function NotePanels({
  tab,
  mode,
  segments,
  notes,
  interim,
  live,
  bookmarks = [],
  activeId,
  onSeek,
  onToggleAction,
}: Props) {
  const m = MODE_BY_ID[mode];
  const empty = (text: string) => (
    <div className="vn-empty">
      <Icon name="wave" size={22} />
      <p>{text}</p>
    </div>
  );

  if (tab === 'transcript')
    return (
      <div className="card vn-panel">
        <div className="vn-ph">
          <b>{live ? 'Live transcript' : 'Transcript'}</b>
          {live && <span className="vn-live">Live</span>}
          <span className="grow" />
          <small>{segments.length} lines</small>
        </div>
        {!segments.length &&
          !interim &&
          empty(live ? 'Start speaking. Words appear here as you talk.' : 'No transcript.')}
        <div className="vn-lines">
          {segments.map((s) => {
            const marked = bookmarks.some((b) => b >= s.t - 0.5 && b < s.t + 6);
            return (
              <motion.button
                key={s.id}
                className={`vn-line${activeId === s.id ? ' on' : ''}`}
                onClick={() => onSeek?.(s.t)}
                initial={live ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="vn-t">{fmtClock(s.t)}</span>
                <span className="vn-tx">
                  {s.speaker && <b className="vn-spk">{s.speaker}</b>}
                  {s.text}
                  {s.lang === 'hi-IN' && <i className="vn-lang">हि</i>}
                </span>
                {marked && <Icon name="bookmark" size={13} className="vn-bm" fill />}
              </motion.button>
            );
          })}
          {interim && (
            <div className="vn-line interim">
              <span className="vn-t">•••</span>
              <span className="vn-tx">{interim}</span>
            </div>
          )}
        </div>
      </div>
    );

  if (tab === 'notes')
    return (
      <div className="card vn-panel">
        <div className="vn-ph">
          <b>{m.notesTitle}</b>
          <span className="vn-auto">
            <Icon name="spark" size={11} strokeWidth={2.4} /> Auto-generated
          </span>
          {live && <span className="vn-live">Updating</span>}
        </div>
        {!notes.sections.length && empty('Notes build here as the recording goes on.')}
        {notes.attendees.length > 0 && (
          <div className="vn-att">
            <Icon name="users" size={15} />
            {notes.attendees.map((a) => (
              <span key={a} className="vn-chip">
                <i>{initials(a)}</i>
                {a}
              </span>
            ))}
          </div>
        )}
        <ol className="vn-secs">
          <AnimatePresence initial={false}>
            {notes.sections.map((s, i) => (
              <motion.li key={s.heading + i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <h4>
                  <span>{i + 1}</span>
                  {s.heading}
                </h4>
                {s.formula && <div className="vn-formula">{s.formula}</div>}
                <ul>
                  {s.points.map((p) => (
                    <motion.li key={p} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}>
                      {p}
                    </motion.li>
                  ))}
                </ul>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
        {notes.terms.length > 0 && (
          <div className="vn-block">
            <h5>Key terms</h5>
            {notes.terms.map((t) => (
              <p key={t.term} className="vn-term">
                <b>{t.term}</b> {t.def}
              </p>
            ))}
          </div>
        )}
        {notes.decisions.length > 0 && (
          <div className="vn-block">
            <h5>Decisions</h5>
            {notes.decisions.map((d) => (
              <p key={d} className="vn-dec">
                <Icon name="check" size={14} strokeWidth={2.6} /> {d}
              </p>
            ))}
          </div>
        )}
      </div>
    );

  if (tab === 'summary')
    return (
      <div className="card vn-panel">
        <div className="vn-ph">
          <b>Summary</b>
          {live && <span className="vn-live">Live</span>}
        </div>
        {!notes.summary.length ? (
          empty('A summary appears after the first few sentences.')
        ) : (
          <>
            <p className="vn-tldr">{notes.tldr}</p>
            <ul className="vn-sum">
              {notes.summary.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <div className="vn-stats">
              <span>
                <b>{notes.sections.length}</b>topics
              </span>
              <span>
                <b>{segments.reduce((n, s) => n + s.text.split(/\s+/).length, 0)}</b>words
              </span>
              <span>
                <b>{notes.actions.length}</b>
                {mode === 'lecture' ? 'tasks' : 'actions'}
              </span>
              {notes.attendees.length > 0 && (
                <span>
                  <b>{notes.attendees.length}</b>people
                </span>
              )}
            </div>
          </>
        )}
      </div>
    );

  if (tab === 'mind')
    return (
      <div className="card vn-panel">
        <div className="vn-ph">
          <b>Mind map</b>
          {live && <span className="vn-live">Live</span>}
        </div>
        {notes.mindmap.children.length ? (
          <MindMap root={notes.mindmap} />
        ) : (
          empty('Topics branch out here as they come up.')
        )}
      </div>
    );

  return (
    <div className="card vn-panel">
      <div className="vn-ph">
        <b>Action items</b>
        <span className="grow" />
        <small>
          {notes.actions.filter((a) => a.done).length}/{notes.actions.length} done
        </small>
      </div>
      {!notes.actions.length && empty('Tasks with owners and due dates are picked up automatically.')}
      {notes.actions.map((a) => (
        <motion.button
          key={a.id}
          className={`vn-act${a.done ? ' done' : ''}`}
          onClick={() => onToggleAction?.(a.id)}
          disabled={!onToggleAction}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="vn-box">{a.done && <Icon name="check" size={13} strokeWidth={3} />}</span>
          <span className="grow">
            <b>{a.text}</b>
            <span className="vn-meta">
              {a.owner && (
                <span className="vn-chip">
                  <i>{initials(a.owner)}</i>
                  {a.owner}
                </span>
              )}
              {a.due && (
                <span className="vn-due">
                  <Icon name="cal" size={12} /> {a.due}
                </span>
              )}
            </span>
          </span>
        </motion.button>
      ))}
    </div>
  );
}

/** Live bar waveform. `levels` are 0..1; bars before `progress` (0..1) are highlighted. */
export function Wave({ levels, progress }: { levels: number[]; progress?: number }) {
  return (
    <div className="vn-wave" aria-hidden="true">
      {levels.map((l, i) => (
        <i
          key={i}
          style={{ height: `${Math.max(8, l * 100)}%` }}
          className={progress === undefined || i / levels.length <= progress ? 'on' : ''}
        />
      ))}
    </div>
  );
}
