import { TrainingCaseEntity } from '../entities/TrainingCaseEntity';

export interface ITrainingCaseRepository {
  findAllByUserId(userId: string): Promise<TrainingCaseEntity[]>;
  upsert(data: { userId: string; keyword: string; category: string; type: 'INCOME' | 'EXPENSE' }): Promise<TrainingCaseEntity>;
  deleteById(id: string): Promise<void>;
}
