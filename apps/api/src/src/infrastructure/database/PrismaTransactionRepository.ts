import { PrismaClient } from '@prisma/client';
import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';
import { TransactionEntity } from '../../domain/entities/TransactionEntity';
import { CreateTransactionDTO } from '@jod-hai/shared';
import { v4 as uuidv4 } from 'uuid';

/**
 * Infrastructure: Prisma implementation of ITransactionRepository (Adapter)
 */
export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<TransactionEntity | null> {
    const record = await this.db.transaction.findUnique({ where: { id } });
    return record ? this.toEntity(record) : null;
  }

  async findAllByUserId(userId: string): Promise<TransactionEntity[]> {
    const records = await this.db.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(this.toEntity);
  }

  async findByUserIdAndDateRange(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<TransactionEntity[]> {
    const records = await this.db.transaction.findMany({
      where: {
        userId,
        createdAt: { gte: from, lt: to },
      },
      orderBy: { createdAt: 'desc' },
    });
    return records.map(this.toEntity);
  }

  async create(data: CreateTransactionDTO): Promise<TransactionEntity> {
    const record = await this.db.transaction.create({
      data: {
        id: uuidv4(),
        userId: data.userId,
        amount: data.amount,
        type: data.type,
        category: data.category,
        note: data.note,
      },
    });
    return this.toEntity(record);
  }

  async updateById(id: string, data: Partial<{ amount: number; type: 'INCOME' | 'EXPENSE'; category: string; note: string }>): Promise<TransactionEntity> {
    const record = await this.db.transaction.update({ where: { id }, data });
    return this.toEntity(record);
  }

  async deleteById(id: string): Promise<void> {
    await this.db.transaction.delete({ where: { id } });
  }

  private toEntity(record: {
    id: string;
    userId: string;
    amount: number;
    type: string;
    category: string;
    note: string | null;
    createdAt: Date;
  }): TransactionEntity {
    return new TransactionEntity(
      record.id,
      record.userId,
      record.amount,
      record.type as 'INCOME' | 'EXPENSE',
      record.category,
      record.createdAt,
      record.note ?? undefined,
    );
  }
}
