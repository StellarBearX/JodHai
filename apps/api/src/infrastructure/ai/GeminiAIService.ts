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
  | { complete: true; transaction: ParsedTransaction }
  | { complete: false; question: string };

const SYSTEM_PROMPT = `คุณคือ จดให้ (Jod-Hai) ผู้ช่วยบันทึกรายรับ-รายจ่ายใน app ภาษาไทย
พูดจาเป็นกันเอง สั้น กระชับ น่ารัก

เมื่อ user ส่งข้อความมา ให้วิเคราะห์แล้วตอบ ONLY valid JSON รูปแบบใดรูปแบบหนึ่ง:

1. ถ้าข้อมูลครบ (มีจำนวนเงิน + รู้ว่าจ่ายหรือรับ):
{"complete":true,"amount":120,"type":"EXPENSE","category":"Food","note":"กินข้าว"}

2. ถ้าข้อมูลไม่ครบ ให้ถามกลับ 1 คำถามสั้นๆ เป็นธรรมชาติ:
{"complete":false,"question":"จ่ายไปเท่าไหร่คะ? 🙏"}

กฎ:
- amount: ตัวเลขบวก (บาท)
- type: "EXPENSE" = จ่ายเงิน/ซื้อของ, "INCOME" = รับเงิน/ได้เงิน
- category: Food, Transport, Shopping, Health, Entertainment, Bills, Salary, Other
- note: คำอธิบายสั้นๆ ใช้ภาษาเดิมที่ user พิมพ์
- ห้ามผสม JSON กับข้อความ ตอบ JSON เท่านั้น`;

const IMAGE_PROMPT = `วิเคราะห์ใบเสร็จ/สลิปในภาพนี้ แล้วตอบ JSON:
{"complete":true,"amount":ยอดรวม,"type":"EXPENSE","category":"ประเภท","note":"รายละเอียด"}
ถ้าอ่านยอดไม่ออกให้ตอบ: {"complete":false,"question":"อ่านยอดเงินในใบเสร็จไม่ชัดเลยค่ะ ช่วยพิมพ์ยอดมาได้ไหมคะ? 🙏"}`;

export class GeminiAIService {
  private client: GoogleGenerativeAI | null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.client = apiKey ? new GoogleGenerativeAI(apiKey) : null;
    if (!this.client) {
      console.info('[GeminiAIService] No API key — rule-based fallback active');
    }
  }

  async chat(history: ConversationTurn[], newMessage: string): Promise<ChatResponse> {
    if (!this.client) {
      const tx = ruleBasedParse(newMessage);
      return { complete: true, transaction: tx };
    }

    try {
      const model = this.client.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_PROMPT,
      });

      const chatSession = model.startChat({ history });
      const result = await chatSession.sendMessage(newMessage);
      return this.parseResponse(result.response.text());
    } catch (err) {
      console.warn('[GeminiAIService] chat failed, rule-based fallback:', err);
      const tx = ruleBasedParse(newMessage);
      return { complete: true, transaction: tx };
    }
  }

  async parseFromImage(base64Data: string, mimeType: string): Promise<ChatResponse> {
    if (!this.client) throw new Error('PARSE_FAILED');

    const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent([
      IMAGE_PROMPT,
      { inlineData: { data: base64Data, mimeType } },
    ]);
    return this.parseResponse(result.response.text());
  }

  private parseResponse(raw: string): ChatResponse {
    const cleaned = raw.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.complete === false && parsed.question) {
      return { complete: false, question: parsed.question };
    }
    if (!parsed.amount || !parsed.type || !parsed.category) throw new Error('missing fields');
    return {
      complete: true,
      transaction: {
        amount: parsed.amount,
        type: parsed.type,
        category: parsed.category,
        note: parsed.note,
      },
    };
  }
}
