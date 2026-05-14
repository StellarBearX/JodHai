import { GoogleGenerativeAI } from '@google/generative-ai';
import { TransactionType } from '@jod-hai/shared';
import { ruleBasedParse } from './RuleBasedParser';
import { ConversationTurn } from '../conversation/ConversationStore';

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

const IMAGE_PROMPT = `น้องจดให้กำลังดูรูปใบเสร็จ/สลิปนี้ วิเคราะห์แล้วตอบ JSON:

[ถ้าอ่านยอดได้]:
{"complete":true,"amount":ยอดรวม,"type":"EXPENSE","category":"หมวด","note":"รายละเอียด","message":"ข้อความน่ารักจากน้องจดให้","emotion":"happy"}

[ถ้าอ่านยอดไม่ได้]:
{"complete":false,"question":"อ่านตัวเลขในสลิปไม่ชัดเลยค่า 😅 ช่วยพิมพ์ยอดมาให้หน่อยได้ไหมคะ?"}

ตอบ JSON เท่านั้น ห้ามมีข้อความนอก JSON`;

export class GeminiAIService {
  private client: GoogleGenerativeAI | null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.client = apiKey ? new GoogleGenerativeAI(apiKey) : null;
    if (!this.client) console.info('[Gemini] No API key — rule-based fallback');
  }

  async chat(history: ConversationTurn[], newMessage: string, budgetPct?: number): Promise<ChatResponse> {
    if (!this.client) {
      const tx = ruleBasedParse(newMessage);
      return { complete: true, transaction: tx, message: 'จดเรียบร้อยแล้วจ้า! ✅', emotion: 'happy' };
    }

    // Inject budget context if near limit
    let systemInstruction = SYSTEM_PROMPT;
    if (budgetPct !== undefined && budgetPct >= 80) {
      systemInstruction += `\n\n[สถานะงบ: ใช้ไปแล้ว ${budgetPct.toFixed(0)}% — ควรแสดงความเป็นห่วงเบาๆ ใน message และตั้ง emotion = "worried"]`;
    }

    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction });
      const chatSession = model.startChat({ history });
      const result = await chatSession.sendMessage(newMessage);
      return this.parseResponse(result.response.text());
    } catch (err) {
      console.warn('[Gemini] chat failed, rule-based fallback:', (err as Error).message);
      const tx = ruleBasedParse(newMessage);
      return { complete: true, transaction: tx, message: 'จดให้เรียบร้อยแล้วจ้า! ✅', emotion: 'neutral' };
    }
  }

  async parseFromImage(base64Data: string, mimeType: string): Promise<ChatResponse> {
    if (!this.client) throw new Error('PARSE_FAILED');
    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent([IMAGE_PROMPT, { inlineData: { data: base64Data, mimeType } }]);
      return this.parseResponse(result.response.text());
    } catch (err) {
      console.warn('[Gemini] image parse failed:', (err as Error).message);
      return { complete: false, question: 'อ่านรูปไม่ได้เลยค่า 😅 ช่วยพิมพ์ยอดและรายละเอียดให้หน่อยได้ไหมคะ?' };
    }
  }

  private parseResponse(raw: string): ChatResponse {
    const cleaned = raw.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.complete === false && parsed.question) return { complete: false, question: parsed.question };
    if (!parsed.amount || !parsed.type || !parsed.category) throw new Error('missing fields');
    return {
      complete: true,
      transaction: { amount: parsed.amount, type: parsed.type, category: parsed.category, note: parsed.note },
      message: parsed.message ?? 'จดเรียบร้อยแล้วจ้า! ✅',
      emotion: (parsed.emotion as EmotionHint) ?? 'happy',
    };
  }
}
