import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, Loader2, ChevronLeft } from 'lucide-react';
import { authLogin } from '../services/api';
import NongJodHai from '../components/Mascot/NongJodHai';

const PAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

interface Props {
  onSuccess: (lineUserId: string, displayName: string) => void;
}

export default function Login({ onSuccess }: Props) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'name' | 'pin'>('name');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNameNext = () => {
    if (!name.trim()) return;
    setPin(''); setError(''); setStep('pin');
  };

  const pressDigit = (d: string) => {
    if (d === '⌫') { setPin((p) => p.slice(0, -1)); return; }
    if (d === '' || pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) setTimeout(() => submit(next), 140);
  };

  const submit = async (finalPin: string) => {
    setLoading(true); setError('');
    try {
      const r = await authLogin(name.trim(), finalPin);
      setTimeout(() => onSuccess(r.lineUserId, r.displayName), 300);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'เกิดข้อผิดพลาดค่า ลองใหม่นะ');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6 py-8"
      style={{ background: 'var(--bg)' }}
    >
      {/* Brand / Mascot */}
      <motion.div
        initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="text-center mb-8"
      >
        <div className="flex justify-center mb-3">
          <NongJodHai state="idle" size={96} />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text-1)' }}>จดให้</h1>
        <p className="text-sm mt-1 font-medium" style={{ color: 'var(--text-3)' }}>
          ผู้ช่วยบันทึกเงินส่วนตัวของเธอ
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 'name' ? (

          /* ── Step 1: Name ── */
          <motion.div key="name"
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            className="w-full max-w-xs space-y-4"
          >
            <div className="card p-5 space-y-4">
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>สวัสดีจ้า เธอชื่ออะไรคะ?</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>ชื่อใหม่ = สมัครสมาชิก · มีชื่ออยู่แล้ว = เข้าสู่ระบบ</p>
              </div>

              <div className="space-y-1">
                <label htmlFor="login-name" className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>
                  ชื่อเล่น
                </label>
                <input
                  id="login-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameNext()}
                  placeholder="เช่น นน, แพรว, อาร์ม..."
                  autoFocus
                  autoComplete="off"
                  className="input-field text-center font-bold text-base"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleNameNext}
                disabled={!name.trim()}
                className="btn-brand w-full text-base font-bold"
              >
                ถัดไป
              </motion.button>
            </div>
          </motion.div>

        ) : (

          /* ── Step 2: PIN ── */
          <motion.div key="pin"
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            className="w-full max-w-xs space-y-4"
          >
            <div className="card p-5">
              <div className="text-center mb-5">
                <p className="text-sm font-semibold" style={{ color: 'var(--text-2)' }}>
                  สวัสดี <span className="font-extrabold" style={{ color: 'var(--text-1)' }}>{name}</span>
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>ใส่ PIN 4 หลักค่า</p>
              </div>

              {/* PIN dots */}
              <div className="flex justify-center gap-4 mb-5" role="status" aria-label={`ใส่แล้ว ${pin.length} จาก 4 หลัก`}>
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: i < pin.length ? 1.2 : 1,
                      background: i < pin.length ? 'var(--brand-btn)' : 'var(--surface-2)',
                    }}
                    transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ border: `2px solid ${i < pin.length ? 'var(--brand-btn)' : 'var(--border-2)'}` }}
                  />
                ))}
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg mb-4"
                    style={{ background: 'var(--expense-bg)' }}
                    role="alert"
                  >
                    <p className="text-xs font-semibold text-center w-full" style={{ color: 'var(--expense)' }}>{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Numpad */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={28} className="animate-spin" style={{ color: 'var(--brand)' }} />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {PAD.map((d, i) => (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.88 }}
                      onClick={() => pressDigit(d)}
                      disabled={d === ''}
                      aria-label={d === '⌫' ? 'ลบตัวเลข' : d || undefined}
                      className="aspect-square rounded-xl flex items-center justify-center text-xl font-bold transition-colors disabled:invisible focus-visible:outline-none"
                      style={{
                        background: d === '⌫' ? 'var(--expense-bg)' : 'var(--surface-2)',
                        color: d === '⌫' ? 'var(--expense)' : 'var(--text-1)',
                        border: '1.5px solid var(--border)',
                        minHeight: '52px',
                      }}
                      onFocus={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--focus-ring)'; }}
                      onBlur={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
                    >
                      {d === '⌫' ? <Delete size={18} /> : d}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => { setStep('name'); setPin(''); setError(''); }}
              className="btn-ghost w-full gap-1.5"
            >
              <ChevronLeft size={15} />
              เปลี่ยนชื่อ
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
