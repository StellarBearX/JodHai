import { useEffect, useState } from 'react';
import { Save, Loader2, Wallet, CalendarDays, User, CheckCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const CYCLE_DAY_OPTIONS = [1, 5, 10, 15, 20, 25, 28];

export default function Settings() {
  const { user, userProfile, loadUserProfile, saveUserSettings, isSavingSettings } = useAppStore();

  const [budget, setBudget] = useState('');
  const [cycleStartDay, setCycleStartDay] = useState(1);
  const [saved, setSaved] = useState(false);

  // Load profile on mount
  useEffect(() => {
    if (user) loadUserProfile();
  }, [user, loadUserProfile]);

  // Populate form when profile loads
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
    </div>
  );
}
