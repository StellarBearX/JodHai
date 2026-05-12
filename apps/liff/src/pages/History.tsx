import { useEffect, useState } from 'react';
import { Trash2, Loader2, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { Transaction } from '@jod-hai/shared';

type FilterType = 'ALL' | 'INCOME' | 'EXPENSE';

const CATEGORY_EMOJI: Record<string, string> = {
  Food: '🍜', Transport: '🚗', Shopping: '🛍️', Health: '💊',
  Entertainment: '🎬', Bills: '📄', Salary: '💰', Other: '📦',
};

function getCategoryEmoji(category: string) {
  return CATEGORY_EMOJI[category] ?? '📦';
}

function formatDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
}
function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

// Group transactions by date label
function groupByDate(txs: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const label = formatDate(tx.createdAt);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(tx);
  }
  return groups;
}

export default function History() {
  const { user, transactions, isLoadingTransactions, loadTransactions, removeTransaction } = useAppStore();
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadTransactions();
  }, [user, loadTransactions]);

  const filtered = transactions.filter((tx) =>
    filter === 'ALL' ? true : tx.type === filter,
  );

  const grouped = groupByDate(filtered);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await removeTransaction(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="px-4 pt-6 pb-4 max-w-lg mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          ประวัติรายการ
        </h1>
        <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--color-text-muted)' }}>
          {filtered.length} รายการ
        </span>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex gap-2 mb-4">
        {(['ALL', 'EXPENSE', 'INCOME'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: filter === f
                ? f === 'INCOME' ? 'rgba(52,211,153,0.2)' : f === 'EXPENSE' ? 'rgba(248,113,113,0.2)' : 'rgba(34,197,94,0.2)'
                : 'rgba(255,255,255,0.05)',
              color: filter === f
                ? f === 'INCOME' ? 'var(--color-income)' : f === 'EXPENSE' ? 'var(--color-expense)' : 'var(--color-brand)'
                : 'var(--color-text-muted)',
              border: `1px solid ${filter === f ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
            }}
          >
            {f === 'ALL' ? 'ทั้งหมด' : f === 'INCOME' ? '💰 รายรับ' : '💸 รายจ่าย'}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {isLoadingTransactions ? (
        <div className="flex justify-center py-16">
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-brand)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <p className="text-3xl mb-3">🧾</p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            ยังไม่มีรายการ ลองพิมพ์ใน Chat ได้เลย!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...grouped.entries()].map(([date, txs]) => (
            <div key={date}>
              {/* Date header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                  {date}
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>

              {/* Transaction rows */}
              <div className="glass-card divide-y divide-white/5">
                {txs.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    isDeleting={deletingId === tx.id}
                    onDelete={() => handleDelete(tx.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Row component ────────────────────────────────────────────────────────────
function TransactionRow({
  tx,
  isDeleting,
  onDelete,
}: {
  tx: Transaction;
  isDeleting: boolean;
  onDelete: () => void;
}) {
  const isIncome = tx.type === 'INCOME';

  return (
    <div className="flex items-center gap-3 px-4 py-3 group">
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
        style={{ background: isIncome ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)' }}
      >
        {getCategoryEmoji(tx.category)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--color-text)' }}>
          {tx.note || tx.category}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-muted)' }}
          >
            {tx.category}
          </span>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {formatTime(tx.createdAt)}
          </span>
        </div>
      </div>

      {/* Amount + Delete */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <p
          className="text-sm font-bold"
          style={{ color: isIncome ? 'var(--color-income)' : 'var(--color-expense)' }}
        >
          {isIncome ? '+' : '-'}฿{tx.amount.toLocaleString('th-TH')}
        </p>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 opacity-0 group-hover:opacity-100"
          style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}
          aria-label="ลบ"
        >
          {isDeleting ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Trash2 size={13} />
          )}
        </button>
      </div>
    </div>
  );
}
