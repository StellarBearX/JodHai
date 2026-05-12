import { useState } from 'react';
import { Loader2, Delete } from 'lucide-react';
import { authLogin } from '../services/api';

interface Props {
  onSuccess: (lineUserId: string, displayName: string) => void;
}

const PAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export default function Login({ onSuccess }: Props) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'name' | 'pin'>('name');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNameNext = () => {
    if (!name.trim()) return;
    setPin('');
    setError('');
    setStep('pin');
  };

  const pressDigit = (d: string) => {
    if (d === '⌫') { setPin((p) => p.slice(0, -1)); return; }
    if (d === '') return;
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) setTimeout(() => handlePinSubmit(next), 120);
  };

  const handlePinSubmit = async (finalPin: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await authLogin(name.trim(), finalPin);
      onSuccess(result.lineUserId, result.displayName);
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'เกิดข้อผิดพลาด';
      setError(msg);
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-6 select-none" style={{ background: 'var(--color-bg)' }}>
      {/* Logo */}
      <div className="mb-8 text-center">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 text-4xl"
          style={{ background: 'var(--color-brand-dim)', boxShadow: '0 0 40px rgba(236,72,153,0.25)' }}
        >
          📒
        </div>
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>จดให้</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>บันทึกรายรับ-รายจ่ายด้วย AI</p>
      </div>

      {step === 'name' ? (
        /* ── Name Step ── */
        <div className="w-full max-w-xs space-y-4">
          <p className="text-center text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            ใส่ชื่อของคุณ
          </p>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleNameNext()}
            placeholder="เช่น นน, แพรว, อาร์ม..."
            autoFocus
            className="w-full px-4 py-3.5 rounded-2xl text-base outline-none text-center font-semibold transition-all"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1.5px solid rgba(255,255,255,0.15)',
              color: 'var(--color-text)',
            }}
          />
          <button
            onClick={handleNameNext}
            disabled={!name.trim()}
            className="w-full btn-brand py-3.5 font-bold text-base rounded-2xl disabled:opacity-40 transition-all active:scale-95"
          >
            ถัดไป →
          </button>
        </div>
      ) : (
        /* ── PIN Step ── */
        <div className="w-full max-w-xs space-y-6">
          <div className="text-center">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              สวัสดี <span className="font-bold" style={{ color: 'var(--color-text)' }}>{name}</span> 👋
            </p>
            <p className="text-sm mt-0.5 font-medium" style={{ color: 'var(--color-text-muted)' }}>
              ใส่ PIN 4 หลัก
            </p>
          </div>

          {/* PIN dots */}
          <div className="flex justify-center gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-4 h-4 rounded-full transition-all duration-150"
                style={{
                  background: i < pin.length ? 'var(--color-brand)' : 'rgba(255,255,255,0.15)',
                  transform: i < pin.length ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: i < pin.length ? '0 0 12px rgba(236,72,153,0.5)' : 'none',
                }}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-center text-sm font-medium" style={{ color: '#f87171' }}>
              ⚠️ {error}
            </p>
          )}

          {/* Numpad */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-brand)' }} />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {PAD.map((d, i) => (
                <button
                  key={i}
                  onClick={() => pressDigit(d)}
                  disabled={d === ''}
                  className="aspect-square rounded-2xl flex items-center justify-center text-xl font-semibold transition-all active:scale-90 disabled:invisible"
                  style={{
                    background: d === '⌫' ? 'rgba(248,113,113,0.12)' : 'rgba(255,255,255,0.07)',
                    color: d === '⌫' ? '#f87171' : 'var(--color-text)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {d === '⌫' ? <Delete size={20} /> : d}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => { setStep('name'); setPin(''); setError(''); }}
            className="w-full text-sm py-2 transition-all"
            style={{ color: 'var(--color-text-muted)' }}
          >
            ← เปลี่ยนชื่อ
          </button>
        </div>
      )}
    </div>
  );
}
