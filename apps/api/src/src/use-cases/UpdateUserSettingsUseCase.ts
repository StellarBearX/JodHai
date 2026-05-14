import { IUserRepository } from '../domain/repositories/IUserRepository';
import { User } from '@jod-hai/shared';

/**
 * Use-Case: UpdateUserSettingsUseCase
 * Updates budget and cycle start day for a user.
 */
export class UpdateUserSettingsUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(
    lineUserId: string,
    settings: { budget?: number; cycleStartDay?: number; budgetPeriod?: string },
  ): Promise<User> {
    const user = await this.userRepo.findByLineUserId(lineUserId);
    if (!user) throw new Error(`User not found: ${lineUserId}`);

    const updated = await this.userRepo.updateBudget(
      user.id,
      settings.budget ?? user.budget ?? 0,
      settings.cycleStartDay ?? user.cycleStartDay,
      settings.budgetPeriod ?? user.budgetPeriod,
    );

    return {
      id: updated.id,
      lineUserId: updated.lineUserId,
      displayName: updated.displayName,
      budget: updated.budget,
      cycleStartDay: updated.cycleStartDay,
      budgetPeriod: updated.budgetPeriod as 'daily' | 'weekly' | 'monthly',
    };
  }
}
