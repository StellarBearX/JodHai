import { ITransactionRepository } from '../domain/repositories/ITransactionRepository';
import { IUserRepository } from '../domain/repositories/IUserRepository';

/**
 * Use-Case: DeleteTransactionUseCase
 */
export class DeleteTransactionUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly transactionRepo: ITransactionRepository,
  ) {}

  async execute(lineUserId: string, transactionId: string): Promise<void> {
    const user = await this.userRepo.findByLineUserId(lineUserId);
    if (!user) throw new Error(`User not found: ${lineUserId}`);

    const tx = await this.transactionRepo.findById(transactionId);
    if (!tx) throw new Error(`Transaction not found: ${transactionId}`);
    if (tx.userId !== user.id) throw new Error('Forbidden: transaction belongs to another user');

    await this.transactionRepo.deleteById(transactionId);
  }
}
