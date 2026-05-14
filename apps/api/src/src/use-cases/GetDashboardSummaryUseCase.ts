import { ITransactionRepository } from '../domain/repositories/ITransactionRepository';
import { IUserRepository } from '../domain/repositories/IUserRepository';
import { DashboardSummary } from '@jod-hai/shared';
import { TransactionEntity } from '../domain/entities/TransactionEntity';

/**
 * Use-Case: GetDashboardSummaryUseCase
 *
 * Calculates the dashboard summary for the current budget cycle:
 * - Total income and expenses for the cycle
 * - Remaining balance
 * - Budget usage percentage
 * - Most recent N transactions
 */
export class GetDashboardSummaryUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly transactionRepo: ITransactionRepository,
  ) {}

  async execute(lineUserId: string): Promise<DashboardSummary> {
    const user = await this.userRepo.findByLineUserId(lineUserId);
    if (!user) throw new Error(`User not found: ${lineUserId}`);

    // Determine budget cycle window
    const { from, to } = this.getCycleRange(user.cycleStartDay);

    const [allTx, recentTx] = await Promise.all([
      this.transactionRepo.findByUserIdAndDateRange(user.id, from, to),
      this.transactionRepo.findAllByUserId(user.id),
    ]);

    const totalIncome = this.sum(allTx, 'INCOME');
    const totalExpense = this.sum(allTx, 'EXPENSE');
    const balance = totalIncome - totalExpense;
    const budget = user.budget ?? 0;
    const budgetUsedPercent = budget > 0 ? Math.min((totalExpense / budget) * 100, 100) : 0;

    const byCategory: Record<string, number> = {};
    for (const tx of allTx) {
      if (tx.type === 'EXPENSE') byCategory[tx.category] = (byCategory[tx.category] ?? 0) + tx.amount;
    }

    const recentTransactions = recentTx.slice(0, 10).map(this.toShared);

    return { totalIncome, totalExpense, balance, budgetUsedPercent, byCategory, recentTransactions };
  }

  private getCycleRange(cycleStartDay: number): { from: Date; to: Date } {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    let from: Date;
    let to: Date;

    if (now.getDate() >= cycleStartDay) {
      from = new Date(year, month, cycleStartDay);
      to = new Date(year, month + 1, cycleStartDay);
    } else {
      from = new Date(year, month - 1, cycleStartDay);
      to = new Date(year, month, cycleStartDay);
    }

    return { from, to };
  }

  private sum(txs: TransactionEntity[], type: 'INCOME' | 'EXPENSE'): number {
    return txs.filter((t) => t.type === type).reduce((acc, t) => acc + t.amount, 0);
  }

  private toShared(tx: TransactionEntity) {
    return {
      id: tx.id,
      userId: tx.userId,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      note: tx.note,
      createdAt: tx.createdAt,
    };
  }
}
