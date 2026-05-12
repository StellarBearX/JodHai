import { UserEntity } from '../entities/UserEntity';

/**
 * Domain Layer: User Repository Interface (Port)
 */
export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByLineUserId(lineUserId: string): Promise<UserEntity | null>;
  /** Upsert: create if not exists, update displayName otherwise */
  upsertByLineUserId(
    lineUserId: string,
    displayName: string,
  ): Promise<UserEntity>;
  updateBudget(userId: string, budget: number, cycleStartDay: number): Promise<UserEntity>;
}
