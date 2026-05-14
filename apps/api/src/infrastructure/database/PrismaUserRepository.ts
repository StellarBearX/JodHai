import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { IUserRepository, ICategoryBudget } from '../../domain/repositories/IUserRepository';
import { UserEntity } from '../../domain/entities/UserEntity';
import { v4 as uuidv4 } from 'uuid';

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
      update: {},
      create: { id: uuidv4(), lineUserId, displayName, cycleStartDay: 1, budgetPeriod: 'monthly' },
    });
    return this.toEntity(record);
  }

  async loginOrRegister(displayName: string, pin: string): Promise<{ user: UserEntity; isNew: boolean }> {
    const existing = await this.db.user.findUnique({ where: { displayName } });

    if (existing) {
      if (!existing.pin) {
        const hashed = await bcrypt.hash(pin, 10);
        const updated = await this.db.user.update({ where: { id: existing.id }, data: { pin: hashed } });
        return { user: this.toEntity(updated), isNew: false };
      }
      const valid = await bcrypt.compare(pin, existing.pin);
      if (!valid) throw new Error('INVALID_PIN');
      return { user: this.toEntity(existing), isNew: false };
    }

    const hashed = await bcrypt.hash(pin, 10);
    const record = await this.db.user.create({
      data: { id: uuidv4(), lineUserId: 'U_' + uuidv4().replace(/-/g, '').slice(0, 10), displayName, pin: hashed, cycleStartDay: 1, budgetPeriod: 'monthly' },
    });
    return { user: this.toEntity(record), isNew: true };
  }

  async updateBudget(userId: string, budget: number, cycleStartDay: number, budgetPeriod: string): Promise<UserEntity> {
    const record = await this.db.user.update({ where: { id: userId }, data: { budget, cycleStartDay, budgetPeriod } });
    return this.toEntity(record);
  }

  async getCategoryBudgets(userId: string): Promise<ICategoryBudget[]> {
    const rows = await this.db.categoryBudget.findMany({ where: { userId } });
    return rows.map((r) => ({ category: r.category, amount: r.amount }));
  }

  async setCategoryBudgets(userId: string, budgets: ICategoryBudget[]): Promise<void> {
    await this.db.$transaction(
      budgets.map((b) =>
        this.db.categoryBudget.upsert({
          where: { userId_category: { userId, category: b.category } },
          update: { amount: b.amount },
          create: { id: uuidv4(), userId, category: b.category, amount: b.amount },
        }),
      ),
    );
  }

  private toEntity(record: { id: string; lineUserId: string; displayName: string; budget: number | null; cycleStartDay: number; budgetPeriod: string }): UserEntity {
    return new UserEntity(record.id, record.lineUserId, record.displayName, record.cycleStartDay, record.budget ?? undefined, record.budgetPeriod);
  }
}
