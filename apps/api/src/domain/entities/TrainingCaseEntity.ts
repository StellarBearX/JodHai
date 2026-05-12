export class TrainingCaseEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly keyword: string,
    public readonly category: string,
    public readonly type: 'INCOME' | 'EXPENSE',
    public readonly createdAt: Date,
  ) {}
}
