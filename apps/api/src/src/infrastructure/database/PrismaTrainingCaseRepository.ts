import { PrismaClient } from '@prisma/client';
import { ITrainingCaseRepository } from '../../domain/repositories/ITrainingCaseRepository';
import { TrainingCaseEntity } from '../../domain/entities/TrainingCaseEntity';

export class PrismaTrainingCaseRepository implements ITrainingCaseRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAllByUserId(userId: string): Promise<TrainingCaseEntity[]> {
    const rows = await this.prisma.trainingCase.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r: { id: string; userId: string; keyword: string; category: string; type: 'INCOME' | 'EXPENSE'; createdAt: Date }) => new TrainingCaseEntity(r.id, r.userId, r.keyword, r.category, r.type, r.createdAt));
  }

  async upsert(data: { userId: string; keyword: string; category: string; type: 'INCOME' | 'EXPENSE' }): Promise<TrainingCaseEntity> {
    const row = await this.prisma.trainingCase.upsert({
      where: { userId_keyword: { userId: data.userId, keyword: data.keyword } },
      update: { category: data.category, type: data.type },
      create: data,
    });
    return new TrainingCaseEntity(row.id, row.userId, row.keyword, row.category, row.type, row.createdAt);
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.trainingCase.delete({ where: { id } });
  }
}
