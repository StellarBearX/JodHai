import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, ImagePlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { sendChatMessage, sendChatImage, isChatQuestion, isChatAnswer, isChatEdited, isChatDeleted, fetchChatHistory } from '../services/api';
import type { Transaction, ChatLogEntry } from '@jod-hai/shared';
import { BotBubble, UserBubble, TypingBubble } from '../components/Chat/ChatBubble';
import NongJodHai from '../components/Mascot/NongJodHai';
import { useNongJodHaiEmotion } from '../hooks/useNongJodHaiEmotion';

const CATEGORY_EMOJI: Record<string, string> = {
  Food: '🍜', Transport: '🚗', Shopping: '🛍️', Health: '💊',
  Entertainment: '🎬', Bills: '📄', Salary: '💰', Other: '📦',
};
const SUGGESTIONS = ['กาแฟ 65', 'ข้าวกลางวัน 120', 'รับเงินเดือน 25000', 'เงินเหลือเท่าไหร่', 'ลบรายการล่าสุด', 'แก้รายการล่าสุด'];

interface TextMsg    { id: string; kind: 'text';    role: 'user' | 'bot'; text: string; ts: Date; }
interface ImageMsg   { id: string; kind: 'image';   role: 'user'; preview: string; ts: Date; }
interface TxMsg      { id: string; kind: 'tx';      role: 'bot'; tx: Transaction; usedTraining: boolean; autoLearned: boolean; message: string; emotion: string; ts: Date; }
interface AnswerMsg  { id: string; kind: 'answer';  role: 'bot'; answer: string; emotion: string; ts: Date; }
interface EditedMsg  { id: string; kind: 'edited';  role: 'bot'; tx: Transaction; message: string; emotion: string; ts: Date; }
interface DeletedMsg { id: string; kind: 'deleted'; role: 'bot'; message: string; emotion: string; ts: Date; }
type Msg = TextMsg | ImageMsg | TxMsg | AnswerMsg | EditedMsg | DeletedMsg;

const mk = <T extends object>(b: T): T & { id: string; ts: Date } => ({ ...b, id: crypto.randomUUID(), ts: new Date() });

function logToMsg(log: ChatLogEntry): Msg | null {
  if (log.kind === 'text') return { id: log.id, kind: 'text', role: log.role, text: log.content.text ?? '', ts: new Date(log.createdAt) };
  if (log.kind === 'image') return { id: log.id, kind: 'image', role: 'user', preview: '', ts: new Date(log.createdAt) };
  if (log.kind === 'tx' && log.content.transaction) {
    return { id: log.id, kind: 'tx', role: 'bot', tx: { ...log.content.transaction, createdAt: new Date(log.content.transaction.createdAt) }, usedTraining: false, autoLearned: log.content.autoLearned ?? false, message: (log.content as any).message ?? 'เรียบร้อยค่า! ✅', emotion: 'happy', ts: new Date(log.createdAt) };
  }
  return null;
}

export default function Chat() {
  const { user, loadDashboard, loadTransactions } = useAppStore();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [img, setImg] = useState<{ base64: string; mime: string; preview: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { state: mascotState, triggerWriting, stopWriting, triggerSuccess } = useNongJodHaiEmotion();

  // Load chat history
  useEffect(() => {
    if (!user || loaded) return;
    fetchChatHistory(user.lineUserId).then((logs) => {
      const parsed = logs.map(logToMsg).filter(Boolean) as Msg[];
      setMsgs(parsed.length ? parsed : [mk({ kind: 'text' as const, role: 'bot' as const, text: `สวัสดีค่า ${user.displayName}! 👋 น้องจดให้พร้อมช่วยบันทึกเงินเธอแล้วนะจ้า มีรายการอะไรบ้างคะ?` })]);
    }).catch(() => {
      setMsgs([mk({ kind: 'text' as const, role: 'bot' as const, text: `สวัสดีค่า! 👋 น้องจดให้พร้อมแล้ว พิมพ์รายการได้เลยนะคะ` })]);
    }).finally(() => setLoaded(true));
  }, [user, loaded]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, sending]);

  const push = useCallback((m: Msg) => setMsgs((p) => [...p, m]), []);

  const handleInput = (v: string) => {
    setInput(v);
    if (v.trim()) triggerWriting(); else stopWriting();
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [header, base64] = dataUrl.split(',');
      setImg({ base64, mime: header.match(/:(.*?);/)?.[1] ?? 'image/jpeg', preview: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = async (text: string = input.trim()) => {
    if ((!text && !img) || sending || !user) return;
    setInput('');
    stopWriting();
    setSending(true);

    try {
      if (img) {
        push(mk({ kind: 'image', role: 'user', preview: img.preview }));
        const saved = img;
        setImg(null);
        const res = await sendChatImage(user.lineUserId, user.displayName, saved.base64, saved.mime);
        if (isChatQuestion(res)) {
          push(mk({ kind: 'text', role: 'bot', text: res.question }));
        } else if (isChatAnswer(res)) {
          push(mk({ kind: 'answer', role: 'bot', answer: res.answer, emotion: res.emotion }));
        } else if (isChatEdited(res)) {
          push(mk({ kind: 'edited', role: 'bot', tx: { ...res.transaction, createdAt: new Date(res.transaction.createdAt) }, message: res.message, emotion: res.emotion }));
          triggerSuccess(); loadDashboard(); loadTransactions();
        } else if (isChatDeleted(res)) {
          push(mk({ kind: 'deleted', role: 'bot', message: res.message, emotion: res.emotion }));
          loadDashboard(); loadTransactions();
        } else {
          push(mk({ kind: 'tx', role: 'bot', tx: { ...res.transaction, createdAt: new Date(res.transaction.createdAt) }, usedTraining: res.usedTraining, autoLearned: res.autoLearned, message: res.message, emotion: res.emotion }));
          triggerSuccess(); loadDashboard(); loadTransactions();
        }
      } else {
        push(mk({ kind: 'text', role: 'user', text }));
        const res = await sendChatMessage(user.lineUserId, user.displayName, text);
        if (isChatQuestion(res)) {
          push(mk({ kind: 'text', role: 'bot', text: res.question }));
        } else if (isChatAnswer(res)) {
          push(mk({ kind: 'answer', role: 'bot', answer: res.answer, emotion: res.emotion }));
        } else if (isChatEdited(res)) {
          push(mk({ kind: 'edited', role: 'bot', tx: { ...res.transaction, createdAt: new Date(res.transaction.createdAt) }, message: res.message, emotion: res.emotion }));
          triggerSuccess(); loadDashboard(); loadTransactions();
        } else if (isChatDeleted(res)) {
          push(mk({ kind: 'deleted', role: 'bot', message: res.message, emotion: res.emotion }));
          loadDashboard(); loadTransactions();
        } else {
          push(mk({ kind: 'tx', role: 'bot', tx: { ...res.transaction, createdAt: new Date(res.transaction.createdAt) }, usedTraining: res.usedTraining, autoLearned: res.autoLearned, message: res.message, emotion: res.emotion }));
          triggerSuccess(); loadDashboard(); loadTransactions();
        }
      }
    } catch {
      push(mk({ kind: 'text', role: 'bot', text: 'โอ๊ย! มีอะไรผิดพลาดเลยค่า 😅 ลองใหม่อีกทีได้นะคะ' }));
    }

    setSending(false);
    inputRef.current?.focus();
  };

  if (!loaded) return (
    <div className="flex flex-col h-full items-center justify-center gap-4" style={{ background: 'var(--color-bg)' }}>
      <NongJodHai state="idle" size={80} />
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>กำลังโหลดประวัติสนทนา...</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--color-bg)' }}>
      {/* ── Header ── */}
      <div
        className="px-4 pt-4 pb-3 flex items-center gap-3"
        style={{ background: 'white', borderBottom: '1px solid var(--color-border)', boxShadow: '0 2px 12px var(--color-shadow)' }}
      >
        <motion.div whileTap={{ scale: 0.9 }}>
          <NongJodHai state={mascotState} size={52} />
        </motion.div>
        <div className="flex-1">
          <h1 className="text-base font-bold" style={{ color: 'var(--color-text)' }}>น้องจดให้</h1>
          <p className="text-xs font-medium" style={{ color: 'var(--color-brand-dark)' }}>● ออนไลน์ · Gemini 2.5 Flash</p>
        </div>
        {user && (
          <div className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: 'var(--color-brand-dim)', color: 'var(--color-brand-dark)' }}>
            {user.displayName}
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar">
        <AnimatePresence initial={false}>
          {msgs.map((m) => <MsgBubble key={m.id} m={m} onNavigate={() => navigate('/history')} />)}
        </AnimatePresence>
        {sending && <TypingBubble />}
        <div ref={bottomRef} />
      </div>

      {/* ── Image preview ── */}
      <AnimatePresence>
        {img && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="px-4 pb-2 flex items-center gap-3"
            style={{ background: 'white' }}
          >
            <div className="relative">
              <img src={img.preview} alt="preview" className="w-14 h-14 object-cover rounded-2xl border border-white" style={{ boxShadow: '0 2px 10px var(--color-shadow)' }} />
              <button onClick={() => setImg(null)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center bg-rose-400">
                <X size={10} className="text-white" />
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>กด ส่ง เพื่อให้น้องจดให้อ่านสลิปค่า 📸</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Suggestions ── */}
      {msgs.length <= 2 && (
        <div className="px-4 pb-2" style={{ background: 'white' }}>
          <p className="text-xs mb-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>ลองพิมพ์แบบนี้ค่า</p>
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => handleSend(s)} disabled={sending}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'var(--color-brand-dim)', color: 'var(--color-brand-dark)', border: '1px solid var(--color-brand-dim)' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ background: 'white', borderTop: '1px solid var(--color-border)' }}>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => fileRef.current?.click()}
          disabled={sending}
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
          style={{ background: 'var(--color-bg-2)', border: '1.5px solid var(--color-border)' }}
        >
          <ImagePlus size={18} style={{ color: 'var(--color-text-muted)' }} />
        </motion.button>

        <input ref={inputRef} type="text" value={input}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="พิมพ์รายการ เช่น กาแฟ 65..."
          className="flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
          style={{ background: 'var(--color-bg-2)', border: '1.5px solid transparent', color: 'var(--color-text)' }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--color-brand)'; e.target.style.boxShadow = '0 0 0 3px var(--color-brand-dim)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'transparent'; e.target.style.boxShadow = 'none'; }}
          disabled={sending}
        />

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => handleSend()}
          disabled={(!input.trim() && !img) || sending}
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #3ECFBF, #28A99A)', boxShadow: '0 3px 12px rgba(62,207,191,0.4)' }}
        >
          {sending ? <Loader2 size={18} className="animate-spin text-white" /> : <Send size={18} className="text-white" />}
        </motion.button>
      </div>
    </div>
  );
}

function MsgBubble({ m, onNavigate }: { m: Msg; onNavigate: () => void }) {
  if (m.kind === 'image') {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 items-end flex-row-reverse">
        {m.preview
          ? <img src={m.preview} alt="slip" className="max-w-[55%] rounded-2xl" style={{ borderBottomRightRadius: 6, boxShadow: '0 3px 14px rgba(0,0,0,0.1)' }} />
          : <div className="px-4 py-2.5 rounded-2xl text-sm italic" style={{ background: 'linear-gradient(135deg,#3ECFBF,#28A99A)', color: 'white', borderBottomRightRadius: 6 }}>📸 ส่งรูปใบเสร็จ</div>
        }
      </motion.div>
    );
  }

  if (m.kind === 'tx') return <TxCard m={m} onNavigate={onNavigate} />;

  if (m.kind === 'answer') return <BotBubble text={m.answer} />;

  if (m.kind === 'deleted') return <BotBubble text={m.message} />;

  if (m.kind === 'edited') return <EditedCard m={m} onNavigate={onNavigate} />;

  return m.role === 'bot' ? <BotBubble text={m.text} /> : <UserBubble text={m.text} />;
}

function EditedCard({ m, onNavigate }: { m: EditedMsg; onNavigate: () => void }) {
  const { tx, message } = m;
  const isExp = tx.type === 'EXPENSE';
  const tc = isExp ? '#FF6B9D' : '#34C77B';
  const tbg = isExp ? 'rgba(255,107,157,0.10)' : 'rgba(52,199,123,0.10)';
  const emoji = CATEGORY_EMOJI[tx.category] ?? '📦';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      className="flex gap-2 items-end"
    >
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 text-base">🤖</div>
      <div className="max-w-[88%] overflow-hidden" style={{ borderRadius: 18, borderBottomLeftRadius: 6, border: '1.5px solid var(--color-border)', boxShadow: '0 4px 20px var(--color-shadow)', background: 'white' }}>
        {/* Edited badge + Bot message */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-lg font-semibold" style={{ background: 'rgba(245,158,11,0.12)', color: '#B45309' }}>✏️ แก้ไขแล้ว</span>
          <p className="text-sm leading-relaxed w-full" style={{ color: 'var(--color-text)' }}>{message}</p>
        </div>

        {/* Transaction card */}
        <div className="mx-3 mb-3 rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)' }}>
          {/* Header strip */}
          <div className="px-3 py-2 flex items-center justify-between" style={{ background: tbg }}>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'white', color: tc }}>
              {isExp ? '↑ รายจ่าย' : '↓ รายรับ'}
            </span>
            <span className="text-sm font-black" style={{ color: tc }}>
              {isExp ? '-' : '+'}฿{tx.amount.toLocaleString('th-TH')}
            </span>
          </div>

          {/* Details */}
          <div className="px-3 py-2.5 flex items-center gap-2.5">
            <span className="text-2xl">{emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>{tx.note ?? tx.category}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {tx.category} · {new Date(tx.createdAt).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-3 flex justify-end">
          <button onClick={onNavigate} className="text-xs font-semibold" style={{ color: 'var(--color-brand-dark)' }}>
            ดูใน ประวัติ →
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function TxCard({ m, onNavigate }: { m: TxMsg; onNavigate: () => void }) {
  const { tx, usedTraining, autoLearned, message } = m;
  const isExp = tx.type === 'EXPENSE';
  const tc = isExp ? '#FF6B9D' : '#34C77B';
  const tbg = isExp ? 'rgba(255,107,157,0.10)' : 'rgba(52,199,123,0.10)';
  const emoji = CATEGORY_EMOJI[tx.category] ?? '📦';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      className="flex gap-2 items-end"
    >
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5 text-base">🤖</div>
      <div className="max-w-[88%] overflow-hidden" style={{ borderRadius: 18, borderBottomLeftRadius: 6, border: '1.5px solid var(--color-border)', boxShadow: '0 4px 20px var(--color-shadow)', background: 'white' }}>
        {/* Bot message */}
        <div className="px-4 pt-3 pb-2">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>{message}</p>
        </div>

        {/* Transaction card */}
        <div className="mx-3 mb-3 rounded-2xl overflow-hidden" style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)' }}>
          {/* Header strip */}
          <div className="px-3 py-2 flex items-center justify-between" style={{ background: tbg }}>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'white', color: tc }}>
              {isExp ? '↑ รายจ่าย' : '↓ รายรับ'}
            </span>
            <span className="text-sm font-black" style={{ color: tc }}>
              {isExp ? '-' : '+'}฿{tx.amount.toLocaleString('th-TH')}
            </span>
          </div>

          {/* Details */}
          <div className="px-3 py-2.5 flex items-center gap-2.5">
            <span className="text-2xl">{emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--color-text)' }}>{tx.note ?? tx.category}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {tx.category} · {new Date(tx.createdAt).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Badges */}
          {(usedTraining || autoLearned) && (
            <div className="px-3 pb-2.5 flex gap-1.5">
              {usedTraining && <span className="text-xs px-2 py-0.5 rounded-lg font-semibold" style={{ background: 'rgba(139,92,246,0.1)', color: '#7C3AED' }}>⚡ cache</span>}
              {autoLearned && <span className="text-xs px-2 py-0.5 rounded-lg font-semibold" style={{ background: 'rgba(52,199,123,0.1)', color: '#16A34A' }}>🧠 เรียนรู้แล้ว</span>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-3 flex justify-end">
          <button onClick={onNavigate} className="text-xs font-semibold" style={{ color: 'var(--color-brand-dark)' }}>
            แก้ไขใน ประวัติ →
          </button>
        </div>
      </div>
    </motion.div>
  );
}
