import { PrismaClient } from '@prisma/client';
import { ITransactionRepository, MonthlyStats } from '../../domain/repositories/ITransactionRepository';
import { TransactionEntity } from '../../domain/entities/TransactionEntity';
import { CreateTransactionDTO } from '@jod-hai/shared';
import { v4 as uuidv4 } from 'uuid';

export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<TransactionEntity | null> {
    const r = await this.db.transaction.findUnique({ where: { id } });
    return r ? this.toEntity(r) : null;
  }

  async findAllByUserId(userId: string): Promise<TransactionEntity[]> {
    const records = await this.db.transaction.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
    return records.map(this.toEntity);
  }

  async findRecentByUserId(userId: string, limit: number): Promise<TransactionEntity[]> {
    const records = await this.db.transaction.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: limit });
    return records.map(this.toEntity);
  }

  async findByUserIdAndDateRange(userId: string, from: Date, to: Date): Promise<TransactionEntity[]> {
    const records = await this.db.transaction.findMany({ where: { userId, createdAt: { gte: from, lt: to } }, orderBy: { createdAt: 'desc' } });
    return records.map(this.toEntity);
  }

  async create(data: CreateTransactionDTO): Promise<TransactionEntity> {
    const r = await this.db.transaction.create({ data: { id: uuidv4(), userId: data.userId, amount: data.amount, type: data.type, category: data.category, note: data.note } });
    return this.toEntity(r);
  }

  async updateById(id: string, data: Partial<{ amount: number; type: 'INCOME' | 'EXPENSE'; category: string; note: string }>): Promise<TransactionEntity> {
    const r = await this.db.transaction.update({ where: { id }, data });
    return this.toEntity(r);
  }

  async deleteById(id: string): Promise<void> {
    await this.db.transaction.delete({ where: { id } });
  }

  async getMonthlyStats(userId: string, year: number, month: number): Promise<MonthlyStats> {
    const from = new Date(year, month - 1, 1);
    const to   = new Date(year, month, 1);
    const records = await this.db.transaction.findMany({ where: { userId, createdAt: { gte: from, lt: to } } });

    let totalIncome = 0, totalExpense = 0;
    const byCategory: Record<string, number> = {};

    for (const r of records) {
      if (r.type === 'INCOME') {
        totalIncome += r.amount;
      } else {
        totalExpense += r.amount;
        byCategory[r.category] = (byCategory[r.category] ?? 0) + r.amount;
      }
    }

    return { totalIncome, totalExpense, balance: totalIncome - totalExpense, byCategory, txCount: records.length };
  }

  private toEntity(r: { id: string; userId: string; amount: number; type: string; category: string; note: string | null; createdAt: Date }): TransactionEntity {
    return new TransactionEntity(r.id, r.userId, r.amount, r.type as 'INCOME' | 'EXPENSE', r.category, r.createdAt, r.note ?? undefined);
  }
}
