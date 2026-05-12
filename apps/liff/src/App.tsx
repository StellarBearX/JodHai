import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Settings from './pages/Settings';
import { useAppStore } from './store/useAppStore';

/**
 * LIFF Initializer
 * In production: initializes the LINE LIFF SDK and populates the store with
 * the user's LINE profile. In development (no LIFF ID set), it uses a mock
 * profile so the UI is fully functional without a LINE login.
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
        }
      } else {
        // Dev mode — use mock profile
        console.info('[LIFF] No VITE_LIFF_ID — using mock profile');
        setUser({ lineUserId: 'U_dev_mock', displayName: 'นักพัฒนา' });
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
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </LiffInitializer>
    </BrowserRouter>
  );
}
