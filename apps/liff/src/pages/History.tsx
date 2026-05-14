import { useEffect, useState } from 'react';
import { Trash2, Loader2, Search, X, Check, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import type { Transaction } from '@jod-hai/shared';

type FilterType = 'ALL' | 'INCOME' | 'EXPENSE';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Bills', 'Salary', 'Other'];
const CATEGORY_EMOJI: Record<string, string> = {
  Food: '🍜', Transport: '🚗', Shopping: '🛍️', Health: '💊',
  Entertainment: '🎬', Bills: '📄', Salary: '💰', Other: '📦',
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
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

// ─── Edit bottom sheet ─────────────────────────────────────────────────────────
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
      className="sheet-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      role="dialog"
      aria-modal="true"
      aria-label="แก้ไขรายการ"
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        className="w-full max-w-lg flex flex-col"
        style={{
          background: 'var(--surface)',
          borderRadius: '24px 24px 0 0',
          borderTop: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: `calc(92dvh - var(--bottom-nav-height))`,
        }}
      >
        {/* ── Fixed top: handle + header ── */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0">
          <div className="sheet-handle mb-4" />
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold" style={{ color: 'var(--text-1)' }}>แก้ไขรายการ</h2>
            <button
              onClick={onCancel}
              className="icon-wrap-sm transition-colors focus-visible:outline-none"
              style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}
              aria-label="ปิด"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* ── Scrollable fields ── */}
        <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-3">
          {/* Amount */}
          <div className="space-y-1">
            <label className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>จำนวนเงิน</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--text-3)' }}>฿</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={0}
                className="input-field pl-8"
                autoFocus
              />
            </div>
          </div>

          {/* Type toggle */}
          <div className="space-y-1">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>ประเภท</p>
            <div
              className="grid grid-cols-2 rounded-xl overflow-hidden p-1 gap-1"
              style={{ background: 'var(--surface-2)', border: '1.5px solid var(--border)' }}
              role="group"
              aria-label="ประเภทรายการ"
            >
              <button
                onClick={() => setType('EXPENSE')}
                className="py-2.5 rounded-lg text-sm font-semibold transition-all focus-visible:outline-none"
                style={{
                  background: type === 'EXPENSE' ? 'var(--surface)' : 'transparent',
                  color: type === 'EXPENSE' ? 'var(--expense)' : 'var(--text-3)',
                  boxShadow: type === 'EXPENSE' ? 'var(--shadow-xs)' : 'none',
                }}
                aria-pressed={type === 'EXPENSE'}
              >
                รายจ่าย
              </button>
              <button
                onClick={() => setType('INCOME')}
                className="py-2.5 rounded-lg text-sm font-semibold transition-all focus-visible:outline-none"
                style={{
                  background: type === 'INCOME' ? 'var(--surface)' : 'transparent',
                  color: type === 'INCOME' ? 'var(--income)' : 'var(--text-3)',
                  boxShadow: type === 'INCOME' ? 'var(--shadow-xs)' : 'none',
                }}
                aria-pressed={type === 'INCOME'}
              >
                รายรับ
              </button>
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label htmlFor="edit-category" className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>หมวดหมู่</label>
            <select
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="select-field"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div className="space-y-1">
            <label htmlFor="edit-note" className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>
              หมายเหตุ <span style={{ color: 'var(--text-4)' }}>(ไม่จำเป็น)</span>
            </label>
            <input
              id="edit-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ระบุรายละเอียด..."
              className="input-field"
            />
          </div>
        </div>

        {/* ── Fixed action buttons at bottom ── */}
        <div
          className="flex gap-3 px-5 pt-3 pb-6 flex-shrink-0"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button onClick={onCancel} className="btn-ghost flex-1">
            <X size={15} />
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-brand flex-1"
          >
            {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            บันทึก
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Transaction row ───────────────────────────────────────────────────────────
function TransactionRow({
  tx, isDeleting, onDelete, onEdit,
}: { tx: Transaction; isDeleting: boolean; onDelete: () => void; onEdit: () => void }) {
  const isIncome = tx.type === 'INCOME';

  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors" style={{ background: 'var(--surface)' }}>
      <button
        onClick={onEdit}
        className="flex items-center gap-3 flex-1 min-w-0 text-left focus-visible:outline-none rounded-lg"
        aria-label={`แก้ไข ${tx.note || tx.category}`}
        style={{ minHeight: 44 }}
      >
        <div
          className="icon-wrap text-base flex-shrink-0"
          style={{ background: isIncome ? 'var(--income-bg)' : 'var(--expense-bg)' }}
        >
          {CATEGORY_EMOJI[tx.category] ?? '📦'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-1)' }}>
            {tx.note || tx.category}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs px-1.5 py-0.5 rounded-md font-medium" style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}>
              {tx.category}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-4)' }}>{formatTime(tx.createdAt)}</span>
          </div>
        </div>
        <p className="text-sm font-bold flex-shrink-0" style={{ color: isIncome ? 'var(--income)' : 'var(--expense)' }}>
          {isIncome ? '+' : '−'}฿{tx.amount.toLocaleString('th-TH')}
        </p>
      </button>

      {/* Action buttons — always visible for mobile touch */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="icon-wrap-sm transition-colors focus-visible:outline-none"
          style={{ background: 'var(--brand-dim)', color: 'var(--brand-dark)' }}
          aria-label="แก้ไข"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="icon-wrap-sm transition-colors focus-visible:outline-none disabled:opacity-50"
          style={{ background: 'var(--expense-bg)', color: 'var(--expense)' }}
          aria-label="ลบ"
        >
          {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
        </button>
      </div>
    </div>
  );
}

// ─── History Page ──────────────────────────────────────────────────────────────
export default function History() {
  const { user, transactions, isLoadingTransactions, loadTransactions, removeTransaction, editTransaction } = useAppStore();
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => { if (user) loadTransactions(); }, [user, loadTransactions]);

  const filtered = transactions.filter((tx) => {
    if (filter !== 'ALL' && tx.type !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (tx.note ?? '').toLowerCase().includes(q) || tx.category.toLowerCase().includes(q);
  });

  const grouped = groupByDate(filtered);

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try { await removeTransaction(id); }
    finally { setDeletingId(null); }
  };

  const handleEditSave = async (data: { amount?: number; type?: 'INCOME' | 'EXPENSE'; category?: string; note?: string }) => {
    if (!editingTx) return;
    setIsSavingEdit(true);
    try { await editTransaction(editingTx.id, data); setEditingTx(null); }
    finally { setIsSavingEdit(false); }
  };

  const FILTER_CONFIG = [
    { key: 'ALL' as FilterType, label: 'ทั้งหมด', activeColor: 'var(--brand-dark)', activeBg: 'var(--brand-dim)' },
    { key: 'INCOME' as FilterType, label: 'รายรับ', activeColor: 'var(--income)', activeBg: 'var(--income-bg)' },
    { key: 'EXPENSE' as FilterType, label: 'รายจ่าย', activeColor: 'var(--expense)', activeBg: 'var(--expense-bg)' },
  ];

  return (
    <div className="px-4 pt-5 pb-5 max-w-lg mx-auto space-y-4" style={{ background: 'var(--bg)', minHeight: '100%' }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-extrabold" style={{ color: 'var(--text-1)' }}>ประวัติรายการ</h1>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full"
          style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}
        >
          {filtered.length} รายการ
        </span>
      </div>

      {/* ── Filter tabs ── */}
      <div
        className="grid grid-cols-3 rounded-xl p-1 gap-1"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        role="group"
        aria-label="กรองรายการ"
      >
        {FILTER_CONFIG.map(({ key, label, activeColor, activeBg }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            aria-pressed={filter === key}
            className="py-2 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none"
            style={{
              background: filter === key ? activeBg : 'transparent',
              color: filter === key ? activeColor : 'var(--text-3)',
              boxShadow: filter === key ? 'var(--shadow-xs)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาหมายเหตุหรือหมวดหมู่..."
          className="input-field pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none"
            style={{ background: 'var(--surface-3)', color: 'var(--text-3)' }}
            aria-label="ล้างการค้นหา"
          >
            <X size={11} />
          </button>
        )}
      </div>

      {/* ── Content ── */}
      {isLoadingTransactions ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--brand)' }} />
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>กำลังโหลด...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-8 text-center space-y-2">
          <p className="text-3xl">🧾</p>
          <p className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>
            {search ? 'ไม่พบรายการที่ค้นหา' : 'ยังไม่มีรายการ ลองพิมพ์ใน Chat ได้เลย!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...grouped.entries()].map(([date, txs]) => (
            <div key={date}>
              {/* Date label */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>{date}</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>
              {/* Transaction list */}
              <div className="card overflow-hidden divide-y" style={{ borderColor: 'var(--border)' }}>
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
      <AnimatePresence>
        {editingTx && (
          <EditPanel
            tx={editingTx}
            onSave={handleEditSave}
            onCancel={() => setEditingTx(null)}
            isSaving={isSavingEdit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
