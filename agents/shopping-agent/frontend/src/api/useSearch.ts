import { useEffect, useState } from 'react';
import { api, type SearchReq } from './client';
import type { SearchProgress, SearchResult } from './types';

export interface SearchState {
  key: string;
  status: 'running' | 'done' | 'error';
  progress: SearchProgress[];
  result?: SearchResult;
  error?: string;
}

/** Starts a search job and follows it over SSE (falls back to polling). Keeps the previous result while a refinement loads. */
export function useSearch(req: SearchReq | null): SearchState & { stale: boolean } {
  const key = req ? JSON.stringify(req) : '';
  const [state, setState] = useState<SearchState>({ key: '', status: 'running', progress: [] });

  useEffect(() => {
    if (!key) return;
    const body = JSON.parse(key) as SearchReq;
    let cancelled = false;
    let es: EventSource | null = null;
    let poll = 0;
    const finish = (job: { status: string; progress: SearchProgress[]; result?: SearchResult; error?: string }) => {
      if (cancelled) return;
      setState({ key, status: job.status === 'done' ? 'done' : 'error', progress: job.progress, result: job.result, error: job.error });
      es?.close();
      window.clearInterval(poll);
    };
    api
      .search(body)
      .then((job) => {
        if (cancelled) return;
        if (job.status === 'done' || job.status === 'failed') return finish(job);
        setState((s) => ({ key, status: 'running', progress: [], result: s.result }));
        es = api.jobEvents(job.id);
        es.addEventListener('progress', (e) => {
          const p = JSON.parse((e as MessageEvent).data) as SearchProgress;
          setState((s) => (s.key === key ? { ...s, progress: [...s.progress, p] } : s));
        });
        es.addEventListener('done', (e) => finish(JSON.parse((e as MessageEvent).data)));
        es.onerror = () => {
          es?.close();
          poll = window.setInterval(() => api.job(job.id).then((j) => (j.status === 'done' || j.status === 'failed') && finish(j)), 700);
        };
      })
      .catch((err: Error) => !cancelled && setState({ key, status: 'error', progress: [], error: err.message }));
    return () => {
      cancelled = true;
      es?.close();
      window.clearInterval(poll);
    };
  }, [key]);

  if (state.key === key) return { ...state, stale: false };
  return { key, status: 'running', progress: [], result: state.result, stale: !!state.result };
}

/** Latest status per store from a progress stream. */
export function storeStatus(progress: SearchProgress[]) {
  const m = new Map<string, SearchProgress>();
  for (const p of progress) m.set(p.store, p);
  return m;
}
