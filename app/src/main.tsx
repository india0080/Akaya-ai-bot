import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
// self-hosted fonts (latin subsets only, keeps the bundle small)
import '@fontsource/comfortaa/latin-700.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/manrope/latin-500.css';
import '@fontsource/manrope/latin-600.css';
import '@fontsource/manrope/latin-700.css';
import '@fontsource/manrope/latin-800.css';
import './theme/global.css';
import { AppProvider } from './state/store';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      {/* HashRouter so the app also works from file:// (standalone build) and any static host */}
      <HashRouter>
        <App />
      </HashRouter>
    </AppProvider>
  </StrictMode>,
);
