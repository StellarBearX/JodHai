import { TransactionEntity } from '../entities/TransactionEntity';
import { CreateTransactionDTO } from '@jod-hai/shared';

export interface MonthlyStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: Record<string, number>;
  txCount: number;
}

export interface ITransactionRepository {
  findById(id: string): Promise<TransactionEntity | null>;
  findAllByUserId(userId: string): Promise<TransactionEntity[]>;
  findRecentByUserId(userId: string, limit: number): Promise<TransactionEntity[]>;
  findByUserIdAndDateRange(userId: string, from: Date, to: Date): Promise<TransactionEntity[]>;
  create(data: CreateTransactionDTO): Promise<TransactionEntity>;
  updateById(id: string, data: Partial<{ amount: number; type: 'INCOME' | 'EXPENSE'; category: string; note: string }>): Promise<TransactionEntity>;
  deleteById(id: string): Promise<void>;
  getMonthlyStats(userId: string, year: number, month: number): Promise<MonthlyStats>;
}
