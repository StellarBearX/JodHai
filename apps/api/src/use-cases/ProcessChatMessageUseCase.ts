import { ITransactionRepository } from '../domain/repositories/ITransactionRepository';
import { IUserRepository } from '../domain/repositories/IUserRepository';
import { ITrainingCaseRepository } from '../domain/repositories/ITrainingCaseRepository';
import { IChatLogRepository } from '../domain/repositories/IChatLogRepository';
import { TransactionEntity } from '../domain/entities/TransactionEntity';
import { UserEntity } from '../domain/entities/UserEntity';
import { GeminiAIService } from '../infrastructure/ai/GeminiAIService';
import { conversationStore } from '../infrastructure/conversation/ConversationStore';

export type UseCaseResult =
  | { kind: 'transaction'; transaction: TransactionEntity; user: UserEntity; usedTraining: boolean; autoLearned: boolean; message: string; emotion: string }
  | { kind: 'question'; question: string };

export class ProcessChatMessageUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly trainingCaseRepo: ITrainingCaseRepository,
    private readonly aiService: GeminiAIService,
    private readonly chatLogRepo: IChatLogRepository,
  ) {}

  async execute(
    lineUserId: string,
    displayName: string,
    rawMessage: string,
    imageBase64?: string,
    imageMimeType?: string,
  ): Promise<UseCaseResult> {
    const user = await this.userRepo.upsertByLineUserId(lineUserId, displayName);

    // Save user message to chat log
    if (imageBase64) {
      await this.chatLogRepo.save({ userId: user.id, role: 'user', kind: 'image', content: JSON.stringify({ text: '[ส่งรูปใบเสร็จ]' }) });
    } else if (rawMessage) {
      await this.chatLogRepo.save({ userId: user.id, role: 'user', kind: 'text', content: JSON.stringify({ text: rawMessage }) });
    }

    // 1. Check training cases (text only, first turn)
    if (!imageBase64) {
      const history = conversationStore.getHistory(lineUserId);
      if (history.length === 0) {
        const trainingCases = await this.trainingCaseRepo.findAllByUserId(user.id);
        const lower = rawMessage.toLowerCase();
        const matched = trainingCases.find((tc) => lower.includes(tc.keyword.toLowerCase()));

        if (matched) {
          const amountMatch = rawMessage.match(/(\d[\d,]*\.?\d*)/);
          const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;
          if (amount && amount > 0) {
            const note = rawMessage.replace(/\d[\d,]*\.?\d*/g, '').replace(/บาท|thb|฿/gi, '').trim() || undefined;
            const transaction = await this.transactionRepo.create({ userId: user.id, amount, type: matched.type, category: matched.category, note });
            conversationStore.clear(lineUserId);
            const trainingMsg = `เรียบร้อยค่า! ⚡ จดให้รู้จัก "${matched.keyword}" แล้ว ไม่ต้องโทร AI เลย~`;
            await this.chatLogRepo.save({ userId: user.id, role: 'bot', kind: 'tx', content: JSON.stringify({ transaction: this.txToJson(transaction) }) });
            return { kind: 'transaction', transaction, user, usedTraining: true, autoLearned: false, message: trainingMsg, emotion: 'happy' };
          }
        }
      }
    }

    // 2. Call Gemini
    try {
      let response;
      if (imageBase64 && imageMimeType) {
        conversationStore.clear(lineUserId);
        response = await this.aiService.parseFromImage(imageBase64, imageMimeType);
      } else {
        const history = conversationStore.getHistory(lineUserId);
        // Pass budget context so Gemini can adjust tone
        const budgetPct = undefined; // future: fetch from userRepo if needed
        response = await this.aiService.chat(history, rawMessage, budgetPct);
        conversationStore.append(lineUserId, 'user', rawMessage);
      }

      if (!response.complete) {
        conversationStore.append(lineUserId, 'model', JSON.stringify({ complete: false, question: response.question }));
        await this.chatLogRepo.save({ userId: user.id, role: 'bot', kind: 'text', content: JSON.stringify({ text: response.question }) });
        return { kind: 'question', question: response.question };
      }

      conversationStore.clear(lineUserId);
      const tx = response.transaction;
      const transaction = await this.transactionRepo.create({ userId: user.id, amount: tx.amount, type: tx.type, category: tx.category, note: tx.note });
      const autoLearned = await this.tryAutoLearn(user.id, tx.note, tx.category, tx.type);
      const botMessage = response.complete ? response.message : 'เรียบร้อยค่า! ✅';
      const emotion = response.complete ? response.emotion : 'happy';
      await this.chatLogRepo.save({ userId: user.id, role: 'bot', kind: 'tx', content: JSON.stringify({ transaction: this.txToJson(transaction), autoLearned, message: botMessage }) });
      return { kind: 'transaction', transaction, user, usedTraining: false, autoLearned, message: botMessage, emotion };
    } catch {
      conversationStore.clear(lineUserId);
      throw new Error('PARSE_FAILED');
    }
  }

  private txToJson(tx: TransactionEntity) {
    return { id: tx.id, userId: tx.userId, amount: tx.amount, type: tx.type, category: tx.category, note: tx.note, createdAt: tx.createdAt };
  }

  private async tryAutoLearn(userId: string, note: string | undefined, category: string, type: 'INCOME' | 'EXPENSE'): Promise<boolean> {
    if (!note) return false;
    const clean = note.trim();
    if (clean.length < 2 || clean.length > 15 || /\d/.test(clean)) return false;
    try {
      await this.trainingCaseRepo.upsert({ userId, keyword: clean.toLowerCase(), category, type });
      return true;
    } catch { return false; }
  }
}
