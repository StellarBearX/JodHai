import { GoogleGenerativeAI } from '@google/generative-ai';
import { TransactionType } from '@jod-hai/shared';
import { ruleBasedParse } from './RuleBasedParser';

export interface ParsedTransaction {
  amount: number;
  type: TransactionType;
  category: string;
  note?: string;
}

const SYSTEM_PROMPT = `You are an expense-tracking assistant for a Thai web app called Jod-Hai (จดให้).
Parse the user's Thai or English message (or image of a receipt/slip) into a structured JSON object.

Rules:
- "amount" must be a positive number (THB).
- "type" is "EXPENSE" for purchases/payments, "INCOME" for salary/received money.
- "category" must be one of: Food, Transport, Shopping, Health, Entertainment, Bills, Salary, Other.
- "note" is optional short description.
- For images: extract the total amount paid and identify what kind of purchase it is.
- Respond ONLY with valid JSON. No explanation, no markdown fences.

Example output:
{"amount": 65, "type": "EXPENSE", "category": "Food", "note": "ชานมไข่มุก"}`;

export class GeminiAIService {
  private client: GoogleGenerativeAI | null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.client = apiKey ? new GoogleGenerativeAI(apiKey) : null;

    if (!this.client) {
      console.info('[GeminiAIService] No API key — using rule-based parser fallback');
    }
  }

  async parseTransaction(rawMessage: string): Promise<ParsedTransaction> {
    if (!this.client) return ruleBasedParse(rawMessage);

    try {
      const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const result = await model.generateContent([SYSTEM_PROMPT, rawMessage]);
      const text = result.response.text().trim();
      const parsed = JSON.parse(text) as ParsedTransaction;
      if (!parsed.amount || !parsed.type || !parsed.category) throw new Error('missing fields');
      return parsed;
    } catch (err) {
      console.warn('[GeminiAIService] text parse failed, falling back:', err);
      return ruleBasedParse(rawMessage);
    }
  }

  async parseTransactionFromImage(base64Data: string, mimeType: string): Promise<ParsedTransaction> {
    if (!this.client) throw new Error('PARSE_FAILED');

    const model = this.client.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent([
      SYSTEM_PROMPT,
      { inlineData: { data: base64Data, mimeType } },
      'Parse this receipt/slip image into a transaction JSON.',
    ]);
    const text = result.response.text().trim();
    // Strip markdown fences if Gemini adds them
    const cleaned = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned) as ParsedTransaction;
    if (!parsed.amount || !parsed.type || !parsed.category) throw new Error('missing fields');
    return parsed;
  }
}
