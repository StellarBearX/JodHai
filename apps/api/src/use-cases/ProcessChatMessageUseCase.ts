import { ITransactionRepository } from '../domain/repositories/ITransactionRepository';
import { IUserRepository } from '../domain/repositories/IUserRepository';
import { ITrainingCaseRepository } from '../domain/repositories/ITrainingCaseRepository';
import { TransactionEntity } from '../domain/entities/TransactionEntity';
import { UserEntity } from '../domain/entities/UserEntity';
import { GeminiAIService } from '../infrastructure/ai/GeminiAIService';
import { conversationStore } from '../infrastructure/conversation/ConversationStore';

export type UseCaseResult =
  | { kind: 'transaction'; transaction: TransactionEntity; user: UserEntity; usedTraining: boolean; autoLearned: boolean }
  | { kind: 'question'; question: string };

export class ProcessChatMessageUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly trainingCaseRepo: ITrainingCaseRepository,
    private readonly aiService: GeminiAIService,
  ) {}

  async execute(
    lineUserId: string,
    displayName: string,
    rawMessage: string,
    imageBase64?: string,
    imageMimeType?: string,
  ): Promise<UseCaseResult> {
    const user = await this.userRepo.upsertByLineUserId(lineUserId, displayName);

    // 1. Check training cases (text only, no image, no pending conversation)
    if (!imageBase64) {
      const history = conversationStore.getHistory(lineUserId);
      const isFirstTurn = history.length === 0;

      if (isFirstTurn) {
        const trainingCases = await this.trainingCaseRepo.findAllByUserId(user.id);
        const lower = rawMessage.toLowerCase();
        const matched = trainingCases.find((tc) => lower.includes(tc.keyword.toLowerCase()));

        if (matched) {
          const amountMatch = rawMessage.match(/(\d[\d,]*\.?\d*)/);
          const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;
          if (amount && amount > 0) {
            const transaction = await this.transactionRepo.create({
              userId: user.id,
              amount,
              type: matched.type,
              category: matched.category,
              note: rawMessage.replace(/\d[\d,]*\.?\d*/g, '').replace(/บาท|thb|฿/gi, '').trim() || undefined,
            });
            conversationStore.clear(lineUserId);
            return { kind: 'transaction', transaction, user, usedTraining: true, autoLearned: false };
          }
        }
      }
    }

    // 2. Call Gemini — image or conversational text
    try {
      let response;
      if (imageBase64 && imageMimeType) {
        conversationStore.clear(lineUserId);
        response = await this.aiService.parseFromImage(imageBase64, imageMimeType);
      } else {
        const history = conversationStore.getHistory(lineUserId);
        response = await this.aiService.chat(history, rawMessage);
        conversationStore.append(lineUserId, 'user', rawMessage);
      }

      if (!response.complete) {
        // Gemini is asking for more info — record its question in history
        conversationStore.append(lineUserId, 'model', JSON.stringify({ complete: false, question: response.question }));
        return { kind: 'question', question: response.question };
      }

      // Transaction is complete — clear conversation
      conversationStore.clear(lineUserId);

      const tx = response.transaction;
      const transaction = await this.transactionRepo.create({
        userId: user.id,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        note: tx.note,
      });

      // 3. Auto-learn: if note is a simple keyword, save as training case
      const autoLearned = await this.tryAutoLearn(user.id, tx.note, tx.category, tx.type);

      return { kind: 'transaction', transaction, user, usedTraining: false, autoLearned };
    } catch {
      conversationStore.clear(lineUserId);
      throw new Error('PARSE_FAILED');
    }
  }

  private async tryAutoLearn(
    userId: string,
    note: string | undefined,
    category: string,
    type: 'INCOME' | 'EXPENSE',
  ): Promise<boolean> {
    if (!note) return false;
    // Only auto-learn simple keywords: 2–15 chars, no digits, no special chars except Thai
    const clean = note.trim();
    if (clean.length < 2 || clean.length > 15) return false;
    if (/\d/.test(clean)) return false;

    try {
      await this.trainingCaseRepo.upsert({ userId, keyword: clean.toLowerCase(), category, type });
      console.info(`[AutoLearn] "${clean}" → ${category}/${type}`);
      return true;
    } catch {
      return false;
    }
  }
}
