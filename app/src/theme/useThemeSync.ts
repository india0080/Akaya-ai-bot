import { useEffect, useState } from 'react';
import type { ThemePref } from '../state/types';

const mq = () => window.matchMedia('(prefers-color-scheme: dark)');

/** Resolves Light / Dark / System, applies it to <html data-theme> and returns the resolved theme. */
export function useThemeSync(pref: ThemePref, textSize: number): 'light' | 'dark' {
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
