import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { TransactionType } from '@jod-hai/shared';
import { ruleBasedParse } from './RuleBasedParser';
import { ConversationTurn } from '../conversation/ConversationStore';
import { MonthlyStats } from '../../domain/repositories/ITransactionRepository';
import { TransactionEntity } from '../../domain/entities/TransactionEntity';

export interface ParsedTransaction {
  amount: number;
  type: TransactionType;
  category: string;
  note?: string;
}

export type ChatResponse =
  | { complete: true; transaction: ParsedTransaction; message: string; emotion: EmotionHint }
  | { complete: false; question: string };

export type EmotionHint = 'happy' | 'excited' | 'neutral' | 'worried';

export type EditDeleteResponse =
  | { action: 'edit'; txId: string; changes: Partial<{ amount: number; category: string; note: string; type: 'INCOME' | 'EXPENSE' }>; message: string; emotion: EmotionHint }
  | { action: 'delete'; txId: string; message: string; emotion: EmotionHint }
  | { action: 'notfound'; message: string };

export type QueryResponse = { answer: string; emotion: EmotionHint };

const SYSTEM_PROMPT = `คุณคือ "น้องจดให้" (Nong Jod-Hai) — ผู้ช่วยส่วนตัวสาวน้อยสุดโปรที่คอยดูแลเรื่องเงินให้เพื่อนๆ

ตัวตน:
- แทนตัวเองว่า "เรา" หรือ "จดให้"  เรียกผู้ใช้ว่า "เธอ" หรือ "คุณ"
- กระฉับกระเฉง น่ารัก พูดจาเป็นธรรมชาติ ใช้ภาษาไทยวัยรุ่น
- ใช้คำ "จ้ะ" "จ้า" "เรียบร้อยค่า" "เช็คได้เลยนะ" "หน่อยนึงน้า"
- เปลี่ยนโทนตามอารมณ์ข้อมูล (สนุก/เป็นห่วง/ตื่นเต้น)

รับข้อความ แล้วตอบกลับเป็น JSON รูปแบบใดรูปแบบหนึ่ง:

[รูปแบบ 1 - ข้อมูลครบ]:
{
  "complete": true,
  "amount": 120,
  "type": "EXPENSE",
  "category": "Food",
  "note": "ชานม",
  "message": "เรียบร้อยค่า~ ☕ ชายสายหวานอีกแล้วนะเนี่ย จดไว้เรียบร้อยจ้า!",
  "emotion": "happy"
}

[รูปแบบ 2 - ข้อมูลไม่ครบ]:
{
  "complete": false,
  "question": "วันนี้จ่ายไปเท่าไหร่อ่า? 😊"
}

กฎสำคัญ:
- amount: ตัวเลขบวก (บาท)
- type: "EXPENSE" = จ่าย/ซื้อ, "INCOME" = รับ/ได้
- category: Food | Transport | Shopping | Health | Entertainment | Bills | Salary | Other
- note: คำอธิบายกระชับ 2-4 คำ ใช้ภาษา user พิมพ์มา
- message: ข้อความตอบกลับน่ารัก เปลี่ยนตามสถานการณ์ ไม่ซ้ำเดิม
- emotion: "happy" | "excited" | "neutral" | "worried"
  - happy = บันทึกปกติ
  - excited = รับเงิน/ยอดใหญ่
  - worried = รายจ่ายสูงผิดปกติ หรือรายละเอียดดูแปลก
  - neutral = ธุรกรรมธรรมดา
- ตอบ JSON เท่านั้น ห้ามมีข้อความนอก JSON

ตัวอย่างข้อความ message ที่ดี:
- "เรียบร้อยแล้วจ้า! 🍜 มื้อเที่ยงวันนี้ดูอร่อยเลยนะ"
- "รับเงินเดือนแล้ว! 🎉 เยย~ จดให้เก็บไว้เรียบร้อยค่า"
- "โอ้โห! ช้อปหนักมากเลยนะวันนี้ 🛍️ จดไว้ก่อนน้า"
- "จ่ายค่าน้ำมันแล้วจ้า ⛽ ขับรถระวังด้วยนะคะ"`;

const IMAGE_PROMPT = `น้องจดให้กำลังดูรูปใบเสร็จ/สลิปโอนเงินนี้ วิเคราะห์แล้วตอบ JSON:

กฎการอ่าน note:
- ถ้าเป็นสลิปโอนเงิน → note = ชื่อผู้รับเงิน (ชื่อบัญชีปลายทาง) เช่น "โอน นายสมชาย"
- ถ้าเป็นใบเสร็จร้านค้า → note = ชื่อร้านหรือสินค้า เช่น "เสือป่าคอฟฟี่"
- ถ้าไม่มีชื่อ → note = รายละเอียดกระชับจากสลิป

[ถ้าอ่านยอดได้]:
{"complete":true,"amount":ยอดรวม,"type":"EXPENSE","category":"หมวด","note":"ชื่อผู้รับหรือร้านค้า","message":"ข้อความน่ารักจากน้องจดให้","emotion":"happy"}

[ถ้าอ่านยอดไม่ได้]:
{"complete":false,"question":"อ่านตัวเลขในสลิปไม่ชัดเลยค่า 😅 ช่วยพิมพ์ยอดมาให้หน่อยได้ไหมคะ?"}

ตอบ JSON เท่านั้น ห้ามมีข้อความนอก JSON`;

export class GeminiAIService {
  private provider: 'gemini' | 'openai' | 'none';
  private geminiClient: GoogleGenerativeAI | null = null;
  private openaiClient: OpenAI | null = null;
  private openaiModel: string = 'gpt-4o';
  private openaiVisionModel: string = 'gpt-4o';

  constructor() {
    this.provider = (process.env.AI_PROVIDER ?? 'gemini') as 'gemini' | 'openai';

    if (this.provider === 'openai') {
      const baseURL = process.env.OPENAI_BASE_URL;
      const apiKey  = process.env.OPENAI_API_KEY ?? 'none';
      this.openaiModel = process.env.OPENAI_MODEL ?? 'gpt-4o';
      this.openaiVisionModel = process.env.OPENAI_VISION_MODEL ?? this.openaiModel;
      if (baseURL) {
        this.openaiClient = new OpenAI({ baseURL, apiKey });
        console.info(`[AI] OpenAI-compatible → ${baseURL} (text: ${this.openaiModel}, vision: ${this.openaiVisionModel})`);
      } else {
        console.warn('[AI] AI_PROVIDER=openai but OPENAI_BASE_URL not set — rule-based fallback');
        this.provider = 'none';
      }
    } else {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        this.geminiClient = new GoogleGenerativeAI(apiKey);
        console.info('[AI] Gemini provider active');
      } else {
        console.info('[AI] No API key — rule-based fallback');
        this.provider = 'none';
      }
    }
  }

  async chat(history: ConversationTurn[], newMessage: string, budgetPct?: number): Promise<ChatResponse> {
    let systemInstruction = SYSTEM_PROMPT;
    if (budgetPct !== undefined && budgetPct >= 80) {
      systemInstruction += `\n\n[สถานะงบ: ใช้ไปแล้ว ${budgetPct.toFixed(0)}% — ควรแสดงความเป็นห่วงเบาๆ ใน message และตั้ง emotion = "worried"]`;
    }

    if (this.provider === 'openai' && this.openaiClient) {
      return this.chatOpenAI(history, newMessage, systemInstruction);
    }
    if (this.provider === 'gemini' && this.geminiClient) {
      return this.chatGemini(history, newMessage, systemInstruction);
    }

    const tx = ruleBasedParse(newMessage);
    return { complete: true, transaction: tx, message: 'จดเรียบร้อยแล้วจ้า! ✅', emotion: 'happy' };
  }

  async parseFromImage(base64Data: string, mimeType: string): Promise<ChatResponse> {
    if (this.provider === 'openai' && this.openaiClient) {
      return this.imageOpenAI(base64Data, mimeType);
    }
    if (this.provider === 'gemini' && this.geminiClient) {
      return this.imageGemini(base64Data, mimeType);
    }
    throw new Error('PARSE_FAILED');
  }

  // ── Gemini ──────────────────────────────────────────────────────────────────
  private async chatGemini(history: ConversationTurn[], newMessage: string, systemInstruction: string): Promise<ChatResponse> {
    try {
      const model = this.geminiClient!.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction });
      const result = await model.startChat({ history }).sendMessage(newMessage);
      return this.parseResponse(result.response.text());
    } catch (err) {
      console.warn('[Gemini] chat failed, rule-based fallback:', (err as Error).message);
      const tx = ruleBasedParse(newMessage);
      return { complete: true, transaction: tx, message: 'จดให้เรียบร้อยแล้วจ้า! ✅', emotion: 'neutral' };
    }
  }

  private async imageGemini(base64Data: string, mimeType: string): Promise<ChatResponse> {
    try {
      const model = this.geminiClient!.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent([IMAGE_PROMPT, { inlineData: { data: base64Data, mimeType } }]);
      return this.parseResponse(result.response.text());
    } catch (err) {
      console.warn('[Gemini] image parse failed:', (err as Error).message);
      return { complete: false, question: 'อ่านรูปไม่ได้เลยค่า 😅 ช่วยพิมพ์ยอดและรายละเอียดให้หน่อยได้ไหมคะ?' };
    }
  }

  // ── OpenAI-compatible ───────────────────────────────────────────────────────
  private async chatOpenAI(history: ConversationTurn[], newMessage: string, systemInstruction: string): Promise<ChatResponse> {
    try {
      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemInstruction },
        ...history.map((h) => ({
          role: h.role === 'model' ? 'assistant' as const : 'user' as const,
          content: typeof h.parts[0] === 'string' ? h.parts[0] : (h.parts[0] as any).text ?? '',
        })),
        { role: 'user', content: newMessage },
      ];

      const res = await this.openaiClient!.chat.completions.create({
        model: this.openaiModel,
        messages,
      });

      return this.parseResponse(res.choices[0]?.message?.content ?? '');
    } catch (err) {
      console.warn('[OpenAI] chat failed, rule-based fallback:', (err as Error).message);
      const tx = ruleBasedParse(newMessage);
      return { complete: true, transaction: tx, message: 'จดให้เรียบร้อยแล้วจ้า! ✅', emotion: 'neutral' };
    }
  }

  private async imageOpenAI(base64Data: string, mimeType: string): Promise<ChatResponse> {
    try {
      const res = await this.openaiClient!.chat.completions.create({
        model: this.openaiVisionModel,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: IMAGE_PROMPT },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } },
            ],
          },
        ],
      });
      const raw = res.choices[0]?.message?.content ?? '';
      console.log('[Vision] raw response:', raw);
      return this.parseResponse(raw);
    } catch (err) {
      console.warn('[Vision] image parse failed:', (err as Error).message);
      return { complete: false, question: 'อ่านรูปไม่ได้เลยค่า 😅 ช่วยพิมพ์ยอดและรายละเอียดให้หน่อยได้ไหมคะ?' };
    }
  }

  // ── Financial Query ─────────────────────────────────────────────────────────
  async answerQuery(stats: MonthlyStats, question: string): Promise<QueryResponse> {
    const catLines = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])
      .map(([c, a]) => `  • ${c}: ฿${a.toLocaleString('th-TH')}`).join('\n');
    const budgetPct = stats.totalIncome > 0 ? (stats.totalExpense / stats.totalIncome) * 100 : 0;

    const prompt = `คุณคือ "น้องจดให้" ผู้ช่วยการเงินน่ารัก ใช้ภาษาไทยวัยรุ่น กระชับ ใส่ emoji

ข้อมูลการเงินเดือนนี้:
- รายรับรวม: ฿${stats.totalIncome.toLocaleString('th-TH')}
- รายจ่ายรวม: ฿${stats.totalExpense.toLocaleString('th-TH')}
- ยอดคงเหลือ: ฿${stats.balance.toLocaleString('th-TH')}
- ใช้ไปแล้ว ${budgetPct.toFixed(1)}% ของรายรับ
- จำนวนรายการ: ${stats.txCount} รายการ
${catLines ? `รายจ่ายแยกหมวด:\n${catLines}` : ''}

ผู้ใช้ถามว่า: "${question}"

ตอบ JSON เท่านั้น:
{"answer":"ข้อความตอบพร้อมตัวเลขจริง","emotion":"happy|neutral|worried|excited"}`;

    try {
      const raw = await this.callAI(prompt);
      const p = JSON.parse(raw.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, ''));
      return { answer: p.answer ?? 'ขอโทษนะคะ ดึงข้อมูลไม่ได้ค่า', emotion: (p.emotion as EmotionHint) ?? 'neutral' };
    } catch {
      return { answer: `เดือนนี้รายรับ ฿${stats.totalIncome.toLocaleString('th-TH')} รายจ่าย ฿${stats.totalExpense.toLocaleString('th-TH')} คงเหลือ ฿${stats.balance.toLocaleString('th-TH')} จ้า 💚`, emotion: 'neutral' };
    }
  }

  // ── Edit / Delete Intent ─────────────────────────────────────────────────────
  async parseEditDeleteIntent(recentTxs: TransactionEntity[], message: string): Promise<EditDeleteResponse> {
    const txList = recentTxs.map((t, i) =>
      `${i + 1}. id="${t.id}" | ${t.type === 'EXPENSE' ? 'จ่าย' : 'รับ'} ฿${t.amount} | ${t.category} | ${t.note ?? '-'} | ${new Date(t.createdAt).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
    ).join('\n');

    const prompt = `คุณคือ "น้องจดให้" ผู้ช่วยการเงิน

รายการล่าสุดของผู้ใช้:
${txList}

ผู้ใช้พูดว่า: "${message}"

วิเคราะห์ว่าต้องการแก้หรือลบรายการไหน แล้วตอบ JSON รูปแบบใดรูปแบบหนึ่ง:

[แก้ไข]:
{"action":"edit","txId":"id-ของรายการ","changes":{"amount":75},"message":"แก้เรียบร้อยค่า! ✏️ ...","emotion":"happy"}

[ลบ]:
{"action":"delete","txId":"id-ของรายการ","message":"ลบแล้วจ้า! 🗑️ ...","emotion":"neutral"}

[หาไม่เจอ]:
{"action":"notfound","message":"หารายการที่จะแก้ไม่เจอเลยค่า 😅 บอกรายละเอียดเพิ่มได้ไหมคะ?"}

ตอบ JSON เท่านั้น`;

    try {
      const raw = await this.callAI(prompt);
      const p = JSON.parse(raw.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, ''));
      if (p.action === 'edit') return { action: 'edit', txId: p.txId, changes: p.changes ?? {}, message: p.message ?? 'แก้เรียบร้อยแล้วจ้า! ✏️', emotion: p.emotion ?? 'happy' };
      if (p.action === 'delete') return { action: 'delete', txId: p.txId, message: p.message ?? 'ลบแล้วจ้า! 🗑️', emotion: p.emotion ?? 'neutral' };
      return { action: 'notfound', message: p.message ?? 'หาไม่เจอค่า ลองบอกรายละเอียดเพิ่มนะ 😅' };
    } catch {
      return { action: 'notfound', message: 'หารายการที่จะแก้ไม่เจอเลยค่า 😅 ลองบอกรายละเอียดเพิ่มได้ไหมคะ?' };
    }
  }

  // ── Dashboard Analysis ───────────────────────────────────────────────────────
  async analyzeDashboard(stats: MonthlyStats): Promise<string> {
    if (stats.txCount === 0) return 'ยังไม่มีรายการเดือนนี้เลยค่า เริ่มจดได้เลยนะ! 💪';

    const catLines = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])
      .map(([c, a]) => `${c}: ฿${a.toLocaleString('th-TH')}`).join(', ');
    const budgetPct = stats.totalIncome > 0 ? (stats.totalExpense / stats.totalIncome) * 100 : 0;
    const topCat = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])[0];

    const prompt = `คุณคือ "น้องจดให้" นักวิเคราะห์การเงินน่ารัก

ข้อมูลเดือนนี้:
- รายรับ: ฿${stats.totalIncome.toLocaleString('th-TH')} | รายจ่าย: ฿${stats.totalExpense.toLocaleString('th-TH')} | คงเหลือ: ฿${stats.balance.toLocaleString('th-TH')}
- ใช้ไป ${budgetPct.toFixed(1)}% ของรายรับ | ${stats.txCount} รายการ
- รายจ่ายแยกหมวด: ${catLines || 'ไม่มีรายจ่าย'}
${topCat ? `- หมวดที่ใช้เงินมากสุด: ${topCat[0]} (฿${topCat[1].toLocaleString('th-TH')})` : ''}

สรุปวิเคราะห์เดือนนี้เป็นภาษาไทยน่ารัก 3-4 bullet ประเด็น ใส่ emoji แต่ละข้อ กระชับ ข้อละ 1 ประโยค
ตอบเป็น plain text (ไม่ใช่ JSON) ขึ้นต้นแต่ละบรรทัดด้วย • `;

    try {
      const raw = await this.callAI(prompt);
      return raw.trim();
    } catch {
      return `• รายรับเดือนนี้ ฿${stats.totalIncome.toLocaleString('th-TH')} 💰\n• รายจ่ายรวม ฿${stats.totalExpense.toLocaleString('th-TH')} 💸\n• ยอดคงเหลือ ฿${stats.balance.toLocaleString('th-TH')} 🏦`;
    }
  }

  // ── Internal AI caller ───────────────────────────────────────────────────────
  private async callAI(prompt: string): Promise<string> {
    if (this.provider === 'openai' && this.openaiClient) {
      const res = await this.openaiClient.chat.completions.create({
        model: this.openaiModel,
        messages: [{ role: 'user', content: prompt }],
      });
      return res.choices[0]?.message?.content ?? '';
    }
    if (this.provider === 'gemini' && this.geminiClient) {
      const model = this.geminiClient.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent(prompt);
      return result.response.text();
    }
    throw new Error('No AI provider');
  }

  // ── Shared parser ───────────────────────────────────────────────────────────
  private parseResponse(raw: string): ChatResponse {
    const cleaned = raw.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.complete === false && parsed.question) return { complete: false, question: parsed.question };
    const amount = Number(parsed.amount);
    if (!amount || isNaN(amount) || !parsed.type || !parsed.category) throw new Error('missing fields');
    return {
      complete: true,
      transaction: { amount, type: parsed.type, category: parsed.category, note: parsed.note },
      message: parsed.message ?? 'จดเรียบร้อยแล้วจ้า! ✅',
      emotion: (parsed.emotion as EmotionHint) ?? 'happy',
    };
  }
}
