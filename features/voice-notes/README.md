# Voice notes

Record, see a live transcript, and get structured notes (summary, action items, mind map) in several modes, with export.

## Code

| Path | What |
|---|---|
| `app/src/screens/vnotes/` | `VoiceNotes.tsx` (list), `Recorder.tsx`, `NoteView.tsx`, `NotePanels.tsx`, `MindMap.tsx`, `RecentList.tsx` |
| `app/src/notes/` | Services: `recorder.ts`, `audioStore.ts`, `modes.ts`, `export.ts`, `mockProvider.ts`, `scripts.ts`, `types.ts` |
| `app/src/notes/index.ts` | `notesProvider`: Mock (default) or `LlmNotesProvider` (`VITE_NOTES_PROVIDER=llm`, POST `VITE_AKAYA_API/notes/summarise`) |
| `app/src/screens/Notes.tsx, app/src/screens/Voice.tsx` | Quick notes and the voice assistant screen |
| `app/src/App.tsx` | Routes `/vnotes`, `/vnotes/rec`, `/vnotes/:id` |

## Status

The backend endpoint `/notes/summarise` is not built yet; the Mock provider uses sample scripts.

## Try it

`cd app && npm install && npm run dev`, then open the feature from Home or Search.
