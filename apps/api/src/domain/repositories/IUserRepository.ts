import { UserEntity } from '../entities/UserEntity';

export interface ICategoryBudget {
  category: string;
  amount: number;
}

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByLineUserId(lineUserId: string): Promise<UserEntity | null>;
  upsertByLineUserId(lineUserId: string, displayName: string): Promise<UserEntity>;
  updateBudget(userId: string, budget: number, cycleStartDay: number, budgetPeriod: string): Promise<UserEntity>;
  getCategoryBudgets(userId: string): Promise<ICategoryBudget[]>;
  setCategoryBudgets(userId: string, budgets: ICategoryBudget[]): Promise<void>;
  loginOrRegister(displayName: string, pin: string): Promise<{ user: UserEntity; isNew: boolean }>;
}
