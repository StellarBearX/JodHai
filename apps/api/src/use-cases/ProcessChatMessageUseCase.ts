import { ITransactionRepository } from '../domain/repositories/ITransactionRepository';
import { IUserRepository } from '../domain/repositories/IUserRepository';
import { TransactionEntity } from '../domain/entities/TransactionEntity';
import { ClaudeAIService, ParsedTransaction } from '../infrastructure/ai/ClaudeAIService';

/**
 * Use-Case: ProcessChatMessageUseCase
 *
 * Orchestrates the flow when a LINE user sends a chat message:
 * 1. Ensures the user exists in the DB (upsert).
 * 2. Sends the raw text to Claude for NLP parsing.
 * 3. Persists the resulting Transaction(s).
 * 4. Returns a human-readable reply string.
 */
export class ProcessChatMessageUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly aiService: ClaudeAIService,
  ) {}

  async execute(
    lineUserId: string,
    displayName: string,
    rawMessage: string,
  ): Promise<string> {
    // 1. Ensure user record exists
    const user = await this.userRepo.upsertByLineUserId(lineUserId, displayName);

    // 2. Ask Claude to parse the message into structured data
    let parsed: ParsedTransaction;
    try {
      parsed = await this.aiService.parseTransaction(rawMessage);
    } catch {
      return `ขอโทษนะ 😅 ไม่เข้าใจข้อความนี้ ลองพิมพ์ใหม่แบบ เช่น "กาแฟ 65" หรือ "รับเงินเดือน 20000"`;
    }

    // 3. Persist
    const tx = await this.transactionRepo.create({
      userId: user.id,
      amount: parsed.amount,
      type: parsed.type,
      category: parsed.category,
      note: parsed.note,
    });

    // 4. Build reply
    const emoji = tx.type === 'EXPENSE' ? '💸' : '💰';
    const label = tx.type === 'EXPENSE' ? 'จ่าย' : 'รับ';
    return `${emoji} บันทึกแล้ว!\n${label}: ${tx.amount.toLocaleString('th-TH')} บาท\nหมวด: ${tx.category}${tx.note ? `\nโน้ต: ${tx.note}` : ''}`;
  }
}
