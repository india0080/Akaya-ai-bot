import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
// self-hosted fonts (latin subsets only, keeps the bundle small)
import '@akaya/ui/fonts';
import '@akaya/ui/global.css';
import './theme/kit.css';
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
