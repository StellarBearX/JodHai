import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import { useAppStore } from './store/useAppStore';

const STORAGE_KEY = 'jodhai_user';

function generateId(): string {
  return 'U_' + Math.random().toString(36).slice(2, 11);
}

function LoginModal({ onLogin }: { onLogin: (name: string) => void }) {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 flex items-center justify-center p-6" style={{ background: 'var(--color-bg)' }}>
      <div className="glass-card p-8 w-full max-w-sm space-y-5">
        <div className="text-center">
          <div className="text-5xl mb-3">📒</div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>จดให้</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>บันทึกรายรับ-รายจ่ายด้วย AI</p>
        </div>
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && name.trim() && onLogin(name.trim())}
            placeholder="ชื่อของคุณ"
            autoFocus
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'var(--color-text)',
            }}
          />
          <button
            onClick={() => name.trim() && onLogin(name.trim())}
            disabled={!name.trim()}
            className="w-full btn-brand py-3 font-semibold disabled:opacity-40"
          >
            เริ่มใช้งาน
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { setUser, setReady, isReady } = useAppStore();
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { lineUserId, displayName } = JSON.parse(stored);
        setUser({ lineUserId, displayName });
        setReady(true);
        return;
      } catch {}
    }
    setNeedLogin(true);
    setReady(true);
  }, [setUser, setReady]);

  const handleLogin = (displayName: string) => {
    const lineUserId = generateId();
    const userData = { lineUserId, displayName };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
    setNeedLogin(false);
  };

  if (!isReady) return null;
  if (needLogin) return <LoginModal onLogin={handleLogin} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
