import { useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { NotifBanner } from './components/NotifBanner';
import { Alerts } from './screens/Alerts';
import { Home } from './screens/Home';
import { EXAMPLES } from './lib/examples';
import { More } from './screens/More';
import { Product } from './screens/Product';
import { Results } from './screens/Results';
import { Watchlist } from './screens/Watchlist';
import { useStore } from './state';
import {
  useThemeSync,
  BottomNav,
  DeviceHostContext,
  StatusBar,
  ToastProvider,
  useShowStatusBar,
  VoiceSheet,
} from '@akaya/ui';

const TABS = ['/home', '/watchlist', '/alerts', '/more'];

export function App() {
  const { theme } = useStore();
  useThemeSync(theme);
  const [device, setDevice] = useState<HTMLDivElement | null>(null);
  const [voice, setVoice] = useState(false);
  const showStatus = useShowStatusBar();
  const { pathname } = useLocation();
  const nav = useNavigate();
  const showNav = TABS.some((t) => pathname.startsWith(t));

  return (
    <div className="stage">
      <div className="device" id="device" ref={setDevice}>
        <DeviceHostContext.Provider value={device}>
          <ToastProvider>
            {showStatus ? <StatusBar /> : <div className="safe-top" />}
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home onVoice={() => setVoice(true)} />} />
              <Route path="/search" element={<Results />} />
              <Route path="/product/:key" element={<Product />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/more" element={<More />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
            {showNav && (
              <BottomNav
                left={[
                  { to: '/home', label: 'Shop', icon: 'bag' },
                  { to: '/watchlist', label: 'Watchlist', icon: 'heart' },
                ]}
                right={[
                  { to: '/alerts', label: 'Alerts', icon: 'bell' },
                  { to: '/more', label: 'Settings', icon: 'more' },
                ]}
                onOrb={() => setVoice(true)}
                orbLabel="Voice search"
                orbLive={voice}
              />
            )}
            <NotifBanner />
            <VoiceSheet
              title="Speak to search"
              hint='Try "1500 se kam ka school bag, jaldi chahiye"'
              open={voice}
              onClose={() => setVoice(false)}
              demos={[EXAMPLES[1], 'wireless earbuds 3000 tak, achhi rating', 'running shoes under 3k on flipkart']}
              onResult={(t) => {
                setVoice(false);
                nav(`/search?q=${encodeURIComponent(t)}`);
              }}
            />
          </ToastProvider>
        </DeviceHostContext.Provider>
      </div>
    </div>
  );
}
