import { useEffect, useState } from 'react';
import { Save, Loader2, Wallet, CalendarDays, User, CheckCircle, Zap, Trash2, LogOut, Plus } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const CYCLE_DAY_OPTIONS = [1, 5, 10, 15, 20, 25, 28];
const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Bills', 'Salary', 'Other'];
const CATEGORY_EMOJI: Record<string, string> = {
  Food: '🍜', Transport: '🚗', Shopping: '🛍️', Health: '💊',
  Entertainment: '🎬', Bills: '📄', Salary: '💰', Other: '📦',
};

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="icon-wrap-sm" style={{ background: 'var(--brand-dim)', color: 'var(--brand-dark)' }}>
          {icon}
        </div>
        <h2 className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export default function Settings() {
  const {
    user, userProfile, loadUserProfile, saveUserSettings, isSavingSettings,
    trainingCases, isLoadingTrainingCases, loadTrainingCases, saveTrainingCase, removeTrainingCase,
  } = useAppStore();

  const [budget, setBudget] = useState('');
  const [cycleStartDay, setCycleStartDay] = useState(1);
  const [saved, setSaved] = useState(false);

  const [tcKeyword, setTcKeyword] = useState('');
  const [tcCategory, setTcCategory] = useState('Food');
  const [tcType, setTcType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [isSavingTc, setIsSavingTc] = useState(false);
  const [deletingTcId, setDeletingTcId] = useState<string | null>(null);

  useEffect(() => {
    if (user) { loadUserProfile(); loadTrainingCases(); }
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
    try { await saveTrainingCase({ keyword: tcKeyword.trim(), category: tcCategory, type: tcType }); setTcKeyword(''); }
    finally { setIsSavingTc(false); }
  };

  const handleDeleteTrainingCase = async (id: string) => {
    if (deletingTcId) return;
    setDeletingTcId(id);
    try { await removeTrainingCase(id); }
    finally { setDeletingTcId(null); }
  };

  const handleLogout = () => {
    localStorage.removeItem('jodhai_user');
    window.location.reload();
  };

  return (
    <div className="px-4 pt-5 pb-8 max-w-lg mx-auto space-y-4" style={{ background: 'var(--bg)', minHeight: '100%' }}>

      {/* ── Header ── */}
      <h1 className="text-lg font-extrabold" style={{ color: 'var(--text-1)' }}>ตั้งค่า</h1>

      {/* ── Profile Card ── */}
      <div className="card p-4 flex items-center gap-3">
        <div className="icon-wrap" style={{ background: 'var(--brand-dim)', color: 'var(--brand-dark)', borderRadius: '14px' }}>
          <User size={20} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold truncate" style={{ color: 'var(--text-1)' }}>
            {userProfile?.displayName ?? user?.displayName ?? '—'}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>
            {userProfile?.lineUserId ?? user?.lineUserId ?? '—'}
          </p>
        </div>
      </div>

      {/* ── Budget ── */}
      <SectionCard icon={<Wallet size={14} />} title="งบประมาณต่อเดือน">
        <div className="space-y-2">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: 'var(--text-3)' }}>฿</span>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="20,000"
              min={0}
              className="input-field pl-8"
              aria-label="งบประมาณต่อเดือน (บาท)"
            />
          </div>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            ใช้สำหรับคำนวณ % การใช้งบในหน้าหลัก
          </p>
        </div>
      </SectionCard>

      {/* ── Cycle Start Day ── */}
      <SectionCard icon={<CalendarDays size={14} />} title="วันเริ่มรอบบัญชี">
        <div className="space-y-3">
          <div
            className="grid grid-cols-7 gap-1.5"
            role="group"
            aria-label="เลือกวันเริ่มรอบบัญชี"
          >
            {CYCLE_DAY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setCycleStartDay(d)}
                aria-pressed={cycleStartDay === d}
                className="aspect-square rounded-lg text-sm font-bold transition-all active:scale-90 focus-visible:outline-none"
                style={
                  cycleStartDay === d
                    ? { background: 'var(--brand-btn)', color: 'white', boxShadow: '0 2px 8px rgba(163,78,48,0.28)' }
                    : { background: 'var(--surface-2)', color: 'var(--text-2)', border: '1.5px solid var(--border)' }
                }
              >
                {d}
              </button>
            ))}
          </div>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            รอบบัญชีจะเริ่มนับใหม่ทุกวันที่ <strong style={{ color: 'var(--text-2)' }}>{cycleStartDay}</strong> ของเดือน
          </p>
        </div>
      </SectionCard>

      {/* ── Save ── */}
      <button
        onClick={handleSave}
        disabled={isSavingSettings}
        className="btn-brand w-full"
      >
        {isSavingSettings ? (
          <><Loader2 size={16} className="animate-spin" />กำลังบันทึก...</>
        ) : saved ? (
          <><CheckCircle size={16} />บันทึกแล้ว</>
        ) : (
          <><Save size={16} />บันทึกการตั้งค่า</>
        )}
      </button>

      {/* ── Training Cases ── */}
      <SectionCard icon={<Zap size={14} />} title="เทรน AI">
        <div className="space-y-4">
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            กำหนดว่าคำไหนควรจัดอยู่ในหมวดไหน ช่วยให้ AI จำแนกได้เร็วขึ้นโดยไม่ต้องเรียก Gemini ทุกครั้ง
          </p>

          {/* Add form */}
          <div className="space-y-3 p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1.5px solid var(--border)' }}>
            <div className="space-y-1">
              <label htmlFor="tc-keyword" className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>คีย์เวิร์ด</label>
              <input
                id="tc-keyword"
                type="text"
                value={tcKeyword}
                onChange={(e) => setTcKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTrainingCase()}
                placeholder="เช่น ชานม, MRT, Netflix"
                className="input-field"
                style={{ background: 'var(--surface)' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label htmlFor="tc-category" className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>หมวดหมู่</label>
                <select
                  id="tc-category"
                  value={tcCategory}
                  onChange={(e) => setTcCategory(e.target.value)}
                  className="select-field"
                  style={{ background: 'var(--surface)' }}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>ประเภท</p>
                <div
                  className="grid grid-cols-2 rounded-xl p-0.5 gap-0.5"
                  style={{ background: 'var(--surface-3)', border: '1.5px solid var(--border)' }}
                  role="group"
                >
                  <button
                    onClick={() => setTcType('EXPENSE')}
                    aria-pressed={tcType === 'EXPENSE'}
                    className="py-2 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none"
                    style={{
                      background: tcType === 'EXPENSE' ? 'var(--surface)' : 'transparent',
                      color: tcType === 'EXPENSE' ? 'var(--expense)' : 'var(--text-3)',
                    }}
                  >
                    จ่าย
                  </button>
                  <button
                    onClick={() => setTcType('INCOME')}
                    aria-pressed={tcType === 'INCOME'}
                    className="py-2 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none"
                    style={{
                      background: tcType === 'INCOME' ? 'var(--surface)' : 'transparent',
                      color: tcType === 'INCOME' ? 'var(--income)' : 'var(--text-3)',
                    }}
                  >
                    รับ
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveTrainingCase}
              disabled={isSavingTc || !tcKeyword.trim()}
              className="btn-brand w-full text-sm"
            >
              {isSavingTc
                ? <><Loader2 size={14} className="animate-spin" />กำลังบันทึก...</>
                : <><Plus size={14} />เพิ่ม Training Case</>
              }
            </button>
          </div>

          {/* List */}
          {isLoadingTrainingCases ? (
            <div className="flex justify-center py-4">
              <Loader2 size={18} className="animate-spin" style={{ color: 'var(--brand)' }} />
            </div>
          ) : trainingCases.length === 0 ? (
            <p className="text-xs text-center py-2" style={{ color: 'var(--text-4)' }}>ยังไม่มี training cases</p>
          ) : (
            <div className="space-y-2">
              {trainingCases.map((tc) => (
                <div
                  key={tc.id}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <span
                    className="text-xs font-mono font-bold px-2 py-0.5 rounded-md flex-shrink-0"
                    style={{ background: 'var(--brand-dim)', color: 'var(--brand-on-dim)' }}
                  >
                    {tc.keyword}
                  </span>
                  <span className="text-xs flex-1 truncate" style={{ color: 'var(--text-3)' }}>
                    {CATEGORY_EMOJI[tc.category] ?? '📦'} {tc.category}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-md font-semibold flex-shrink-0"
                    style={{
                      background: tc.type === 'INCOME' ? 'var(--income-bg)' : 'var(--expense-bg)',
                      color: tc.type === 'INCOME' ? 'var(--income)' : 'var(--expense)',
                    }}
                  >
                    {tc.type === 'INCOME' ? 'รายรับ' : 'รายจ่าย'}
                  </span>
                  <button
                    onClick={() => handleDeleteTrainingCase(tc.id)}
                    disabled={deletingTcId === tc.id}
                    className="icon-wrap-sm flex-shrink-0 transition-colors focus-visible:outline-none disabled:opacity-50"
                    style={{ background: 'var(--expense-bg)', color: 'var(--expense)' }}
                    aria-label={`ลบ ${tc.keyword}`}
                  >
                    {deletingTcId === tc.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Logout ── */}
      <button
        onClick={handleLogout}
        className="btn-ghost w-full gap-2"
        style={{ color: 'var(--expense)', borderColor: 'var(--expense-bg)', background: 'var(--expense-bg)' }}
      >
        <LogOut size={15} />
        ออกจากระบบ
      </button>
    </div>
  );
}
