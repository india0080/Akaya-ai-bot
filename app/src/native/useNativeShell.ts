/**
 * Native (Capacitor / Android) glue. No-ops in the browser.
 * - status bar icon style + colour follow the app theme
 * - splash screen hides once React has rendered
 * - hardware back button: close the top sheet, else go back, else minimise on root screens
 */
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { runBackHandler } from './backStack';

export const isNativeApp = () => Capacitor.isNativePlatform();

const ROOTS = ['/home', '/signup', '/onboarding', '/'];
const BAR = { light: '#f4f1fc', dark: '#0b0a1a' } as const;

export function useNativeShell(theme: 'light' | 'dark') {
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
      if (ROOTS.includes(path) || !canGoBack) void CapApp.minimizeApp();
      else window.history.back();
    });
    return () => {
      void sub.then((h) => h.remove());
    };
  }, []);
}
