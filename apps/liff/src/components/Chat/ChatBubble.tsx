import { motion } from 'framer-motion';
import { Bot, User as UserIcon } from 'lucide-react';

interface BotBubbleProps {
  text: string;
}
interface UserBubbleProps {
  text: string;
}

const bubbleIn = {
  initial: { opacity: 0, y: 10, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { type: 'spring' as const, damping: 20, stiffness: 300 },
};

export function BotBubble({ text }: BotBubbleProps) {
  return (
    <motion.div {...bubbleIn} className="flex gap-2 items-end">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
        style={{ background: 'var(--color-brand-dim)' }}
      >
        <Bot size={14} style={{ color: 'var(--color-brand-dark)' }} />
      </div>
      <div
        className="max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line"
        style={{
          background: 'white',
          border: '1.5px solid var(--color-border)',
          color: 'var(--color-text)',
          borderBottomLeftRadius: 6,
          boxShadow: '0 2px 12px var(--color-shadow)',
        }}
      >
        {text}
      </div>
    </motion.div>
  );
}

export function UserBubble({ text }: UserBubbleProps) {
  return (
    <motion.div {...bubbleIn} className="flex gap-2 items-end flex-row-reverse">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
        style={{ background: 'var(--color-bg-2)' }}
      >
        <UserIcon size={14} style={{ color: 'var(--color-text-muted)' }} />
      </div>
      <div
        className="max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
        style={{
          background: 'linear-gradient(135deg, #3ECFBF, #28A99A)',
          color: 'white',
          borderBottomRightRadius: 6,
          boxShadow: '0 2px 12px rgba(62, 207, 191, 0.3)',
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
        style={{ background: 'var(--color-brand-dim)' }}
      >
        <Bot size={14} style={{ color: 'var(--color-brand-dark)' }} />
      </div>
      <div
        className="px-4 py-3 rounded-2xl flex gap-1.5 items-center"
        style={{ background: 'white', border: '1.5px solid var(--color-border)', borderBottomLeftRadius: 6 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--color-brand)' }}
            animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.8, delay: i * 0.18, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </motion.div>
  );
}
