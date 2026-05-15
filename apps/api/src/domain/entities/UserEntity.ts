export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly lineUserId: string,
    public readonly displayName: string,
    public readonly cycleStartDay: number = 1,
    public readonly budget?: number,
    public readonly budgetPeriod: string = 'monthly',
  ) {
    if (cycleStartDay < 1 || cycleStartDay > 28) {
      throw new Error('cycleStartDay must be between 1 and 28');
    }
  }
}
