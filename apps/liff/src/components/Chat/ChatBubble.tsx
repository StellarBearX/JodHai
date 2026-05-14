import { motion } from 'framer-motion';
import { Bot, User as UserIcon } from 'lucide-react';

const bubbleIn = {
  initial: { opacity: 0, y: 8, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { type: 'spring' as const, damping: 22, stiffness: 300 },
};

export function BotBubble({ text }: { text: string }) {
  return (
    <motion.div {...bubbleIn} className="flex gap-2 items-end">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
        style={{ background: 'var(--brand-dim)' }}
        aria-hidden="true"
      >
        <Bot size={13} style={{ color: 'var(--brand-dark)' }} />
      </div>
      <div
        className="max-w-[75%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line"
        style={{
          background: 'var(--surface)',
          border: '1.5px solid var(--border)',
          color: 'var(--text-1)',
          borderRadius: '18px 18px 18px 4px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {text}
      </div>
    </motion.div>
  );
}

export function UserBubble({ text }: { text: string }) {
  return (
    <motion.div {...bubbleIn} className="flex gap-2 items-end flex-row-reverse">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
        style={{ background: 'var(--surface-2)' }}
        aria-hidden="true"
      >
        <UserIcon size={13} style={{ color: 'var(--text-3)' }} />
      </div>
      <div
        className="max-w-[75%] px-3.5 py-2.5 text-sm leading-relaxed"
        style={{
          background: 'linear-gradient(135deg, var(--brand-btn) 0%, var(--brand-dark) 100%)',
          color: '#FFFFFF',
          borderRadius: '18px 18px 4px 18px',
          boxShadow: '0 2px 12px rgba(163,78,48,0.28)',
        }}
      >
        {text}
      </div>
    </motion.div>
  );
}

export function TypingBubble() {
  return (
    <motion.div {...bubbleIn} className="flex gap-2 items-end">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
        style={{ background: 'var(--brand-dim)' }}
        aria-hidden="true"
      >
        <Bot size={13} style={{ color: 'var(--brand-dark)' }} />
      </div>
      <div
        className="px-4 py-3 flex gap-1.5 items-center"
        style={{
          background: 'var(--surface)',
          border: '1.5px solid var(--border)',
          borderRadius: '18px 18px 18px 4px',
        }}
        aria-label="กำลังพิมพ์..."
        role="status"
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full block"
            style={{ background: 'var(--brand)' }}
            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, delay: i * 0.16, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  );
}
