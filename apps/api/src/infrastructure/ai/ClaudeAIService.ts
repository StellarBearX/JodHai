import Anthropic from '@anthropic-ai/sdk';
import { TransactionType } from '@jod-hai/shared';

export interface ParsedTransaction {
  amount: number;
  type: TransactionType;
  category: string;
  note?: string;
}

const SYSTEM_PROMPT = `You are an expense-tracking assistant for a Thai LINE chatbot called Jod-Hai (จดให้).
Your job is to parse a user's Thai or English message into a structured JSON object.

Rules:
- "amount" must be a positive number (THB).
- "type" is "EXPENSE" for purchases/payments, "INCOME" for salary/income.
- "category" should be one of: Food, Transport, Shopping, Health, Entertainment, Bills, Salary, Other.
- "note" is optional extra context.
- Respond ONLY with a valid JSON object. No explanation, no markdown.

Example output:
{"amount": 65, "type": "EXPENSE", "category": "Food", "note": "ชานมไข่มุก"}`;

/**
 * Infrastructure: ClaudeAIService
 * Wraps the Anthropic Claude 3 Haiku model for transaction NLP parsing.
 */
export class ClaudeAIService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async parseTransaction(rawMessage: string): Promise<ParsedTransaction> {
    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: rawMessage }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('Empty response from Claude');
    }

    const parsed = JSON.parse(textBlock.text.trim()) as ParsedTransaction;
    // Basic validation
    if (!parsed.amount || !parsed.type || !parsed.category) {
      throw new Error('Claude response missing required fields');
    }
    return parsed;
  }
}
