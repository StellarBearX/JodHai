import { PrismaClient } from '@prisma/client';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UserEntity } from '../../domain/entities/UserEntity';
import { v4 as uuidv4 } from 'uuid';

/**
 * Infrastructure: Prisma implementation of IUserRepository (Adapter)
 */
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<UserEntity | null> {
    const record = await this.db.user.findUnique({ where: { id } });
    return record ? this.toEntity(record) : null;
  }

  async findByLineUserId(lineUserId: string): Promise<UserEntity | null> {
    const record = await this.db.user.findUnique({ where: { lineUserId } });
    return record ? this.toEntity(record) : null;
  }

  async upsertByLineUserId(lineUserId: string, displayName: string): Promise<UserEntity> {
    const record = await this.db.user.upsert({
      where: { lineUserId },
      update: { displayName },
      create: {
        id: uuidv4(),
        lineUserId,
        displayName,
        cycleStartDay: 1,
      },
    });
    return this.toEntity(record);
  }

  async updateBudget(userId: string, budget: number, cycleStartDay: number): Promise<UserEntity> {
    const record = await this.db.user.update({
      where: { id: userId },
      data: { budget, cycleStartDay },
    });
    return this.toEntity(record);
  }

  private toEntity(record: {
    id: string;
    lineUserId: string;
    displayName: string;
    budget: number | null;
    cycleStartDay: number;
  }): UserEntity {
    return new UserEntity(
      record.id,
      record.lineUserId,
      record.displayName,
      record.cycleStartDay,
      record.budget ?? undefined,
    );
  }
}
