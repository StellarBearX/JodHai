import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Bot, User as UserIcon, ImagePlus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { sendChatMessage, sendChatImage, isChatQuestion, fetchChatHistory } from '../services/api';
import type { Transaction, ChatLogEntry } from '@jod-hai/shared';

const CATEGORY_EMOJI: Record<string, string> = {
  Food: '🍜', Transport: '🚗', Shopping: '🛍️', Health: '💊',
  Entertainment: '🎬', Bills: '📄', Salary: '💰', Other: '📦',
};

const SUGGESTIONS = ['กาแฟ 65', 'ข้าวกลางวัน 120', 'รับเงินเดือน 25000', 'ค่าน้ำมัน 500', 'Netflix 299'];

interface TextMessage  { id: string; kind: 'text';  role: 'user' | 'bot'; text: string; timestamp: Date; }
interface ImageMessage { id: string; kind: 'image'; role: 'user'; preview: string; timestamp: Date; }
interface TxMessage    { id: string; kind: 'tx';   role: 'bot'; transaction: Transaction; usedTraining: boolean; autoLearned: boolean; timestamp: Date; }
type ChatMessage = TextMessage | ImageMessage | TxMessage;

const mk = <T extends object>(base: T): T & { id: string; timestamp: Date } => ({
  ...base, id: crypto.randomUUID(), timestamp: new Date(),
});

function logToMessage(log: ChatLogEntry): ChatMessage | null {
  if (log.kind === 'text') {
    return { id: log.id, kind: 'text', role: log.role, text: log.content.text ?? '', timestamp: new Date(log.createdAt) };
  }
  if (log.kind === 'image') {
    return { id: log.id, kind: 'image', role: 'user', preview: '', timestamp: new Date(log.createdAt) };
  }
  if (log.kind === 'tx' && log.content.transaction) {
    return { id: log.id, kind: 'tx', role: 'bot', transaction: { ...log.content.transaction, createdAt: new Date(log.content.transaction.createdAt) }, usedTraining: false, autoLearned: log.content.autoLearned ?? false, timestamp: new Date(log.createdAt) };
  }
  return null;
}

export default function Chat() {
  const { user, loadDashboard, loadTransactions } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [imagePreview, setImagePreview] = useState<{ base64: string; mime: string; preview: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load chat history from DB on mount
  useEffect(() => {
    if (!user || historyLoaded) return;
    fetchChatHistory(user.lineUserId).then((logs) => {
      const msgs = logs.map(logToMessage).filter(Boolean) as ChatMessage[];
      if (msgs.length === 0) {
        setMessages([mk({ kind: 'text' as const, role: 'bot' as const, text: 'สวัสดีค่ะ! 👋 พิมพ์รายการ หรือส่งรูปสลิป/ใบเสร็จได้เลยนะคะ' })]);
      } else {
        setMessages(msgs);
      }
      setHistoryLoaded(true);
    }).catch(() => {
      setMessages([mk({ kind: 'text' as const, role: 'bot' as const, text: 'สวัสดีค่ะ! 👋 พิมพ์รายการ หรือส่งรูปสลิป/ใบเสร็จได้เลยนะคะ' })]);
      setHistoryLoaded(true);
    });
  }, [user, historyLoaded]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const push = useCallback((msg: ChatMessage) => setMessages((p) => [...p, msg]), []);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [header, base64] = dataUrl.split(',');
      const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
      setImagePreview({ base64, mime, preview: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = async (text: string = input.trim()) => {
    if ((!text && !imagePreview) || sending || !user) return;
    setInput('');
    setSending(true);

    try {
      if (imagePreview) {
        push(mk({ kind: 'image', role: 'user', preview: imagePreview.preview }));
        const img = imagePreview;
        setImagePreview(null);
        const res = await sendChatImage(user.lineUserId, user.displayName, img.base64, img.mime);
        if (isChatQuestion(res)) {
          push(mk({ kind: 'text', role: 'bot', text: res.question }));
        } else {
          push(mk({ kind: 'tx', role: 'bot', transaction: { ...res.transaction, createdAt: new Date(res.transaction.createdAt) }, usedTraining: res.usedTraining, autoLearned: res.autoLearned }));
          loadDashboard(); loadTransactions();
        }
      } else {
        push(mk({ kind: 'text', role: 'user', text }));
        const res = await sendChatMessage(user.lineUserId, user.displayName, text);
        if (isChatQuestion(res)) {
          push(mk({ kind: 'text', role: 'bot', text: res.question }));
        } else {
          push(mk({ kind: 'tx', role: 'bot', transaction: { ...res.transaction, createdAt: new Date(res.transaction.createdAt) }, usedTraining: res.usedTraining, autoLearned: res.autoLearned }));
          loadDashboard(); loadTransactions();
        }
      }
    } catch {
      push(mk({ kind: 'text', role: 'bot', text: '⚠️ เกิดข้อผิดพลาด กรุณาลองใหม่ค่ะ' }));
    }

    setSending(false);
    inputRef.current?.focus();
  };

  if (!historyLoaded) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3">
        <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-brand)' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>กำลังโหลดประวัติการสนทนา...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 flex items-center gap-3 border-b border-white/10" style={{ background: 'rgba(15,23,42,0.95)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-brand-dim)' }}>
          <Bot size={22} style={{ color: 'var(--color-brand)' }} />
        </div>
        <div className="flex-1">
          <h1 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>จดให้ AI</h1>
          <p className="text-xs" style={{ color: 'var(--color-brand)' }}>● ออนไลน์ · Gemini Flash</p>
        </div>
        {user && <p className="text-xs px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.07)', color: 'var(--color-text-muted)' }}>{user.displayName}</p>}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} onNavigate={() => navigate('/history')} />)}
        {sending && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="px-4 pb-2 flex items-center gap-2">
          <div className="relative">
            <img src={imagePreview.preview} alt="preview" className="w-16 h-16 object-cover rounded-xl border border-white/20" />
            <button onClick={() => setImagePreview(null)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#f87171' }}>
              <X size={10} className="text-white" />
            </button>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>กด ส่ง เพื่อให้ AI อ่านสลิป</p>
        </div>
      )}

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => handleSend(s)} disabled={sending}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-white/15 transition-all active:scale-95 disabled:opacity-50"
                style={{ color: 'var(--color-text-muted)', background: 'rgba(255,255,255,0.05)' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 py-3 flex items-center gap-2 border-t border-white/10" style={{ background: 'rgba(15,23,42,0.95)' }}>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
        <button onClick={() => fileRef.current?.click()} disabled={sending}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 disabled:opacity-40"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <ImagePlus size={18} style={{ color: 'var(--color-text-muted)' }} />
        </button>
        <input ref={inputRef} type="text" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="พิมพ์รายการ หรืออัพโหลดรูปสลิป..."
          className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'var(--color-text)' }}
          disabled={sending} />
        <button onClick={() => handleSend()} disabled={(!input.trim() && !imagePreview) || sending}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 disabled:opacity-40"
          style={{ background: 'var(--color-brand)' }}>
          {sending ? <Loader2 size={18} className="animate-spin text-white" /> : <Send size={18} className="text-white" />}
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ msg, onNavigate }: { msg: ChatMessage; onNavigate: () => void }) {
  if (msg.kind === 'image') {
    return (
      <div className="flex gap-2 items-end flex-row-reverse">
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'rgba(148,163,184,0.15)' }}>
          <UserIcon size={14} style={{ color: 'var(--color-text-muted)' }} />
        </div>
        <div className="px-3.5 py-2.5 rounded-2xl text-sm italic" style={{ background: 'var(--color-brand)', color: 'white', borderBottomRightRadius: 4, opacity: 0.8 }}>
          📸 ส่งรูปใบเสร็จ
        </div>
      </div>
    );
  }

  if (msg.kind === 'tx') {
    return <TxCard tx={msg.transaction} usedTraining={msg.usedTraining} autoLearned={msg.autoLearned} onNavigate={onNavigate} />;
  }

  const isBot = msg.role === 'bot';
  return (
    <div className={`flex gap-2 items-end ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
        style={{ background: isBot ? 'var(--color-brand-dim)' : 'rgba(148,163,184,0.15)' }}>
        {isBot
          ? <Bot size={14} style={{ color: 'var(--color-brand)' }} />
          : <UserIcon size={14} style={{ color: 'var(--color-text-muted)' }} />}
      </div>
      <div className="max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line"
        style={isBot
          ? { background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--color-text)', borderBottomLeftRadius: 4 }
          : { background: 'var(--color-brand)', color: 'white', borderBottomRightRadius: 4 }}>
        {msg.text}
      </div>
    </div>
  );
}

function TxCard({ tx, usedTraining, autoLearned, onNavigate }: { tx: Transaction; usedTraining: boolean; autoLearned: boolean; onNavigate: () => void }) {
  const isExpense = tx.type === 'EXPENSE';
  const typeColor = isExpense ? '#E91E8C' : '#10b981';
  const typeBg = isExpense ? 'rgba(233,30,140,0.12)' : 'rgba(16,185,129,0.12)';
  const emoji = CATEGORY_EMOJI[tx.category] ?? '📦';

  return (
    <div className="flex gap-2 items-end">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5" style={{ background: 'var(--color-brand-dim)' }}>
        <Bot size={14} style={{ color: 'var(--color-brand)' }} />
      </div>
      <div className="max-w-[85%] rounded-2xl overflow-hidden text-sm" style={{ borderBottomLeftRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }}>
        {/* Header */}
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <span className="text-base">✅</span>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>จดสำเร็จแล้วค่ะ</p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>ตรวจสอบก่อนนะคะ</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-3 space-y-2.5" style={{ background: 'rgba(15,23,42,0.95)' }}>
          {/* Amount + type */}
          <div className="flex items-center justify-between">
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold" style={{ background: typeBg, color: typeColor }}>
              {isExpense ? 'รายจ่าย' : 'รายรับ'}
            </span>
            <span className="text-xl font-black" style={{ color: typeColor }}>
              {isExpense ? '-' : '+'}฿{tx.amount.toLocaleString('th-TH')}
            </span>
          </div>

          {/* Note + category */}
          <div className="flex items-center gap-2">
            <span className="text-lg">{emoji}</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{tx.note ?? tx.category}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{tx.category} · {new Date(tx.createdAt).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          {/* Badges */}
          {(usedTraining || autoLearned) && (
            <div className="flex gap-2 flex-wrap pt-0.5">
              {usedTraining && <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>⚡ training cache</span>}
              {autoLearned && <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>🧠 เรียนรู้แล้ว</span>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 flex justify-end" style={{ background: 'rgba(15,23,42,0.7)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={onNavigate} className="text-xs font-semibold" style={{ color: 'var(--color-brand)' }}>
            แก้ไขใน ประวัติรายการ →
          </button>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 items-end">
      <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--color-brand-dim)' }}>
        <Bot size={14} style={{ color: 'var(--color-brand)' }} />
      </div>
      <div className="px-4 py-3 rounded-2xl flex gap-1.5 items-center" style={{ background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderBottomLeftRadius: 4 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--color-text-muted)', animation: `bounce 1s ease-in-out ${i * 0.15}s infinite` }} />
        ))}
      </div>
    </div>
  );
}
