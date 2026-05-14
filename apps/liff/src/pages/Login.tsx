import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete, Loader2 } from 'lucide-react';
import { authLogin } from '../services/api';
import NongJodHai from '../components/Mascot/NongJodHai';
import type { MascotState } from '../components/Mascot/NongJodHai';

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
  const [mascotState, setMascotState] = useState<MascotState>('idle');

  const handleNameNext = () => {
    if (!name.trim()) return;
    setPin(''); setError(''); setStep('pin');
    setMascotState('writing');
    setTimeout(() => setMascotState('idle'), 800);
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
    setMascotState('writing');
    try {
      const r = await authLogin(name.trim(), finalPin);
      setMascotState('success');
      setTimeout(() => onSuccess(r.lineUserId, r.displayName), 600);
    } catch (err: any) {
      setMascotState('warning');
      setTimeout(() => setMascotState('idle'), 1500);
      setError(err?.response?.data?.error ?? 'เกิดข้อผิดพลาดค่า ลองใหม่นะ');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center px-6 py-8"
      style={{ background: 'linear-gradient(160deg, #F0FFF8 0%, #E8FAF5 100%)' }}
    >
      {/* Logo + mascot */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center mb-8"
      >
        <div className="flex justify-center mb-2">
          <NongJodHai state={mascotState} size={110} />
        </div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>จดให้</h1>
        <p className="text-sm mt-1 font-medium" style={{ color: 'var(--color-text-muted)' }}>
          น้องจดให้ ผู้ช่วยบันทึกเงินส่วนตัว 💕
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 'name' ? (
          /* ── Step 1: Name ── */
          <motion.div key="name" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className="w-full max-w-xs space-y-4">
            <div className="card p-5 space-y-4">
              <p className="text-center text-sm font-semibold" style={{ color: 'var(--color-text-muted)' }}>
                สวัสดีจ้า! เธอชื่ออะไรคะ? 😊
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNameNext()}
                placeholder="เช่น นน, แพรว, อาร์ม..."
                autoFocus
                className="w-full px-4 py-3.5 rounded-2xl text-base text-center font-bold outline-none transition-all"
                style={{ background: 'var(--color-bg-2)', border: '2px solid transparent', color: 'var(--color-text)' }}
                onFocus={(e) => { e.target.style.borderColor = 'var(--color-brand)'; e.target.style.background = 'white'; }}
                onBlur={(e) => { e.target.style.borderColor = 'transparent'; e.target.style.background = 'var(--color-bg-2)'; }}
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleNameNext}
                disabled={!name.trim()}
                className="w-full btn-brand py-3.5 font-bold text-base rounded-2xl disabled:opacity-40"
              >
                ถัดไป →
              </motion.button>
            </div>
            <p className="text-center text-xs font-medium" style={{ color: 'var(--color-text-light)' }}>
              ครั้งแรก = สมัครสมาชิก · มีชื่ออยู่แล้ว = เข้าสู่ระบบ
            </p>
          </motion.div>

        ) : (
          /* ── Step 2: PIN ── */
          <motion.div key="pin" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className="w-full max-w-xs space-y-5">
            <div className="card p-5">
              <p className="text-center text-sm font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                สวัสดี <span className="font-black" style={{ color: 'var(--color-text)' }}>{name}</span> 🥰
              </p>
              <p className="text-center text-xs mb-5" style={{ color: 'var(--color-text-muted)' }}>ใส่ PIN 4 หลักค่า</p>

              {/* PIN dots */}
              <div className="flex justify-center gap-4 mb-5">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: i < pin.length ? 1.25 : 1, background: i < pin.length ? 'var(--color-brand)' : 'var(--color-bg-2)' }}
                    transition={{ type: 'spring', stiffness: 400 }}
                    className="w-4 h-4 rounded-full"
                    style={{ boxShadow: i < pin.length ? '0 0 14px rgba(62,207,191,0.5)' : 'none' }}
                  />
                ))}
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-center text-sm font-semibold mb-3" style={{ color: 'var(--color-expense)' }}>
                    ⚠️ {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Numpad */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-brand)' }} />
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2.5">
                  {PAD.map((d, i) => (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.88 }}
                      onClick={() => pressDigit(d)}
                      disabled={d === ''}
                      className="aspect-square rounded-2xl flex items-center justify-center text-xl font-bold transition-all disabled:invisible"
                      style={{
                        background: d === '⌫' ? 'rgba(255,107,157,0.1)' : 'var(--color-bg-2)',
                        color: d === '⌫' ? 'var(--color-expense)' : 'var(--color-text)',
                        border: '1.5px solid var(--color-border)',
                      }}
                    >
                      {d === '⌫' ? <Delete size={20} /> : d}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => { setStep('name'); setPin(''); setError(''); setMascotState('idle'); }}
              className="w-full text-sm py-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>
              ← เปลี่ยนชื่อ
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
