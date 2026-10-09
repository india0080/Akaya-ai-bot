/**
 * Voice Notes services. `notesProvider` turns transcript segments into structured notes.
 *
 * Default: MockNotesProvider (on-device rules, works offline and in demos).
 * Set VITE_NOTES_PROVIDER=llm to use LlmNotesProvider, which POSTs the transcript to your backend
 * (VITE_AKAYA_API/notes/summarise). The backend calls the LLM; no model keys live in the client.
 */
import { MockNotesProvider } from './mockProvider';
import type { NoteMeta, NotesProvider, Segment, StructuredNotes } from './types';

export class LlmNotesProvider implements NotesProvider {
  id = 'llm';
  base = import.meta.env.VITE_AKAYA_API ?? '/api';
  async update(segments: Segment[], meta: NoteMeta): Promise<StructuredNotes> {
    // TODO(backend): implement POST /notes/summarise → StructuredNotes (JSON schema in ./types.ts).
    // Tip: send only new segments plus the previous notes to keep live updates cheap.
    const res = await fetch(`${this.base}/notes/summarise`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meta,
        segments: segments.map(({ t, text, speaker, lang }) => ({ t, text, speaker, lang })),
      }),
    });
    if (!res.ok) throw new Error(`notes/summarise failed: ${res.status}`);
    return (await res.json()) as StructuredNotes;
  }
}

export const notesProvider: NotesProvider =
  import.meta.env.VITE_NOTES_PROVIDER === 'llm' ? new LlmNotesProvider() : new MockNotesProvider();

export * from './types';
export { MODES, MODE_BY_ID, LANGS } from './modes';
export { buildNotes } from './mockProvider';
