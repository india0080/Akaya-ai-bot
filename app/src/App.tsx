import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import { DeviceHostContext } from './components/deviceHost';
import { useApp } from './state/store';
import { useThemeSync } from './theme/useThemeSync';
import { StatusBar } from './components/StatusBar';
import { useShowStatusBar } from './components/useShowStatusBar';
import { BottomNav } from './components/BottomNav';
import { ToastProvider } from './components/Toast';
import { SignUp } from './screens/SignUp';
import { Login } from './screens/auth/Login';
import { VerifyEmail } from './screens/auth/VerifyEmail';
import { ForgotPassword } from './screens/auth/ForgotPassword';
import { auth } from './auth';
import { isNativeApp, useNativeShell } from './native/useNativeShell';
import { Onboarding } from './screens/Onboarding';
import { Home } from './screens/Home';
import { Chat } from './screens/Chat';
import { Voice } from './screens/Voice';
import { More } from './screens/More';
import { Translate } from './screens/Translate';
import { FutureMessages } from './screens/FutureMessages';
import { Notes } from './screens/Notes';
import { Search } from './screens/Search';
import { History } from './screens/History';
import { Upgrade } from './screens/Upgrade';
import { Support } from './screens/Support';
import { Apps } from './screens/Apps';
import { VoiceNotes } from './screens/vnotes/VoiceNotes';
import { Recorder } from './screens/vnotes/Recorder';
import { NoteView } from './screens/vnotes/NoteView';
import { FutureScheduler } from './future/FutureScheduler';

const TAB_PATHS = ['/home', '/chat', '/voice', '/history', '/more'];

function Guard({ children }: { children: ReactNode }) {
  const { state } = useApp();
  if (!state.auth.signedIn) return <Navigate to="/signup" replace />;
  if (!state.onboardingDone) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

export function App() {
  const { state, logout } = useApp();
  const [device, setDevice] = useState<HTMLDivElement | null>(null);
  const theme = useThemeSync(state.settings.theme, state.settings.textSize);
  useNativeShell(theme);
  // the fake status bar is for the desktop phone frame only; the Android app has the real one
  const showStatus = useShowStatusBar() && !isNativeApp();

  // An email session that ended in the auth provider (signed out elsewhere, account deleted) signs the app out too.
  const emailSession = state.auth.signedIn && state.auth.method === 'email';
  useEffect(() => {
    if (!emailSession) return;
    let done = false;
    return auth.onAuthStateChanged((u) => {
      if (u || done) return;
      done = true;
      logout();
    });
  }, [emailSession, logout]);
  const { pathname } = useLocation();
  const showNav = state.auth.signedIn && state.onboardingDone && TAB_PATHS.some((p) => pathname.startsWith(p));
  const start = !state.auth.signedIn ? '/signup' : !state.onboardingDone ? '/onboarding' : '/home';

  return (
    <div className="stage">
      <div className="device" id="device" ref={setDevice}>
        <DeviceHostContext.Provider value={device}>
          <ToastProvider>
            {showStatus ? <StatusBar /> : <div className="safe-top" />}
            {state.auth.signedIn && <FutureScheduler />}
            <Routes>
              <Route path="/" element={<Navigate to={start} replace />} />
              <Route path="/signup" element={state.auth.signedIn ? <Navigate to={start} replace /> : <SignUp />} />
              <Route path="/login" element={state.auth.signedIn ? <Navigate to={start} replace /> : <Login />} />
              <Route path="/forgot" element={<ForgotPassword />} />
              <Route
                path="/verify-email"
                element={state.auth.signedIn ? <Navigate to={start} replace /> : <VerifyEmail />}
              />
              <Route
                path="/onboarding"
                element={!state.auth.signedIn ? <Navigate to="/signup" replace /> : <Onboarding />}
              />
              <Route
                path="/home"
                element={
                  <Guard>
                    <Home />
                  </Guard>
                }
              />
              <Route
                path="/chat/:id?"
                element={
                  <Guard>
                    <Chat />
                  </Guard>
                }
              />
              <Route
                path="/voice"
                element={
                  <Guard>
                    <Voice />
                  </Guard>
                }
              />
              <Route
                path="/more"
                element={
                  <Guard>
                    <More />
                  </Guard>
                }
              />
              <Route
                path="/translate"
                element={
                  <Guard>
                    <Translate />
                  </Guard>
                }
              />
              <Route
                path="/future"
                element={
                  <Guard>
                    <FutureMessages />
                  </Guard>
                }
              />
              <Route
                path="/notes"
                element={
                  <Guard>
                    <Notes />
                  </Guard>
                }
              />
              <Route
                path="/search"
                element={
                  <Guard>
                    <Search />
                  </Guard>
                }
              />
              <Route
                path="/history"
                element={
                  <Guard>
                    <History />
                  </Guard>
                }
              />
              <Route
                path="/upgrade"
                element={
                  <Guard>
                    <Upgrade />
                  </Guard>
                }
              />
              <Route
                path="/vnotes"
                element={
                  <Guard>
                    <VoiceNotes />
                  </Guard>
                }
              />
              <Route
                path="/vnotes/rec"
                element={
                  <Guard>
                    <Recorder />
                  </Guard>
                }
              />
              <Route
                path="/vnotes/:id"
                element={
                  <Guard>
                    <NoteView />
                  </Guard>
                }
              />
              <Route
                path="/apps"
                element={
                  <Guard>
                    <Apps />
                  </Guard>
                }
              />
              <Route
                path="/support"
                element={
                  <Guard>
                    <Support />
                  </Guard>
                }
              />
              <Route path="*" element={<Navigate to={start} replace />} />
            </Routes>
            {showNav && <BottomNav />}
          </ToastProvider>
        </DeviceHostContext.Provider>
      </div>
    </div>
  );
}
