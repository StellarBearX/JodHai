import { useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ChevronRight,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import type { Transaction } from '@jod-hai/shared';

// ─── Mock data (used when API is not yet connected) ───────────────────────────
const MOCK_DASHBOARD = {
  totalIncome: 28500,
  totalExpense: 14320,
  balance: 14180,
  budgetUsedPercent: 57,
  recentTransactions: [
    { id: '1', userId: 'u1', amount: 65,    type: 'EXPENSE' as const, category: 'Food',      note: 'ชานมไข่มุก',    createdAt: new Date('2024-07-10T08:30:00') },
    { id: '2', userId: 'u1', amount: 380,   type: 'EXPENSE' as const, category: 'Transport', note: 'Grab ไปทำงาน',   createdAt: new Date('2024-07-10T07:45:00') },
    { id: '3', userId: 'u1', amount: 20000, type: 'INCOME'  as const, category: 'Salary',    note: 'เงินเดือน ก.ค.', createdAt: new Date('2024-07-09T09:00:00') },
    { id: '4', userId: 'u1', amount: 250,   type: 'EXPENSE' as const, category: 'Food',      note: 'อาหารกลางวัน',   createdAt: new Date('2024-07-09T12:15:00') },
    { id: '5', userId: 'u1', amount: 8500,  type: 'INCOME'  as const, category: 'Other',     note: 'ค่า freelance',  createdAt: new Date('2024-07-08T16:00:00') },
  ],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  amount,
  variant,
}: {
  label: string;
  amount: number;
  variant: 'income' | 'expense';
}) {
  const isIncome = variant === 'income';
  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: isIncome ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
        }}
      >
        {isIncome ? (
          <TrendingUp size={20} color="var(--color-income)" />
        ) : (
          <TrendingDown size={20} color="var(--color-expense)" />
        )}
      </div>
      <div>
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </p>
        <p
          className="text-base font-bold"
          style={{ color: isIncome ? 'var(--color-income)' : 'var(--color-expense)' }}
        >
          ฿{amount.toLocaleString('th-TH')}
        </p>
      </div>
    </div>
  );
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const isIncome = tx.type === 'INCOME';
  const date = new Date(tx.createdAt);
  const timeStr = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-center gap-3 py-3">
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
        style={{ background: isIncome ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)' }}
      >
        {isIncome ? '💰' : getCategoryEmoji(tx.category)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
          {tx.note ?? tx.category}
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {tx.category} · {timeStr}
        </p>
      </div>

      {/* Amount */}
      <p
        className="text-sm font-bold flex-shrink-0"
        style={{ color: isIncome ? 'var(--color-income)' : 'var(--color-expense)' }}
      >
        {isIncome ? '+' : '-'}฿{tx.amount.toLocaleString('th-TH')}
      </p>
    </div>
  );
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    Food: '🍜',
    Transport: '🚗',
    Shopping: '🛍️',
    Health: '💊',
    Entertainment: '🎬',
    Bills: '📄',
    Salary: '💼',
    Other: '📦',
  };
  return map[category] ?? '📦';
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, dashboard, isLoadingDashboard, dashboardError, loadDashboard } = useAppStore();
  const navigate = useNavigate();

  // Use mock data when user isn't authenticated (dev mode)
  const data = dashboard ?? MOCK_DASHBOARD;
  const isDanger = data.budgetUsedPercent >= 80;

  useEffect(() => {
    if (user) loadDashboard();
  }, [user, loadDashboard]);

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            สวัสดี 👋
          </p>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            {user?.displayName ?? 'ผู้ใช้งาน'}
          </h1>
        </div>
        <button
          onClick={() => loadDashboard()}
          disabled={isLoadingDashboard}
          className="w-10 h-10 rounded-xl glass-card flex items-center justify-center transition-all active:scale-90"
          aria-label="รีเฟรช"
        >
          {isLoadingDashboard ? (
            <Loader2 size={18} className="animate-spin" style={{ color: 'var(--color-brand)' }} />
          ) : (
            <RefreshCw size={18} style={{ color: 'var(--color-text-muted)' }} />
          )}
        </button>
      </div>

      {/* ── Error Banner ── */}
      {dashboardError && (
        <div className="glass-card p-3 flex items-center gap-2 border-red-500/30">
          <AlertCircle size={16} color="#f87171" />
          <p className="text-sm text-red-400">{dashboardError}</p>
        </div>
      )}

      {/* ── Balance Card ── */}
      <div
        className="glass-card p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.25), rgba(15,23,42,0.8))' }}
      >
        {/* Decorative glow */}
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'rgba(34,197,94,0.12)', filter: 'blur(24px)' }}
        />

        <p className="text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
          ยอดคงเหลือ
        </p>
        <p className="text-4xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
          ฿{data.balance.toLocaleString('th-TH')}
        </p>

        {/* Budget Progress */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span className="flex items-center gap-1">
              <Wallet size={12} /> งบประมาณเดือนนี้
            </span>
            <span className={isDanger ? 'text-red-400 font-semibold' : ''}>
              {data.budgetUsedPercent.toFixed(0)}%
            </span>
          </div>
          <div className="progress-track">
            <div
              className={`progress-fill${isDanger ? ' danger' : ''}`}
              style={{ width: `${data.budgetUsedPercent}%` }}
            />
          </div>
          {isDanger && (
            <p className="text-xs text-red-400 font-medium">⚠️ ใกล้ถึงงบประมาณแล้ว!</p>
          )}
        </div>
      </div>

      {/* ── Income / Expense Stats ── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="รายรับ" amount={data.totalIncome} variant="income" />
        <StatCard label="รายจ่าย" amount={data.totalExpense} variant="expense" />
      </div>

      {/* ── Recent Transactions ── */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            รายการล่าสุด
          </h2>
          <button
            onClick={() => navigate('/history')}
            className="flex items-center gap-0.5 text-xs font-medium"
            style={{ color: 'var(--color-brand)' }}
          >
            ดูทั้งหมด <ChevronRight size={14} />
          </button>
        </div>

        {isLoadingDashboard ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-brand)' }} />
          </div>
        ) : data.recentTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              ยังไม่มีรายการ ลองพิมพ์ใน LINE ได้เลย!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {data.recentTransactions.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
