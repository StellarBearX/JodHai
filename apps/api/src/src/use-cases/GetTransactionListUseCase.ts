import { ITransactionRepository } from '../domain/repositories/ITransactionRepository';
import { IUserRepository } from '../domain/repositories/IUserRepository';
import { Transaction } from '@jod-hai/shared';

/**
 * Use-Case: GetTransactionListUseCase
 * Returns paginated transactions for a user, optionally filtered by date range.
 */
export class GetTransactionListUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly transactionRepo: ITransactionRepository,
  ) {}

  async execute(
    lineUserId: string,
    options: { from?: Date; to?: Date; limit?: number } = {},
  ): Promise<Transaction[]> {
    const user = await this.userRepo.findByLineUserId(lineUserId);
    if (!user) throw new Error(`User not found: ${lineUserId}`);

    const txs =
      options.from && options.to
        ? await this.transactionRepo.findByUserIdAndDateRange(user.id, options.from, options.to)
        : await this.transactionRepo.findAllByUserId(user.id);

    const result = options.limit ? txs.slice(0, options.limit) : txs;

    return result.map((tx) => ({
      id: tx.id,
      userId: tx.userId,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      note: tx.note,
      createdAt: tx.createdAt,
    }));
  }
}
