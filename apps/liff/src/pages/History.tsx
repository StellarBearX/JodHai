import { useEffect, useState } from 'react';
import { Trash2, Loader2, Search, X, Check } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { Transaction } from '@jod-hai/shared';

type FilterType = 'ALL' | 'INCOME' | 'EXPENSE';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Bills', 'Salary', 'Other'];

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

function groupByDate(txs: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();
  for (const tx of txs) {
    const label = formatDate(tx.createdAt);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(tx);
  }
  return groups;
}

// ─── Edit Panel ───────────────────────────────────────────────────────────────
interface EditPanelProps {
  tx: Transaction;
  onSave: (data: { amount?: number; type?: 'INCOME' | 'EXPENSE'; category?: string; note?: string }) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

function EditPanel({ tx, onSave, onCancel, isSaving }: EditPanelProps) {
  const [amount, setAmount] = useState(String(tx.amount));
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>(tx.type);
  const [category, setCategory] = useState(tx.category);
  const [note, setNote] = useState(tx.note ?? '');

  const handleSave = async () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    await onSave({ amount: amountNum, type, category, note: note || undefined });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl p-5 space-y-4"
        style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderBottom: 'none' }}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto" style={{ background: 'rgba(255,255,255,0.2)' }} />

        <p className="text-base font-bold text-center" style={{ color: 'var(--color-text)' }}>
          แก้ไขรายการ
        </p>

        {/* Amount */}
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
            style={{ color: 'var(--color-text-muted)' }}
          >
            ฿
          </span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="จำนวนเงิน"
            min={0}
            className="w-full pl-7 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--color-text)',
            }}
          />
        </div>

        {/* Type toggle */}
        <div
          className="flex rounded-xl overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <button
            onClick={() => setType('EXPENSE')}
            className="flex-1 py-2.5 text-sm font-semibold transition-all"
            style={{
              background: type === 'EXPENSE' ? 'rgba(248,113,113,0.25)' : 'rgba(255,255,255,0.05)',
              color: type === 'EXPENSE' ? 'var(--color-expense)' : 'var(--color-text-muted)',
            }}
          >
            💸 รายจ่าย
          </button>
          <button
            onClick={() => setType('INCOME')}
            className="flex-1 py-2.5 text-sm font-semibold transition-all"
            style={{
              background: type === 'INCOME' ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.05)',
              color: type === 'INCOME' ? 'var(--color-income)' : 'var(--color-text-muted)',
            }}
          >
            💰 รายรับ
          </button>
        </div>

        {/* Category */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'var(--color-text)',
          }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} style={{ background: '#1e293b' }}>
              {CATEGORY_EMOJI[c]} {c}
            </option>
          ))}
        </select>

        {/* Note */}
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="หมายเหตุ (ไม่จำเป็น)"
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'var(--color-text)',
          }}
        />

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.07)',
              color: 'var(--color-text-muted)',
            }}
          >
            <X size={16} />
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 btn-brand flex items-center justify-center gap-2 py-3 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
            บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── History Page ─────────────────────────────────────────────────────────────
export default function History() {
  const { user, transactions, isLoadingTransactions, loadTransactions, removeTransaction, editTransaction } = useAppStore();
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    if (user) loadTransactions();
  }, [user, loadTransactions]);

  const filtered = transactions.filter((tx) => {
    const matchesFilter = filter === 'ALL' ? true : tx.type === filter;
    if (!matchesFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (tx.note ?? '').toLowerCase().includes(q) ||
      tx.category.toLowerCase().includes(q)
    );
  });

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

  const handleEditSave = async (data: { amount?: number; type?: 'INCOME' | 'EXPENSE'; category?: string; note?: string }) => {
    if (!editingTx) return;
    setIsSavingEdit(true);
    try {
      await editTransaction(editingTx.id, data);
      setEditingTx(null);
    } finally {
      setIsSavingEdit(false);
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
      <div className="flex gap-2 mb-3">
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

      {/* ── Search ── */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาจากหมายเหตุหรือหมวดหมู่..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--color-text)',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={14} />
          </button>
        )}
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
            {search ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีรายการ ลองพิมพ์ใน Chat ได้เลย!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...grouped.entries()].map(([date, txs]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                  {date}
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <div className="glass-card divide-y divide-white/5">
                {txs.map((tx) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    isDeleting={deletingId === tx.id}
                    onDelete={() => handleDelete(tx.id)}
                    onEdit={() => setEditingTx(tx)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Edit Panel ── */}
      {editingTx && (
        <EditPanel
          tx={editingTx}
          onSave={handleEditSave}
          onCancel={() => setEditingTx(null)}
          isSaving={isSavingEdit}
        />
      )}
    </div>
  );
}

// ─── Row component ────────────────────────────────────────────────────────────
function TransactionRow({
  tx,
  isDeleting,
  onDelete,
  onEdit,
}: {
  tx: Transaction;
  isDeleting: boolean;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const isIncome = tx.type === 'INCOME';

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 group cursor-pointer transition-all active:bg-white/5"
      onClick={onEdit}
    >
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
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
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
