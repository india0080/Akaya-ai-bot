import { useEffect, useState } from 'react';

export type ThemePref = 'light' | 'dark' | 'system';
const mq = () => window.matchMedia('(prefers-color-scheme: dark)');

/** Resolves Light / Dark / System and applies it to <html data-theme>. */
export function useThemeSync(pref: ThemePref): 'light' | 'dark' {
  const [sysDark, setSysDark] = useState(() => mq().matches);
  useEffect(() => {
    const m = mq();
    const on = (e: MediaQueryListEvent) => setSysDark(e.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  const resolved = pref === 'system' ? (sysDark ? 'dark' : 'light') : pref;
  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', resolved === 'dark' ? '#0b0a1a' : '#f4f1fc');
  }, [resolved]);
  return resolved;
}
