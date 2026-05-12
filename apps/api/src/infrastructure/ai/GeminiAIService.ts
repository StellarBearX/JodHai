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

const SYSTEM_PROMPT = `คุณคือ "จดให้" (Jod-Hai) ผู้ช่วยบันทึกรายรับ-รายจ่ายส่วนตัว พูดจาเป็นกันเอง สั้น กระชับ เป็นธรรมชาติ

เมื่อ user ส่งข้อความมาให้:
- วิเคราะห์ว่าเป็นการบันทึกรายการเงินหรือไม่
- ถ้าใช่ และข้อมูลครบ ตอบ JSON แบบที่ 1
- ถ้าข้อมูลไม่ครบ ถามกลับแบบเป็นธรรมชาติ ตอบ JSON แบบที่ 2

JSON แบบที่ 1 (ข้อมูลครบ):
{"complete":true,"amount":120,"type":"EXPENSE","category":"Food","note":"กินข้าว"}

JSON แบบที่ 2 (ข้อมูลไม่ครบ หรือต้องการยืนยัน):
{"complete":false,"question":"จ่ายไปเท่าไหร่คะ?"}

หมวดหมู่ (category):
- Food: อาหาร เครื่องดื่ม ร้านอาหาร คาเฟ่
- Transport: แท็กซี่ รถ น้ำมัน BTS MRT Grab
- Shopping: ของใช้ เสื้อผ้า ห้างสรรพสินค้า ออนไลน์
- Health: ยา หมอ โรงพยาบาล ฟิตเนส
- Entertainment: หนัง เกม ท่องเที่ยว บันเทิง
- Bills: ค่าไฟ ค่าน้ำ ค่าเน็ต ค่าเช่า subscription
- Salary: เงินเดือน โบนัส ค่าจ้าง
- Other: อื่นๆ

กฎสำคัญ:
- amount ต้องเป็นตัวเลขบวก (หน่วยบาท)
- type: "EXPENSE" = จ่ายออก, "INCOME" = รับเข้า
- note ใช้ภาษาที่ user พิมพ์มา กระชับ 2-5 คำ
- ตอบ JSON เท่านั้น ห้ามมีข้อความอื่น`;

const IMAGE_PROMPT = `วิเคราะห์ใบเสร็จ/สลิปในภาพ แล้วตอบ JSON:

ถ้าอ่านยอดได้:
{"complete":true,"amount":ยอดรวม,"type":"EXPENSE","category":"หมวด","note":"รายละเอียด"}

ถ้าอ่านยอดไม่ได้:
{"complete":false,"question":"อ่านยอดเงินในใบเสร็จไม่ชัดเลยค่ะ ช่วยพิมพ์ยอดมาได้ไหมคะ?"}

หมวด: Food, Transport, Shopping, Health, Entertainment, Bills, Salary, Other
ตอบ JSON เท่านั้น`;

export class GeminiAIService {
  private client: GoogleGenerativeAI | null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.client = apiKey ? new GoogleGenerativeAI(apiKey) : null;
    if (!this.client) console.info('[Gemini] No API key — rule-based fallback active');
  }

  async chat(history: ConversationTurn[], newMessage: string): Promise<ChatResponse> {
    if (!this.client) return { complete: true, transaction: ruleBasedParse(newMessage) };

    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: SYSTEM_PROMPT });
      const chatSession = model.startChat({ history });
      const result = await chatSession.sendMessage(newMessage);
      return this.parseResponse(result.response.text());
    } catch (err) {
      console.warn('[Gemini] chat failed, rule-based fallback:', (err as Error).message);
      return { complete: true, transaction: ruleBasedParse(newMessage) };
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
      return { complete: false, question: 'อ่านรูปไม่ได้เลยค่ะ ช่วยพิมพ์ยอดและรายละเอียดมาได้เลยนะคะ 🙏' };
    }
  }

  private parseResponse(raw: string): ChatResponse {
    const cleaned = raw.trim().replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.complete === false && parsed.question) return { complete: false, question: parsed.question };
    if (!parsed.amount || !parsed.type || !parsed.category) throw new Error('missing fields');
    return { complete: true, transaction: { amount: parsed.amount, type: parsed.type, category: parsed.category, note: parsed.note } };
  }
}
