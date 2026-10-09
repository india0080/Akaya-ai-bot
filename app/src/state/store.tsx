/**
 * App state: a single typed object held in React context and persisted to localStorage.
 * Components read with `useApp()` and change it with the action helpers it returns.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { initialState, newMsg, chatTitle } from '../lib/mock';
import { uid } from '../lib/time';
import { auth } from '../auth';
import type { Connection } from '../integrations/types';
import type { VoiceNote } from '../notes/types';
import type { Activity, AppState, Chat, FutureMessage, Note, Settings, TodayItem } from './types';

export const STORAGE_KEY = 'akaya:v1';

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.version === 1) {
        const base = initialState();
        return { ...base, ...parsed, settings: { ...base.settings, ...parsed.settings } };
      }
    }
  } catch {
    /* corrupted storage: start fresh */
  }
  return initialState();
}

function useAppStore() {
  const [state, setState] = useState<AppState>(load);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const patch = useCallback((fn: (s: AppState) => AppState) => setState(fn), []);

  const actions = useMemo(
    () => ({
      signIn: (method: 'google' | 'phone' | 'email', contact?: string) =>
        patch((s) => ({ ...s, auth: { signedIn: true, method, contact } })),
      finishOnboarding: () => patch((s) => ({ ...s, onboardingDone: true })),
      logout: () => {
        void auth.signOut().catch(() => {});
        localStorage.removeItem(STORAGE_KEY);
        setState(initialState());
      },
      setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) =>
        patch((s) => ({ ...s, settings: { ...s.settings, [key]: value } })),

      toggleToday: (id: string) =>
        patch((s) => ({ ...s, today: s.today.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
      addToday: (item: Omit<TodayItem, 'id' | 'done'>) =>
        patch((s) => ({ ...s, today: [...s.today, { ...item, id: uid(), done: false, createdAt: Date.now() }] })),

      addNote: (text: string, color: Note['color']) =>
        patch((s) => ({ ...s, notes: [{ id: uid(), text, color, createdAt: Date.now() }, ...s.notes] })),
      deleteNote: (id: string) => patch((s) => ({ ...s, notes: s.notes.filter((n) => n.id !== id) })),

      scheduleMessage: (m: Omit<FutureMessage, 'id' | 'status'>) =>
        patch((s) => ({
          ...s,
          future: [...s.future, { ...m, id: uid(), status: 'scheduled' as const, createdAt: Date.now() }].sort(
            (a, b) => a.when - b.when,
          ),
        })),
      cancelMessage: (id: string) => patch((s) => ({ ...s, future: s.future.filter((m) => m.id !== id) })),

      /** creates a chat and returns its id */
      newChat: (firstText?: string): string => {
        const id = uid();
        const chat: Chat = {
          id,
          title: firstText ? chatTitle(firstText) : 'New chat',
          updatedAt: Date.now(),
          messages: [],
        };
        patch((s) => ({ ...s, chats: [chat, ...s.chats] }));
        return id;
      },
      addMessage: (chatId: string, from: 'me' | 'akaya', text: string) =>
        patch((s) => ({
          ...s,
          chats: s.chats
            .map((c) =>
              c.id === chatId
                ? {
                    ...c,
                    title: c.messages.length === 0 && from === 'me' ? chatTitle(text) : c.title,
                    updatedAt: Date.now(),
                    messages: [...c.messages, newMsg(from, text)],
                  }
                : c,
            )
            .sort((a, b) => b.updatedAt - a.updatedAt),
        })),
      deleteChat: (id: string) => patch((s) => ({ ...s, chats: s.chats.filter((c) => c.id !== id) })),

      logActivity: (a: Omit<Activity, 'id' | 'at'>) =>
        patch((s) => {
          const last = s.activity[0];
          if (last && last.kind === a.kind && last.input === a.input && last.output === a.output) return s;
          return { ...s, activity: [{ ...a, id: uid(), at: Date.now() }, ...s.activity].slice(0, 200) };
        }),
      toggleHistoryPin: (key: string) =>
        patch((s) => {
          const p = s.history.pinned;
          return {
            ...s,
            history: { ...s.history, pinned: p.includes(key) ? p.filter((k) => k !== key) : [key, ...p] },
          };
        }),
      hideHistory: (key: string) =>
        patch((s) => ({
          ...s,
          history: { pinned: s.history.pinned.filter((k) => k !== key), hidden: [...s.history.hidden, key] },
        })),
      restoreHistory: (key: string) =>
        patch((s) => ({ ...s, history: { ...s.history, hidden: s.history.hidden.filter((k) => k !== key) } })),

      connectApp: (c: Omit<Connection, 'connectedAt'>) =>
        patch((s) => ({
          ...s,
          integrations: { ...s.integrations, [c.appId]: { ...c, connectedAt: Date.now() } },
          // a fresh connection should show in History again even if an older one was removed
          history: { ...s.history, hidden: s.history.hidden.filter((k) => k !== `app:${c.appId}`) },
        })),
      saveVoiceNote: (v: VoiceNote) =>
        patch((s) => ({
          ...s,
          voiceNotes: [v, ...s.voiceNotes.filter((x) => x.id !== v.id)],
          history: { ...s.history, hidden: s.history.hidden.filter((k) => k !== `vnote:${v.id}`) },
        })),
      updateVoiceNote: (id: string, fn: (v: VoiceNote) => VoiceNote) =>
        patch((s) => ({ ...s, voiceNotes: s.voiceNotes.map((v) => (v.id === id ? fn(v) : v)) })),
      deleteVoiceNote: (id: string) => patch((s) => ({ ...s, voiceNotes: s.voiceNotes.filter((v) => v.id !== id) })),
      disconnectApp: (appId: string) =>
        patch((s) => {
          const next = { ...s.integrations };
          delete next[appId];
          return { ...s, integrations: next };
        }),
      setAppToggle: (appId: string, key: string, on: boolean) =>
        patch((s) => {
          const c = s.integrations[appId];
          if (!c) return s;
          return { ...s, integrations: { ...s.integrations, [appId]: { ...c, toggles: { ...c.toggles, [key]: on } } } };
        }),

      markAllRead: () => patch((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      addAgent: (name: string, desc: string) =>
        patch((s) => ({ ...s, agents: [...s.agents, { id: uid(), name, desc, on: true }] })),
      readNotification: (id: string) =>
        patch((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      toggleAgent: (id: string) =>
        patch((s) => ({ ...s, agents: s.agents.map((a) => (a.id === id ? { ...a, on: !a.on } : a)) })),
    }),
    [patch],
  );

  return { state, ...actions };
}

type Store = ReturnType<typeof useAppStore>;
const Ctx = createContext<Store | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const store = useAppStore();
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useApp must be used inside <AppProvider>');
  return s;
}
