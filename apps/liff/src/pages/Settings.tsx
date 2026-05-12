import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
        ตั้งค่า
      </h1>
      <div className="glass-card p-8 flex flex-col items-center gap-3 text-center">
        <SettingsIcon size={40} style={{ color: 'var(--color-brand)' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          กำลังพัฒนา — ตั้งค่างบประมาณและรอบบัญชีที่นี่
        </p>
      </div>
    </div>
  );
}
