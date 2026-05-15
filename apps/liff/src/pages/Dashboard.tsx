import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, RefreshCw, AlertCircle, Sparkles, ArrowUpRight } from 'lucide-react';
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

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    startRef.current = null;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * ease));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return value;
}

function SkeletonLine({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) {
  return <div className={`skeleton ${w} ${h}`} />;
}

// ── Stat chip inside balance card ─────────────────────────────
function StatChip({ label, amount, variant }: { label: string; amount: number; variant: 'income' | 'expense' }) {
  const animated = useCountUp(amount);
  const isIncome = variant === 'income';
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      <div
        className="icon-wrap-sm"
        style={{ background: isIncome ? 'var(--income-bg)' : 'var(--expense-bg)' }}
      >
        {isIncome
          ? <TrendingUp size={15} style={{ color: 'var(--income)' }} />
          : <TrendingDown size={15} style={{ color: 'var(--expense)' }} />
        }
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>{label}</p>
        <p className="text-sm font-bold leading-tight truncate" style={{ color: isIncome ? 'var(--income)' : 'var(--expense)' }}>
          ฿{animated.toLocaleString('th-TH')}
        </p>
      </div>
    </div>
  );
}

// ── Transaction row ────────────────────────────────────────────
function TxRow({ tx }: { tx: Transaction }) {
  const isIncome = tx.type === 'INCOME';
  const timeStr = new Date(tx.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  return (
    <motion.div initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 py-2.5">
      <div
        className="icon-wrap text-base flex-shrink-0"
        style={{ background: isIncome ? 'var(--income-bg)' : 'var(--expense-bg)' }}
      >
        {CATEGORY_EMOJI[tx.category] ?? '📦'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>{tx.note ?? tx.category}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{tx.category} · {timeStr}</p>
      </div>
      <p className="text-sm font-bold flex-shrink-0" style={{ color: isIncome ? 'var(--income)' : 'var(--expense)' }}>
        {isIncome ? '+' : '−'}฿{tx.amount.toLocaleString('th-TH')}
      </p>
    </motion.div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────
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
      setAnalysis('ขอโทษค่า ไม่สามารถวิเคราะห์ได้ในขณะนี้ ลองใหม่อีกทีนะคะ');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const isLoading = isLoadingDashboard && !dashboard;

  return (
    <div className="min-h-full px-4 pt-5 pb-5 max-w-lg mx-auto space-y-4" style={{ background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <NongJodHai state={mascotState} size={40} />
          <div>
            <p className="text-xs font-medium" style={{ color: 'var(--text-3)' }}>สวัสดีค่า</p>
            <h1 className="text-lg font-extrabold leading-tight" style={{ color: 'var(--text-1)' }}>
              {user?.displayName ?? 'เพื่อน'}
            </h1>
          </div>
        </div>
        <motion.button
          whileTap={{ rotate: 360, scale: 0.9 }}
          transition={{ duration: 0.4 }}
          onClick={() => loadDashboard()}
          disabled={isLoadingDashboard}
          aria-label="รีเฟรชข้อมูล"
          className="icon-wrap transition-colors"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}
        >
          <RefreshCw size={16} style={{ color: 'var(--text-3)' }} className={isLoadingDashboard ? 'animate-spin' : ''} />
        </motion.button>
      </div>

      {/* ── Error banner ── */}
      <AnimatePresence>
        {dashboardError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
            style={{ background: 'var(--expense-bg)', border: '1px solid var(--expense-icon-bg)' }}
            role="alert"
          >
            <AlertCircle size={15} style={{ color: 'var(--expense)', flexShrink: 0 }} />
            <p className="text-sm font-medium" style={{ color: 'var(--expense)' }}>{dashboardError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Balance card ── */}
      {isLoading ? (
        <div className="card p-5 space-y-3">
          <SkeletonLine w="w-24" h="h-3" />
          <SkeletonLine w="w-40" h="h-10" />
          <SkeletonLine w="w-full" h="h-1.5" />
          <div className="flex gap-3 pt-1">
            <SkeletonLine w="w-1/2" h="h-12" />
            <SkeletonLine w="w-1/2" h="h-12" />
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="card px-5 pt-5 pb-4 relative overflow-hidden"
        >
          {/* Subtle brand glow */}
          <div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: isDanger ? 'var(--expense-bg)' : 'var(--brand-dim)', filter: 'blur(32px)', opacity: 0.7 }}
          />

          <p className="section-label mb-1 relative">ยอดคงเหลือ</p>

          <motion.p
            key={data.balance}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold tracking-tight mb-4 relative"
            style={{ color: 'var(--text-1)' }}
          >
            ฿{balanceAnimated.toLocaleString('th-TH')}
          </motion.p>

          {/* Budget progress */}
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between items-center text-xs font-semibold" style={{ color: 'var(--text-3)' }}>
              <span className="flex items-center gap-1.5">
                <Wallet size={11} style={{ color: 'var(--text-3)' }} />
                งบประมาณเดือนนี้
              </span>
              <span style={{ color: isDanger ? 'var(--expense)' : isWarn ? 'var(--warning)' : 'var(--brand-dark)', fontWeight: 700 }}>
                {pct.toFixed(0)}%
              </span>
            </div>
            <div className="progress-track">
              <motion.div
                className={`progress-fill${progressColor ? ` ${progressColor}` : ''}`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(pct, 100)}%` }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
              />
            </div>
            <AnimatePresence>
              {isDanger && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs font-semibold" style={{ color: 'var(--expense)' }} role="alert">
                  ใช้งบเดือนนี้เยอะมากแล้วนะคะ!
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Income / Expense chips */}
          <div className="flex gap-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <StatChip label="รายรับ" amount={data.totalIncome} variant="income" />
            <div style={{ width: 1, background: 'var(--border)' }} />
            <StatChip label="รายจ่าย" amount={data.totalExpense} variant="expense" />
          </div>
        </motion.div>
      )}

      {/* ── Recent Transactions ── */}
      <div className="card">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>รายการล่าสุด</h2>
          <button
            onClick={() => navigate('/history')}
            className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70 focus-visible:outline-none"
            style={{ color: 'var(--brand-dark)' }}
          >
            ดูทั้งหมด <ArrowUpRight size={13} />
          </button>
        </div>

        <div className="px-5">
          {isLoading ? (
            <div className="space-y-3 py-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <SkeletonLine w="w-3/4" h="h-3" />
                    <SkeletonLine w="w-1/2" h="h-2.5" />
                  </div>
                  <SkeletonLine w="w-16" h="h-4" />
                </div>
              ))}
            </div>
          ) : data.recentTransactions.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <NongJodHai state="idle" size={56} className="mx-auto" />
              <p className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>
                ยังไม่มีรายการ ไปแชทกับน้องจดให้ได้เลยค่า
              </p>
              <button onClick={() => navigate('/chat')} className="btn-brand px-5 py-2 text-sm">
                เริ่มบันทึก
              </button>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {data.recentTransactions.map((tx) => <TxRow key={tx.id} tx={tx} />)}
            </div>
          )}
        </div>
      </div>

      {/* ── AI Analysis card ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="card overflow-hidden"
      >
        {/* Header */}
        <div
          className="px-5 py-3.5 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, var(--brand-btn) 0%, var(--brand-dark) 100%)' }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={14} color="rgba(255,255,255,0.9)" />
            <h2 className="text-sm font-bold text-white">AI วิเคราะห์เดือนนี้</h2>
          </div>
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={loadAnalysis}
            disabled={loadingAnalysis}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none disabled:opacity-60"
            style={{ background: 'rgba(255,255,255,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.28)' }}
            aria-label={loadingAnalysis ? 'กำลังวิเคราะห์' : 'วิเคราะห์การใช้เงิน'}
          >
            {loadingAnalysis ? (
              <><RefreshCw size={11} className="animate-spin" />กำลังวิเคราะห์...</>
            ) : (
              <><Sparkles size={11} />วิเคราะห์เลย</>
            )}
          </motion.button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <AnimatePresence mode="wait">
            {!analysis && !loadingAnalysis && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center py-6 space-y-2">
                <p className="text-xl">🔍</p>
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                  กดปุ่มเพื่อให้ AI สรุปการใช้เงินของเธอค่า
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
              <motion.div key="result" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                {analysis.split('\n').filter(Boolean).map((line, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="text-sm leading-relaxed"
                    style={{ color: 'var(--text-2)' }}
                  >
                    {line}
                  </motion.p>
                ))}
                <div className="pt-3 flex justify-end">
                  <button
                    onClick={() => setAnalysis(null)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors focus-visible:outline-none"
                    style={{ color: 'var(--brand-dark)', background: 'var(--brand-dim)' }}
                  >
                    ล้างผล
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

    </div>
  );
}
