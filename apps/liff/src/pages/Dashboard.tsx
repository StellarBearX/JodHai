import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, ChevronRight, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { fetchDashboardAnalysis } from '../services/api';
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
  if (pct >= 80) return 'linear-gradient(160deg, #F4F3EE 0%, #F0E8E4 100%)';
  if (pct >= 50) return 'linear-gradient(160deg, #F4F3EE 0%, #EDE8E0 100%)';
  return '#F4F3EE';
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
  const iconBg = isIncome ? 'rgba(52,199,123,0.12)' : 'rgba(224,90,122,0.12)';

  if (loading) return (
    <div className="card p-5 space-y-2.5">
      <SkeletonLine w="w-1/2" h="h-3" /><SkeletonLine w="w-3/4" h="h-6" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: isIncome ? 0.1 : 0.2 }}
      className="card p-5 flex flex-col gap-3" style={{ background: '#FFFFFF' }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
        {isIncome ? <TrendingUp size={18} color={tc} /> : <TrendingDown size={18} color={tc} />}
      </div>
      <div>
        <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
        <p className="text-lg font-black leading-tight" style={{ color: tc }}>฿{animated.toLocaleString('th-TH')}</p>
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
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const data = dashboard ?? { totalIncome: 0, totalExpense: 0, balance: 0, budgetUsedPercent: 0, recentTransactions: [] };
  const pct = data.budgetUsedPercent;
  const isDanger = pct >= 80;
  const isWarn = pct >= 50;
  const progressColor = isDanger ? 'danger' : isWarn ? 'warning' : '';

  const balanceAnimated = useCountUp(data.balance);
  const mascotState = isDanger ? 'warning' : 'idle';

  useEffect(() => { if (user) loadDashboard(); }, [user, loadDashboard]);

  const loadAnalysis = async () => {
    if (!user || loadingAnalysis) return;
    setLoadingAnalysis(true);
    setAnalysis(null);
    try {
      const result = await fetchDashboardAnalysis(user.lineUserId);
      setAnalysis(result.analysis);
    } catch {
      setAnalysis('ขอโทษค่า ไม่สามารถวิเคราะห์ได้ในขณะนี้ ลองใหม่อีกทีนะคะ 😅');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  return (
    <motion.div
      className="min-h-full px-4 pt-6 pb-6 max-w-lg mx-auto space-y-5"
      animate={{ background: getDynamicBg(pct) }}
      transition={{ duration: 1.2, ease: 'easeInOut' }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <NongJodHai state={mascotState} size={44} />
          <div>
            <p className="text-xs font-medium tracking-wide" style={{ color: 'var(--color-text-muted)' }}>สวัสดีค่า 👋</p>
            <h1 className="text-xl font-black leading-tight" style={{ color: 'var(--color-text)' }}>{user?.displayName ?? 'เพื่อน'}</h1>
          </div>
        </div>
        <motion.button whileTap={{ rotate: 360, scale: 0.9 }} transition={{ duration: 0.5 }}
          onClick={() => loadDashboard()} disabled={isLoadingDashboard}
          className="w-10 h-10 rounded-2xl card flex items-center justify-center transition-all">
          <RefreshCw size={16} style={{ color: 'var(--color-text-muted)' }} className={isLoadingDashboard ? 'animate-spin' : ''} />
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
          className="card px-5 pt-6 pb-5 relative overflow-hidden" style={{ background: '#FFFFFF' }}>
          {/* Decorative blob */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: isDanger ? 'rgba(224,90,122,0.10)' : 'rgba(193,95,60,0.10)', filter: 'blur(24px)' }} />

          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-muted)' }}>ยอดคงเหลือ</p>
          <motion.p
            key={data.balance}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black tracking-tight mb-5"
            style={{ color: 'var(--color-text)' }}
          >
            ฿{balanceAnimated.toLocaleString('th-TH')}
          </motion.p>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
              <span className="flex items-center gap-1.5"><Wallet size={11} /> งบประมาณเดือนนี้</span>
              <span style={{ color: isDanger ? 'var(--color-expense)' : isWarn ? 'var(--color-warning)' : 'var(--color-brand)', fontWeight: 700 }}>
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
                  className="text-xs font-semibold pt-0.5" style={{ color: 'var(--color-expense)' }}>
                  ⚠️ น้องจดให้เป็นห่วงนะ ใช้งบไปเยอะมากเลย!
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ── Stats ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3 px-0.5" style={{ color: 'var(--color-text-muted)' }}>เดือนนี้</p>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="รายรับ" amount={data.totalIncome} variant="income" loading={isLoadingDashboard && !dashboard} />
          <StatCard label="รายจ่าย" amount={data.totalExpense} variant="expense" loading={isLoadingDashboard && !dashboard} />
        </div>
      </div>

      {/* ── Recent Transactions ── */}
      <div className="card px-5 pt-5 pb-4" style={{ background: '#FFFFFF' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>รายการล่าสุด</h2>
          <button onClick={() => navigate('/history')} className="flex items-center gap-0.5 text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: 'var(--color-brand)' }}>
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

      {/* ── AI Analysis Card ── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="card overflow-hidden" style={{ background: '#FFFFFF' }}>
        {/* Gradient header */}
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #C15F3C 0%, #A34E30 100%)' }}>
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-white" />
            <h2 className="text-sm font-bold text-white">AI วิเคราะห์เดือนนี้</h2>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={loadAnalysis}
            disabled={loadingAnalysis}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-60"
            style={{ background: 'rgba(255,255,255,0.20)', color: 'white', border: '1px solid rgba(255,255,255,0.30)' }}
          >
            {loadingAnalysis ? (
              <>
                <RefreshCw size={11} className="animate-spin" />
                กำลังวิเคราะห์...
              </>
            ) : (
              <>
                <Sparkles size={11} />
                วิเคราะห์เลย
              </>
            )}
          </motion.button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <AnimatePresence mode="wait">
            {!analysis && !loadingAnalysis && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center py-7 space-y-2">
                <p className="text-2xl">🔍</p>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                  กดปุ่ม "วิเคราะห์เลย" เพื่อให้ AI สรุปการใช้เงินของเธอค่า
                </p>
              </motion.div>
            )}

            {loadingAnalysis && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="space-y-2.5 py-2">
                {[1, 2, 3, 4].map((i) => (
                  <SkeletonLine key={i} w={i % 2 === 0 ? 'w-4/5' : 'w-full'} h="h-3" />
                ))}
              </motion.div>
            )}

            {analysis && !loadingAnalysis && (
              <motion.div key="result" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-2">
                {analysis.split('\n').filter(Boolean).map((line, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--color-text)' }}
                  >
                    {line}
                  </motion.p>
                ))}
                <div className="pt-3 flex justify-end">
                  <button
                    onClick={() => setAnalysis(null)}
                    className="text-xs font-semibold px-3 py-1 rounded-full transition-all"
                    style={{ color: 'var(--color-brand)', background: 'var(--color-brand-dim)' }}
                  >
                    ล้างผล ×
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
