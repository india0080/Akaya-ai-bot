import { useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { api } from './api/client';
import { NotifBanner } from './components/NotifBanner';
import { VOICE_DEMOS } from './lib/examples';
import { Basket } from './screens/Basket';
import { CheckoutScreen } from './screens/Checkout';
import { Compare } from './screens/Compare';
import { Home } from './screens/Home';
import { Items } from './screens/Items';
import { Lists } from './screens/Lists';
import { OrderScreen } from './screens/Order';
import { Orders } from './screens/Orders';
import { SettingsScreen } from './screens/Settings';
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

const TABS = ['/home', '/lists', '/orders', '/settings'];

export function App() {
  const { theme, setDraft } = useStore();
  useThemeSync(theme);
  const [device, setDevice] = useState<HTMLDivElement | null>(null);
  const [voice, setVoice] = useState(false);
  const showStatus = useShowStatusBar();
  const { pathname } = useLocation();
  const nav = useNavigate();
  const showNav = TABS.includes(pathname);

  return (
    <div className="stage">
      <div className="device" id="device" ref={setDevice}>
        <DeviceHostContext.Provider value={device}>
          <ToastProvider>
            {showStatus ? <StatusBar /> : <div className="safe-top" />}
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<Home onVoice={() => setVoice(true)} />} />
              <Route path="/items" element={<Items />} />
              <Route path="/compare/:id" element={<Compare />} />
              <Route path="/basket/:quoteId/:planId" element={<Basket />} />
              <Route path="/checkout/:id" element={<CheckoutScreen />} />
              <Route path="/orders/:id" element={<OrderScreen />} />
              <Route path="/lists" element={<Lists />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
            {showNav && (
              <BottomNav
                left={[
                  { to: '/home', label: 'Home', icon: 'basket' },
                  { to: '/lists', label: 'Lists', icon: 'list' },
                ]}
                right={[
                  { to: '/orders', label: 'Orders', icon: 'truck' },
                  { to: '/settings', label: 'Settings', icon: 'more' },
                ]}
                onOrb={() => setVoice(true)}
                orbLabel="Speak your grocery list"
                orbLive={voice}
              />
            )}
            <NotifBanner />
            <VoiceSheet
              title="Speak your list"
              hint='Try "do kilo aata, ek litre doodh aur chhe ande"'
              open={voice}
              onClose={() => setVoice(false)}
              demos={VOICE_DEMOS}
              onResult={(t) => {
                setVoice(false);
                api.parse(t).then(
                  (r) => {
                    setDraft({ ...r, text: t });
                    nav('/items');
                  },
                  () => nav('/home'),
                );
              }}
            />
          </ToastProvider>
        </DeviceHostContext.Provider>
      </div>
    </div>
  );
}
