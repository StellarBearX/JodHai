import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, ChevronDown, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import type { CategoryBudget } from '@jod-hai/shared';

type Period = 'daily' | 'weekly' | 'monthly';

const CATEGORIES = [
  { key: 'Food',          emoji: '🍜', label: 'อาหาร' },
  { key: 'Transport',     emoji: '🚗', label: 'เดินทาง' },
  { key: 'Shopping',      emoji: '🛍️', label: 'ช้อปปิ้ง' },
  { key: 'Health',        emoji: '💊', label: 'สุขภาพ' },
  { key: 'Entertainment', emoji: '🎬', label: 'บันเทิง' },
  { key: 'Bills',         emoji: '📄', label: 'ค่าใช้จ่าย' },
  { key: 'Other',         emoji: '📦', label: 'อื่นๆ' },
];

const PERIOD_OPTIONS: { value: Period; label: string; sub: string }[] = [
  { value: 'daily',   label: 'รายวัน',     sub: 'รีเซตทุกวันตอนเที่ยงคืน' },
  { value: 'weekly',  label: 'รายสัปดาห์', sub: 'รีเซตทุกสัปดาห์' },
  { value: 'monthly', label: 'รายเดือน',   sub: 'รีเซตทุกเดือน' },
];

const START_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

function fmt(n: number) { return n.toLocaleString('th-TH'); }

export default function Budget() {
  const navigate = useNavigate();
  const {
    userProfile, dashboard,
    loadUserProfile, saveUserSettings,
    categoryBudgets, loadCategoryBudgets, saveCategoryBudgetsAction,
    isSavingSettings,
  } = useAppStore();

  const [period, setPeriod]     = useState<Period>('monthly');
  const [startDay, setStartDay] = useState(1);
  const [amounts, setAmounts]   = useState<Record<string, string>>({});
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => { loadUserProfile(); loadCategoryBudgets(); }, []);

  useEffect(() => {
    if (userProfile) {
      setPeriod((userProfile.budgetPeriod as Period) ?? 'monthly');
      setStartDay(userProfile.cycleStartDay ?? 1);
    }
  }, [userProfile]);

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const b of categoryBudgets) map[b.category] = String(b.amount);
    setAmounts(map);
  }, [categoryBudgets]);

  const spending     = dashboard?.byCategory ?? {};
  const totalBudget  = userProfile?.budget ?? 0;
  const totalAlloc   = CATEGORIES.reduce((s, c) => s + (Number(amounts[c.key]) || 0), 0);
  const remaining    = totalBudget - totalAlloc;
  const isOverBudget = totalBudget > 0 && totalAlloc > totalBudget;
  const allocPct     = totalBudget > 0 ? Math.min((totalAlloc / totalBudget) * 100, 100) : 0;

  const handleSave = async () => {
    if (isOverBudget) return;
    setSaving(true);
    try {
      await saveUserSettings({ budgetPeriod: period, cycleStartDay: startDay });
      const budgets: CategoryBudget[] = CATEGORIES
        .filter((c) => amounts[c.key] && Number(amounts[c.key]) > 0)
        .map((c) => ({ category: c.key, amount: Number(amounts[c.key]) }));
      await saveCategoryBudgetsAction(budgets);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full" style={{ background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <div
        className="flex items-center gap-3 px-4 pt-4 pb-3 flex-shrink-0"
        style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}
      >
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => navigate('/settings')}
          className="icon-wrap-sm focus-visible:outline-none"
          style={{ background: 'var(--surface-2)', border: '1.5px solid var(--border)', color: 'var(--text-2)' }}
          aria-label="กลับ"
        >
          <ArrowLeft size={16} />
        </motion.button>
        <h1 className="flex-1 text-base font-bold" style={{ color: 'var(--text-1)' }}>งบประมาณ</h1>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSave}
          disabled={saving || isSavingSettings || isOverBudget}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 focus-visible:outline-none"
          style={{ background: 'linear-gradient(135deg, var(--brand-btn), var(--brand-dark))', color: 'white' }}
        >
          <AnimatePresence mode="wait">
            {saved
              ? <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1"><Check size={14} /> บันทึกแล้ว</motion.span>
              : <motion.span key="save"  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>บันทึก</motion.span>
            }
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* ── Budget summary bar ── */}
        {totalBudget > 0 && (
          <section
            className="rounded-2xl p-4"
            style={{ background: 'var(--surface)', border: `1.5px solid ${isOverBudget ? 'var(--expense)' : 'var(--border)'}`, boxShadow: 'var(--shadow-sm)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>งบรวมทั้งหมด</p>
              <p className="text-sm font-extrabold" style={{ color: isOverBudget ? 'var(--expense)' : 'var(--text-1)' }}>
                ฿{fmt(totalBudget)}
              </p>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--surface-2)' }}>
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${allocPct}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                  background: isOverBudget
                    ? 'var(--expense)'
                    : allocPct >= 80
                    ? 'var(--warning, #D97706)'
                    : 'linear-gradient(90deg, var(--brand-btn), var(--brand-dark))',
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span style={{ color: 'var(--text-3)' }}>จัดสรรแล้ว ฿{fmt(totalAlloc)}</span>
              <span style={{ color: isOverBudget ? 'var(--expense)' : remaining === 0 ? 'var(--text-3)' : 'var(--income)' }}>
                {isOverBudget ? `เกิน ฿${fmt(-remaining)}` : `เหลือ ฿${fmt(remaining)}`}
              </span>
            </div>

            {/* Over-budget warning */}
            <AnimatePresence>
              {isOverBudget && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: 'var(--expense-bg)', color: 'var(--expense)' }}
                >
                  <AlertTriangle size={13} />
                  ยอดรวมเกินงบที่ตั้งไว้ ลดบางหมวดก่อนบันทึกได้เลยค่า
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {/* No total budget set — prompt */}
        {totalBudget === 0 && (
          <div
            className="rounded-2xl px-4 py-3 flex items-center gap-2 text-xs font-semibold"
            style={{ background: 'var(--brand-dim)', color: 'var(--brand-on-dim)', border: '1.5px solid var(--border)' }}
          >
            <AlertTriangle size={13} />
            ยังไม่ได้ตั้งงบรวม — ไปตั้งที่ ตั้งค่า → งบประมาณต่อเดือน ก่อนนะ
          </div>
        )}

        {/* ── Budget Period ── */}
        <section
          className="rounded-2xl p-4"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <p className="section-label mb-3">รอบงบประมาณ</p>
          <div className="space-y-2">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all focus-visible:outline-none"
                style={{
                  background: period === opt.value ? 'var(--brand-dim)' : 'var(--surface-2)',
                  border: `1.5px solid ${period === opt.value ? 'var(--brand)' : 'var(--border)'}`,
                }}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    borderColor: period === opt.value ? 'var(--brand-btn)' : 'var(--text-3)',
                    background:  period === opt.value ? 'var(--brand-btn)' : 'transparent',
                  }}
                >
                  {period === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{opt.label}</p>
                  <p className="text-xs"             style={{ color: 'var(--text-3)' }}>{opt.sub}</p>
                </div>
              </button>
            ))}
          </div>

          {period === 'monthly' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-2)' }}>วันเริ่มต้นรอบ</p>
              <div className="relative">
                <select
                  value={startDay}
                  onChange={(e) => setStartDay(Number(e.target.value))}
                  className="select-field pr-8 appearance-none"
                  style={{ backgroundImage: 'none' }}
                >
                  {START_DAYS.map((d) => <option key={d} value={d}>วันที่ {d} ของเดือน</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-3)' }} />
              </div>
            </motion.div>
          )}
        </section>

        {/* ── Category Budgets ── */}
        <section
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div className="px-4 pt-4 pb-2">
            <p className="section-label">งบแต่ละหมวด</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>รวมทุกหมวดต้องไม่เกินงบรวม · ปล่อยว่างถ้าไม่ตั้ง</p>
          </div>

          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {CATEGORIES.map((cat) => {
              const spent  = spending[cat.key] ?? 0;
              const budget = Number(amounts[cat.key] || 0);
              const pct    = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
              const isOver = budget > 0 && spent > budget;
              const isWarn = budget > 0 && pct >= 80 && !isOver;

              return (
                <div key={cat.key} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl flex-shrink-0">{cat.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{cat.label}</p>
                        {spent > 0 && (
                          <p className="text-xs font-medium flex-shrink-0" style={{ color: isOver ? 'var(--expense)' : 'var(--text-3)' }}>
                            ใช้ไป ฿{fmt(spent)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-3)' }}>฿</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="ไม่ได้ตั้ง"
                          value={amounts[cat.key] ?? ''}
                          onChange={(e) => setAmounts((prev) => ({ ...prev, [cat.key]: e.target.value }))}
                          className="flex-1 input-field py-1.5 text-sm"
                          min={0}
                          max={totalBudget > 0 ? totalBudget : undefined}
                        />
                      </div>
                    </div>
                  </div>

                  {budget > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          style={{
                            background: isOver ? 'var(--expense)' : isWarn ? 'var(--warning, #D97706)' : 'var(--income)',
                          }}
                        />
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <p className="text-xs" style={{ color: isOver ? 'var(--expense)' : 'var(--text-3)' }}>
                          {isOver ? '⚠️ เกินงบ!' : `${pct.toFixed(0)}%`}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-3)' }}>฿{fmt(budget)}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="h-4" />
      </div>
    </div>
  );
}
