import { useEffect, useState } from 'react';

const mq = () => window.matchMedia('(prefers-color-scheme: dark)');

export type ThemePref = 'light' | 'dark' | 'system';

/** Resolves Light / Dark / System, applies it to <html data-theme> and returns the resolved theme. `textSize` scales rem type (--ts). */
export function useThemeSync(pref: ThemePref, textSize = 1): 'light' | 'dark' {
  const [sysDark, setSysDark] = useState(() => mq().matches);
  useEffect(() => {
    const m = mq();
    const on = (e: MediaQueryListEvent) => setSysDark(e.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  const resolved = pref === 'system' ? (sysDark ? 'dark' : 'light') : pref;
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = resolved;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', resolved === 'dark' ? '#0b0a1a' : '#f4f1fc');
  }, [resolved]);
  useEffect(() => {
    document.documentElement.style.setProperty('--ts', String(textSize));
  }, [textSize]);
  return resolved;
}
