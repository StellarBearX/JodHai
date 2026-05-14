import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
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
  private provider: 'gemini' | 'openai' | 'none';
  private geminiClient: GoogleGenerativeAI | null = null;
  private openaiClient: OpenAI | null = null;
  private openaiModel: string = 'gpt-4o';

  constructor() {
    this.provider = (process.env.AI_PROVIDER ?? 'gemini') as 'gemini' | 'openai';

    if (this.provider === 'openai') {
      const baseURL = process.env.OPENAI_BASE_URL;
      const apiKey  = process.env.OPENAI_API_KEY ?? 'none';
      this.openaiModel = process.env.OPENAI_MODEL ?? 'gpt-4o';
      if (baseURL) {
        this.openaiClient = new OpenAI({ baseURL, apiKey });
        console.info(`[AI] OpenAI-compatible → ${baseURL} (${this.openaiModel})`);
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
        model: this.openaiModel,
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
      return this.parseResponse(res.choices[0]?.message?.content ?? '');
    } catch (err) {
      console.warn('[OpenAI] image parse failed:', (err as Error).message);
      return { complete: false, question: 'อ่านรูปไม่ได้เลยค่า 😅 ช่วยพิมพ์ยอดและรายละเอียดให้หน่อยได้ไหมคะ?' };
    }
  }

  // ── Shared parser ───────────────────────────────────────────────────────────
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
