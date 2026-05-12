import { ITransactionRepository } from '../domain/repositories/ITransactionRepository';
import { IUserRepository } from '../domain/repositories/IUserRepository';
import { ITrainingCaseRepository } from '../domain/repositories/ITrainingCaseRepository';
import { TransactionEntity } from '../domain/entities/TransactionEntity';
import { UserEntity } from '../domain/entities/UserEntity';
import { GeminiAIService } from '../infrastructure/ai/GeminiAIService';

export interface ChatResult {
  transaction: TransactionEntity;
  user: UserEntity;
  usedTraining: boolean;
}

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
  ): Promise<ChatResult> {
    const user = await this.userRepo.upsertByLineUserId(lineUserId, displayName);

    // 1. Check training cases first (saves Gemini token)
    if (!imageBase64) {
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
          return { transaction, user, usedTraining: true };
        }
      }
    }

    // 2. Call Gemini (text or image)
    try {
      const parsed = imageBase64 && imageMimeType
        ? await this.aiService.parseTransactionFromImage(imageBase64, imageMimeType)
        : await this.aiService.parseTransaction(rawMessage);

      const transaction = await this.transactionRepo.create({
        userId: user.id,
        amount: parsed.amount,
        type: parsed.type,
        category: parsed.category,
        note: parsed.note,
      });
      return { transaction, user, usedTraining: false };
    } catch {
      throw new Error('PARSE_FAILED');
    }
  }
}
