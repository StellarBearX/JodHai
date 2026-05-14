import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import type { Transaction } from '@jod-hai/shared';
import NongJodHai from '../components/Mascot/NongJodHai';

const CATEGORY_EMOJI: Record<string, string> = {
  Food: '🍜', Transport: '🚗', Shopping: '🛍️', Health: '💊',
  Entertainment: '🎬', Bills: '📄', Salary: '💰', Other: '📦',
};

// ── CountUp hook ──────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = null;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setValue(Math.round(target * ease));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

// ── Dynamic BG ────────────────────────────────────────────────────────────────
function getDynamicBg(pct: number): string {
  if (pct >= 80) return 'linear-gradient(160deg, #FFF0F5 0%, #FFE4EE 100%)';
  if (pct >= 50) return 'linear-gradient(160deg, #FFFBF0 0%, #FFF5D6 100%)';
  return 'linear-gradient(160deg, #F0FFF8 0%, #E8FAF5 100%)';
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonLine({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) {
  return <div className={`skeleton rounded-xl ${w} ${h}`} />;
}
function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3">
      <SkeletonLine w="w-1/2" h="h-3" />
      <SkeletonLine w="w-2/3" h="h-8" />
      <SkeletonLine w="w-full" h="h-2.5" />
      <SkeletonLine w="w-4/5" h="h-2.5" />
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ label, amount, variant, loading }: { label: string; amount: number; variant: 'income' | 'expense'; loading?: boolean }) {
  const animated = useCountUp(amount);
  const isIncome = variant === 'income';
  const tc = isIncome ? 'var(--color-income)' : 'var(--color-expense)';
  const bg = isIncome ? 'rgba(52,199,123,0.1)' : 'rgba(255,107,157,0.1)';

  if (loading) return (
    <div className="card p-4 space-y-2">
      <SkeletonLine w="w-1/2" h="h-3" /><SkeletonLine w="w-3/4" h="h-6" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: isIncome ? 0.1 : 0.2 }}
      className="card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
        {isIncome ? <TrendingUp size={20} color={tc} /> : <TrendingDown size={20} color={tc} />}
      </div>
      <div>
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className="text-base font-black" style={{ color: tc }}>฿{animated.toLocaleString('th-TH')}</p>
      </div>
    </motion.div>
  );
}

// ── TxRow ─────────────────────────────────────────────────────────────────────
function TxRow({ tx }: { tx: Transaction }) {
  const isIncome = tx.type === 'INCOME';
  const tc = isIncome ? 'var(--color-income)' : 'var(--color-expense)';
  const timeStr = new Date(tx.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 py-3">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-lg"
        style={{ background: isIncome ? 'rgba(52,199,123,0.1)' : 'rgba(255,107,157,0.1)' }}>
        {CATEGORY_EMOJI[tx.category] ?? '📦'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>{tx.note ?? tx.category}</p>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{tx.category} · {timeStr}</p>
      </div>
      <p className="text-sm font-bold flex-shrink-0" style={{ color: tc }}>
        {isIncome ? '+' : '-'}฿{tx.amount.toLocaleString('th-TH')}
      </p>
    </motion.div>
  );
}

// ── Dashboard Page ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, dashboard, isLoadingDashboard, dashboardError, loadDashboard } = useAppStore();
  const navigate = useNavigate();

  const data = dashboard ?? { totalIncome: 0, totalExpense: 0, balance: 0, budgetUsedPercent: 0, recentTransactions: [] };
  const pct = data.budgetUsedPercent;
  const isDanger = pct >= 80;
  const isWarn = pct >= 50;
  const progressColor = isDanger ? 'danger' : isWarn ? 'warning' : '';

  const balanceAnimated = useCountUp(data.balance);
  const mascotState = isDanger ? 'warning' : 'idle';

  useEffect(() => { if (user) loadDashboard(); }, [user, loadDashboard]);

  return (
    <motion.div
      className="min-h-full px-4 pt-5 pb-4 max-w-lg mx-auto space-y-4"
      animate={{ background: getDynamicBg(pct) }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <NongJodHai state={mascotState} size={48} />
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>สวัสดีค่า 👋</p>
            <h1 className="text-lg font-black" style={{ color: 'var(--color-text)' }}>{user?.displayName ?? 'เพื่อน'}</h1>
          </div>
        </div>
        <motion.button whileTap={{ rotate: 360, scale: 0.9 }} transition={{ duration: 0.5 }}
          onClick={() => loadDashboard()} disabled={isLoadingDashboard}
          className="w-10 h-10 rounded-2xl card flex items-center justify-center transition-all">
          <RefreshCw size={17} style={{ color: 'var(--color-text-muted)' }} className={isLoadingDashboard ? 'animate-spin' : ''} />
        </motion.button>
      </div>

      {/* ── Error ── */}
      <AnimatePresence>
        {dashboardError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="card p-3 flex items-center gap-2" style={{ borderColor: 'rgba(255,107,157,0.3)' }}>
            <AlertCircle size={16} color="var(--color-expense)" />
            <p className="text-sm" style={{ color: 'var(--color-expense)' }}>{dashboardError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Balance Card ── */}
      {isLoadingDashboard && !dashboard ? <SkeletonCard /> : (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          className="card p-5 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none"
            style={{ background: isDanger ? 'rgba(255,107,157,0.12)' : 'rgba(62,207,191,0.12)', filter: 'blur(20px)' }} />

          <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--color-text-muted)' }}>ยอดคงเหลือ</p>
          <motion.p
            key={data.balance}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black tracking-tight"
            style={{ color: 'var(--color-text)' }}
          >
            ฿{balanceAnimated.toLocaleString('th-TH')}
          </motion.p>

          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
              <span className="flex items-center gap-1"><Wallet size={12} /> งบประมาณเดือนนี้</span>
              <span style={{ color: isDanger ? 'var(--color-expense)' : isWarn ? 'var(--color-warning)' : 'var(--color-brand-dark)', fontWeight: 700 }}>
                {pct.toFixed(0)}%
              </span>
            </div>
            <div className="progress-track">
              <motion.div className={`progress-fill${progressColor ? ` ${progressColor}` : ''}`}
                initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }} />
            </div>
            <AnimatePresence>
              {isDanger && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs font-semibold" style={{ color: 'var(--color-expense)' }}>
                  ⚠️ น้องจดให้เป็นห่วงนะ ใช้งบไปเยอะมากเลย!
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="รายรับ" amount={data.totalIncome} variant="income" loading={isLoadingDashboard && !dashboard} />
        <StatCard label="รายจ่าย" amount={data.totalExpense} variant="expense" loading={isLoadingDashboard && !dashboard} />
      </div>

      {/* ── Recent Transactions ── */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>รายการล่าสุด</h2>
          <button onClick={() => navigate('/history')} className="flex items-center gap-0.5 text-xs font-semibold" style={{ color: 'var(--color-brand-dark)' }}>
            ดูทั้งหมด <ChevronRight size={13} />
          </button>
        </div>

        {isLoadingDashboard && !dashboard ? (
          <div className="space-y-3 pt-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton w-10 h-10 rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <SkeletonLine w="w-3/4" h="h-3.5" />
                  <SkeletonLine w="w-1/2" h="h-2.5" />
                </div>
                <SkeletonLine w="w-16" h="h-4" />
              </div>
            ))}
          </div>
        ) : data.recentTransactions.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <NongJodHai state="idle" size={64} className="mx-auto" />
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              ยังไม่มีรายการเลยนะ ไปแชทกับน้องจดให้ได้เลยค่า!
            </p>
            <button onClick={() => navigate('/chat')} className="btn-brand px-4 py-2 text-sm">เริ่มบันทึก →</button>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {data.recentTransactions.map((tx) => <TxRow key={tx.id} tx={tx} />)}
          </div>
        )}
      </div>
    </motion.div>
  );
}
