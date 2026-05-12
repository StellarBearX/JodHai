import { useEffect, useState } from 'react';
import { Save, Loader2, Wallet, CalendarDays, User, CheckCircle, Zap, Trash2, LogOut } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const CYCLE_DAY_OPTIONS = [1, 5, 10, 15, 20, 25, 28];

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Bills', 'Salary', 'Other'];

const CATEGORY_EMOJI: Record<string, string> = {
  Food: '🍜', Transport: '🚗', Shopping: '🛍️', Health: '💊',
  Entertainment: '🎬', Bills: '📄', Salary: '💰', Other: '📦',
};

export default function Settings() {
  const {
    user, userProfile, loadUserProfile, saveUserSettings, isSavingSettings, isReady, setReady,
    trainingCases, isLoadingTrainingCases, loadTrainingCases, saveTrainingCase, removeTrainingCase,
  } = useAppStore();

  const [budget, setBudget] = useState('');
  const [cycleStartDay, setCycleStartDay] = useState(1);
  const [saved, setSaved] = useState(false);

  // Training case form state
  const [tcKeyword, setTcKeyword] = useState('');
  const [tcCategory, setTcCategory] = useState('Food');
  const [tcType, setTcType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [isSavingTc, setIsSavingTc] = useState(false);
  const [deletingTcId, setDeletingTcId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserProfile();
      loadTrainingCases();
    }
  }, [user, loadUserProfile, loadTrainingCases]);

  useEffect(() => {
    if (userProfile) {
      setBudget(userProfile.budget ? String(userProfile.budget) : '');
      setCycleStartDay(userProfile.cycleStartDay);
    }
  }, [userProfile]);

  const handleSave = async () => {
    const budgetNum = budget ? parseFloat(budget) : undefined;
    if (budgetNum !== undefined && (isNaN(budgetNum) || budgetNum < 0)) return;
    await saveUserSettings({ budget: budgetNum, cycleStartDay });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSaveTrainingCase = async () => {
    if (!tcKeyword.trim()) return;
    setIsSavingTc(true);
    try {
      await saveTrainingCase({ keyword: tcKeyword.trim(), category: tcCategory, type: tcType });
      setTcKeyword('');
    } finally {
      setIsSavingTc(false);
    }
  };

  const handleDeleteTrainingCase = async (id: string) => {
    if (deletingTcId) return;
    setDeletingTcId(id);
    try {
      await removeTrainingCase(id);
    } finally {
      setDeletingTcId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jodhai_user');
    window.location.reload();
  };

  return (
    <div className="px-4 pt-6 pb-6 max-w-lg mx-auto space-y-5">
      {/* ── Header ── */}
      <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
        ตั้งค่า
      </h1>

      {/* ── Profile Card ── */}
      <div className="glass-card p-4 flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--color-brand-dim)' }}
        >
          <User size={24} style={{ color: 'var(--color-brand)' }} />
        </div>
        <div>
          <p className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            {userProfile?.displayName ?? user?.displayName ?? '—'}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {userProfile?.lineUserId ?? user?.lineUserId ?? '—'}
          </p>
        </div>
      </div>

      {/* ── Budget Setting ── */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Wallet size={16} style={{ color: 'var(--color-brand)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            งบประมาณต่อเดือน
          </span>
        </div>
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium"
            style={{ color: 'var(--color-text-muted)' }}
          >
            ฿
          </span>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="20000"
            min={0}
            className="w-full pl-7 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--color-text)',
            }}
          />
        </div>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          ใช้สำหรับคำนวณ % การใช้งบในหน้าหลัก
        </p>
      </div>

      {/* ── Cycle Start Day ── */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <CalendarDays size={16} style={{ color: 'var(--color-brand)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            วันเริ่มรอบบัญชี
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {CYCLE_DAY_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setCycleStartDay(d)}
              className="aspect-square rounded-xl text-sm font-semibold transition-all active:scale-90"
              style={
                cycleStartDay === d
                  ? { background: 'var(--color-brand)', color: 'white' }
                  : { background: 'rgba(255,255,255,0.07)', color: 'var(--color-text-muted)' }
              }
            >
              {d}
            </button>
          ))}
        </div>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          รอบบัญชีจะเริ่มนับใหม่ทุกวันที่ {cycleStartDay} ของเดือน
        </p>
      </div>

      {/* ── Save Button ── */}
      <button
        onClick={handleSave}
        disabled={isSavingSettings}
        className="w-full btn-brand flex items-center justify-center gap-2 py-3"
      >
        {isSavingSettings ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            กำลังบันทึก...
          </>
        ) : saved ? (
          <>
            <CheckCircle size={18} />
            บันทึกแล้ว!
          </>
        ) : (
          <>
            <Save size={18} />
            บันทึกการตั้งค่า
          </>
        )}
      </button>

      {/* ── Training Cases Section ── */}
      <div className="glass-card p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-2">
          <Zap size={18} style={{ color: 'var(--color-brand)' }} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              เทรน AI
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              คำไหนให้จัดหมวดอะไร ไม่ต้องเรียก Gemini ทุกครั้ง ประหยัด token
            </p>
          </div>
        </div>

        {/* Add form */}
        <div className="space-y-3">
          <input
            type="text"
            value={tcKeyword}
            onChange={(e) => setTcKeyword(e.target.value)}
            placeholder="คีย์เวิร์ด เช่น ชานม, MRT, Netflix"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--color-text)',
            }}
          />

          <div className="flex gap-2">
            {/* Category select */}
            <select
              value={tcCategory}
              onChange={(e) => setTcCategory(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
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

            {/* Type toggle */}
            <div
              className="flex rounded-xl overflow-hidden flex-shrink-0"
              style={{ border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <button
                onClick={() => setTcType('EXPENSE')}
                className="px-3 py-2 text-xs font-semibold transition-all"
                style={{
                  background: tcType === 'EXPENSE' ? 'rgba(248,113,113,0.25)' : 'rgba(255,255,255,0.05)',
                  color: tcType === 'EXPENSE' ? 'var(--color-expense)' : 'var(--color-text-muted)',
                }}
              >
                รายจ่าย
              </button>
              <button
                onClick={() => setTcType('INCOME')}
                className="px-3 py-2 text-xs font-semibold transition-all"
                style={{
                  background: tcType === 'INCOME' ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.05)',
                  color: tcType === 'INCOME' ? 'var(--color-income)' : 'var(--color-text-muted)',
                }}
              >
                รายรับ
              </button>
            </div>
          </div>

          <button
            onClick={handleSaveTrainingCase}
            disabled={isSavingTc || !tcKeyword.trim()}
            className="w-full btn-brand flex items-center justify-center gap-2 py-2.5 text-sm disabled:opacity-50"
          >
            {isSavingTc ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Zap size={15} />
                เพิ่ม Training Case
              </>
            )}
          </button>
        </div>

        {/* List */}
        {isLoadingTrainingCases ? (
          <div className="flex justify-center py-4">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--color-brand)' }} />
          </div>
        ) : trainingCases.length === 0 ? (
          <p className="text-xs text-center py-2" style={{ color: 'var(--color-text-muted)' }}>
            ยังไม่มี training cases
          </p>
        ) : (
          <div className="space-y-2">
            {trainingCases.map((tc) => (
              <div
                key={tc.id}
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                {/* Keyword badge */}
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-lg flex-shrink-0"
                  style={{ background: 'var(--color-brand-dim)', color: 'var(--color-brand)' }}
                >
                  {tc.keyword}
                </span>

                {/* Category */}
                <span className="text-xs flex-1 truncate" style={{ color: 'var(--color-text-muted)' }}>
                  {CATEGORY_EMOJI[tc.category] ?? '📦'} {tc.category}
                </span>

                {/* Type badge */}
                <span
                  className="text-xs px-2 py-0.5 rounded-lg flex-shrink-0"
                  style={{
                    background: tc.type === 'INCOME' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                    color: tc.type === 'INCOME' ? 'var(--color-income)' : 'var(--color-expense)',
                  }}
                >
                  {tc.type === 'INCOME' ? 'รายรับ' : 'รายจ่าย'}
                </span>

                {/* Delete */}
                <button
                  onClick={() => handleDeleteTrainingCase(tc.id)}
                  disabled={deletingTcId === tc.id}
                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
                  style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}
                  aria-label="ลบ"
                >
                  {deletingTcId === tc.id ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Trash2 size={11} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Logout Button ── */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
        style={{
          background: 'rgba(248,113,113,0.12)',
          border: '1px solid rgba(248,113,113,0.2)',
          color: '#f87171',
        }}
      >
        <LogOut size={16} />
        ออกจากระบบ
      </button>
    </div>
  );
}
