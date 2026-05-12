import { Clock, ListOrdered } from 'lucide-react';

export default function History() {
  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
        ประวัติรายการ
      </h1>
      <div className="glass-card p-8 flex flex-col items-center gap-3 text-center">
        <ListOrdered size={40} style={{ color: 'var(--color-brand)' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          หน้านี้กำลังอยู่ในระหว่างพัฒนา
        </p>
        <p className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
          <Clock size={12} /> Coming soon
        </p>
      </div>
    </div>
  );
}
