import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './api/client';
import type { AppNotification, ParseResult } from './api/types';
import type { ThemePref } from '@akaya/ui';

interface Persisted {
  theme: ThemePref;
}
const LS = 'akaya-grocery-agent';
const load = (): Persisted => {
  try {
    return { theme: 'light', ...JSON.parse(localStorage.getItem(LS) ?? '{}') };
  } catch {
    return { theme: 'light' };
  }
};
export interface Draft extends ParseResult {
  text: string;
  budget?: number;
}

interface Ctx extends Persisted {
  set: (p: Partial<Persisted>) => void;
  draft: Draft | null;
  setDraft: (d: Draft | null | ((cur: Draft | null) => Draft | null)) => void;
  notifications: AppNotification[];
  latest: AppNotification | null;
  dismissLatest: () => void;
  refreshNotifications: () => void;
  online: boolean;
}
const C = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [p, setP] = useState<Persisted>(load);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [latest, setLatest] = useState<AppNotification | null>(null);
  const [online, setOnline] = useState(true);

  const set = useCallback((patch: Partial<Persisted>) => {
    setP((cur) => {
      const next = { ...cur, ...patch };
      localStorage.setItem(LS, JSON.stringify(next));
      return next;
    });
  }, []);
  const refreshNotifications = useCallback(() => {
    api
      .notifications()
      .then((n) => {
        setNotifications(n);
        setOnline(true);
      })
      .catch(() => setOnline(false));
  }, []);

  useEffect(() => {
    refreshNotifications();
    // In-app channel: live notifications over SSE ("cart ready, confirm payment", order updates, list results)
    const es = api.notificationStream();
    es.addEventListener('notification', (e) => {
      const n = JSON.parse((e as MessageEvent).data) as AppNotification;
      setNotifications((cur) => [n, ...cur.filter((x) => x.id !== n.id)]);
      setLatest(n);
    });
    es.onopen = () => setOnline(true);
    return () => es.close();
  }, [refreshNotifications]);

  const value = useMemo<Ctx>(
    () => ({
      ...p,
      set,
      draft,
      setDraft,
      notifications,
      latest,
      dismissLatest: () => setLatest(null),
      refreshNotifications,
      online,
    }),
    [p, set, draft, notifications, latest, refreshNotifications, online],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useStore = () => useContext(C)!;
