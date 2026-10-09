import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'one.akaya.app',
  appName: 'Akaya',
  webDir: 'dist',
  android: {
    // https://localhost: a secure context (needed for the mic, WebCrypto and Firebase Auth persistence)
    allowMixedContent: false,
  },
  server: { androidScheme: 'https' },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#f4f1fc',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    // Edge-to-edge (required from Android 15): the web content draws behind the status bar using
    // env(safe-area-inset-*), so the bar colour always matches the theme. Icon style is set at runtime.
    SystemBars: {
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
    },
  },
};

export default config;
