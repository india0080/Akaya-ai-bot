/**
 * Native (Capacitor / Android) glue. No-ops in the browser.
 * - status bar icon style + colour follow the app theme
 * - splash screen hides once React has rendered
 * - hardware back button: close the top sheet; on Chat / Voice / History / More go to Home (there is no tab bar);
 *   else go back; minimise on root screens
 */
import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { runBackHandler } from './backStack';

export const isNativeApp = () => Capacitor.isNativePlatform();

const ROOTS = ['/home', '/signup', '/onboarding', '/'];
/** top-level screens whose back goes straight to Home */
const TO_HOME = ['/chat', '/voice', '/history', '/more'];
const BAR = { light: '#f4f1fc', dark: '#0b0a1a' } as const;

export function useNativeShell(theme: 'light' | 'dark', goHome: (to: string) => void) {
  const home = useRef(goHome);
  useEffect(() => {
    home.current = goHome;
  });
  useEffect(() => {
    if (!isNativeApp()) return;
    // Style.Dark = light icons (for dark backgrounds)
    void StatusBar.setStyle({ style: theme === 'dark' ? Style.Dark : Style.Light }).catch(() => {});
    void StatusBar.setBackgroundColor({ color: BAR[theme] }).catch(() => {});
  }, [theme]);

  useEffect(() => {
    if (!isNativeApp()) return;
    void SplashScreen.hide({ fadeOutDuration: 250 }).catch(() => {});
    const sub = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (runBackHandler()) return;
      const path = window.location.hash.replace(/^#/, '').split('?')[0] || '/';
      if (ROOTS.includes(path)) void CapApp.minimizeApp();
      else if (TO_HOME.some((p) => path === p || path.startsWith(`${p}/`))) home.current('/home');
      else if (!canGoBack) home.current('/home');
      else window.history.back();
    });
    return () => {
      void sub.then((h) => h.remove());
    };
  }, []);
}
