import type { SendOutcome } from '../types.js';
import type { Fetch } from './types.js';

export interface JsonResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T;
  headers: Headers;
}

export async function callJson<T = Record<string, unknown>>(
  fetchFn: Fetch,
  url: string,
  init: { method?: string; token?: string; body?: unknown; headers?: Record<string, string>; form?: boolean } = {},
): Promise<JsonResult<T>> {
  const headers: Record<string, string> = { ...(init.headers ?? {}) };
  if (init.token) headers.Authorization = `Bearer ${init.token}`;
  let body: string | undefined;
  if (init.body !== undefined) {
    if (init.form) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      body = new URLSearchParams(init.body as Record<string, string>).toString();
    } else {
      headers['Content-Type'] = 'application/json; charset=utf-8';
      body = JSON.stringify(init.body);
    }
  }
  const res = await fetchFn(url, { method: init.method ?? 'POST', headers, body });
  const text = await res.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    /* not JSON */
  }
  return { ok: res.ok, status: res.status, data: data as T, headers: res.headers };
}

/** 429 and 5xx are worth retrying; other 4xx are not (bad token, policy, validation) */
export function httpFailure(r: JsonResult, label: string): SendOutcome {
  const detail = typeof r.data === 'string' ? r.data.slice(0, 200) : JSON.stringify(r.data).slice(0, 200);
  return { ok: false, retryable: r.status === 429 || r.status >= 500, error: `${label} HTTP ${r.status}: ${detail}`, code: String(r.status) };
}

export const missing = (keys: string[], creds: Record<string, string>): SendOutcome | null => {
  const gone = keys.filter((k) => !creds[k]);
  return gone.length ? { ok: false, retryable: false, error: `Channel not connected (missing ${gone.join(', ')})`, code: 'not_connected' } : null;
};

export const b64url = (s: string) => Buffer.from(s, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
