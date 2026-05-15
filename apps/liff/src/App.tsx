import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Budget from './pages/Budget';
import Login from './pages/Login';
import { useAppStore } from './store/useAppStore';

const STORAGE_KEY = 'jodhai_user';

export default function App() {
  const { setUser, setReady, isReady } = useAppStore();
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { lineUserId, displayName } = JSON.parse(stored);
        if (lineUserId && displayName) {
          setUser({ lineUserId, displayName });
          setReady(true);
          return;
        }
      } catch {}
    }
    setNeedLogin(true);
    setReady(true);
  }, [setUser, setReady]);

  const handleLoginSuccess = (lineUserId: string, displayName: string) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lineUserId, displayName }));
    window.history.replaceState({}, '', '/');
    setUser({ lineUserId, displayName });
    setNeedLogin(false);
  };

  if (!isReady) return null;
  if (needLogin) return <Login onSuccess={handleLoginSuccess} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/budget" element={<Budget />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
