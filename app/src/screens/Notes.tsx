import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Screen, ScreenHeader, Icon, useToast } from '@akaya/ui';
import { useApp } from '../state/store';
import { relDay } from '../lib/time';
import type { Note } from '../state/types';
import './Features.css';

const COLORS: Note['color'][] = ['violet', 'blue', 'green', 'orange', 'pink'];

export function Notes() {
  const { state, addNote, deleteNote } = useApp();
  const toast = useToast();
  const [text, setText] = useState('');
  const [color, setColor] = useState<Note['color']>('violet');
  const [q, setQ] = useState('');
  const notes = state.notes.filter((n) => n.text.toLowerCase().includes(q.toLowerCase()));
  const add = () => {
    if (!text.trim()) return;
    addNote(text.trim(), color);
    setText('');
    toast('Note saved', 'note');
  };
  return (
    <Screen className="feature">
      <ScreenHeader title="Smart Note" sub={`${state.notes.length} notes · saved on this device`} />
      <div className="card note-new">
        <textarea
          placeholder="Jot something down…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="New note"
        />
        <div className="note-bar">
          {COLORS.map((c) => (
            <button
              key={c}
              className={`swatch sw-${c}${c === color ? ' on' : ''}`}
              onClick={() => setColor(c)}
              aria-label={`${c} note`}
            />
          ))}
          <span className="grow" />
          <button className="btn btn-primary btn-sm" disabled={!text.trim()} onClick={add}>
            <Icon name="plus" size={15} strokeWidth={2.4} /> Add note
          </button>
        </div>
      </div>
      <label className="card note-search">
        <Icon name="search" size={17} className="faint" />
        <input placeholder="Search notes" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <div className="note-grid">
        <AnimatePresence initial={false}>
          {notes.map((n) => (
            <motion.div
              key={n.id}
              layout
              className={`note n-${n.color}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <p>{n.text}</p>
              <div className="note-foot">
                <small>{relDay(n.createdAt)}</small>
                <button onClick={() => deleteNote(n.id)} aria-label="Delete note">
                  <Icon name="trash" size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {!notes.length && (
        <div className="empty">{q ? 'No notes match your search.' : 'No notes yet. Add your first one above.'}</div>
      )}
    </Screen>
  );
}
