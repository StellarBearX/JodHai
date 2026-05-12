import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Bot, User as UserIcon, Lightbulb } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { sendChatMessage } from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  'กาแฟ 65',
  'ข้าวกลางวัน 120',
  'รับเงินเดือน 25000',
  'ค่าน้ำมัน 500',
  'Netflix 299',
  'Grab ไปทำงาน 180',
];

const WELCOME: Message = {
  id: 'welcome',
  role: 'bot',
  text: 'สวัสดีครับ! 👋 ผมช่วยบันทึกรายรับ-รายจ่ายให้คุณได้เลย\nพิมพ์เช่น "กาแฟ 65" หรือ "รับเงินเดือน 25000" ได้เลย',
  timestamp: new Date(),
};

export default function Chat() {
  const { user, loadDashboard, loadTransactions } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: crypto.randomUUID(), timestamp: new Date() },
    ]);
  }, []);

  const handleSend = async (text: string = input.trim()) => {
    if (!text || sending || !user) return;
    setInput('');
    setSending(true);

    addMessage({ role: 'user', text });

    try {
      const reply = await sendChatMessage(user.lineUserId, user.displayName, text);
      addMessage({ role: 'bot', text: reply });
      // Refresh dashboard and transaction list in background
      loadDashboard();
      loadTransactions();
    } catch {
      addMessage({
        role: 'bot',
        text: '⚠️ เกิดข้อผิดพลาด กรุณาตรวจสอบว่า API server กำลังรันอยู่ (npm run dev:api)',
      });
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ paddingBottom: 0 }}>
      {/* ── Header ── */}
      <div
        className="px-4 pt-6 pb-4 flex items-center gap-3 border-b border-white/10"
        style={{ background: 'rgba(15,23,42,0.95)' }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--color-brand-dim)' }}
        >
          <Bot size={22} style={{ color: 'var(--color-brand)' }} />
        </div>
        <div>
          <h1 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            จดให้ Bot
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-brand)' }}>
            ● ออนไลน์
          </p>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        {sending && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ── Suggestions ── */}
      <div className="px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-1 snap-x">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              disabled={sending}
              className="flex-shrink-0 snap-start text-xs px-3 py-1.5 rounded-full border border-white/15 transition-all active:scale-95 disabled:opacity-50"
              style={{ color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.05)' }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Input Bar ── */}
      <div
        className="px-4 py-3 flex items-center gap-2 border-t border-white/10"
        style={{ background: 'rgba(15,23,42,0.95)' }}
      >
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="พิมพ์รายการ เช่น ข้าว 60..."
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'var(--color-text)',
            }}
            disabled={sending}
          />
        </div>
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 disabled:opacity-40"
          style={{ background: 'var(--color-brand)' }}
          aria-label="ส่ง"
        >
          {sending ? (
            <Loader2 size={18} className="animate-spin text-white" />
          ) : (
            <Send size={18} className="text-white" />
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isBot = msg.role === 'bot';
  return (
    <div className={`flex gap-2 items-end ${isBot ? '' : 'flex-row-reverse'}`}>
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
        style={{ background: isBot ? 'var(--color-brand-dim)' : 'rgba(148,163,184,0.15)' }}
      >
        {isBot ? (
          <Bot size={14} style={{ color: 'var(--color-brand)' }} />
        ) : (
          <UserIcon size={14} style={{ color: 'var(--color-text-muted)' }} />
        )}
      </div>

      {/* Bubble */}
      <div
        className="max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line"
        style={
          isBot
            ? {
                background: 'rgba(30,41,59,0.9)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--color-text)',
                borderBottomLeftRadius: 4,
              }
            : {
                background: 'var(--color-brand)',
                color: 'white',
                borderBottomRightRadius: 4,
              }
        }
      >
        {msg.text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 items-end">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: 'var(--color-brand-dim)' }}
      >
        <Bot size={14} style={{ color: 'var(--color-brand)' }} />
      </div>
      <div
        className="px-4 py-3 rounded-2xl flex gap-1.5 items-center"
        style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: 'var(--color-text-muted)',
              animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
