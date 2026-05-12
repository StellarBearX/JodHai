import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import { useAppStore } from './store/useAppStore';
import { DEV_LINE_USER_ID, DEV_DISPLAY_NAME } from './services/api';

/**
 * LIFF Initializer
 * Production: Uses LINE LIFF SDK to authenticate.
 * Development (no VITE_LIFF_ID): Uses a mock dev profile automatically.
 */
function LiffInitializer({ children }: { children: React.ReactNode }) {
  const { setUser, setLiffReady } = useAppStore();

  useEffect(() => {
    async function init() {
      const liffId = import.meta.env.VITE_LIFF_ID;

      if (liffId) {
        try {
          const liff = (await import('@line/liff')).default;
          await liff.init({ liffId });

          if (!liff.isLoggedIn()) {
            liff.login();
            return;
          }

          const profile = await liff.getProfile();
          const accessToken = liff.getAccessToken();
          if (accessToken) localStorage.setItem('line_access_token', accessToken);

          setUser({ lineUserId: profile.userId, displayName: profile.displayName });
        } catch (err) {
          console.error('[LIFF] Init failed:', err);
          // Fallback to dev mode on error
          setUser({ lineUserId: DEV_LINE_USER_ID, displayName: DEV_DISPLAY_NAME });
        }
      } else {
        // Dev mode — use mock profile (no LINE required)
        console.info('[Dev Mode] Using mock LINE user:', DEV_LINE_USER_ID);
        setUser({ lineUserId: DEV_LINE_USER_ID, displayName: DEV_DISPLAY_NAME });
      }

      setLiffReady(true);
    }

    init();
  }, [setUser, setLiffReady]);

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <LiffInitializer>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </LiffInitializer>
    </BrowserRouter>
  );
}
