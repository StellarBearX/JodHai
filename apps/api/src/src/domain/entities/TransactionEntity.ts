/**
 * Domain Layer: Transaction Entity
 * Pure domain object — no framework dependencies.
 */
export class TransactionEntity {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly amount: number,
    public readonly type: 'INCOME' | 'EXPENSE',
    public readonly category: string,
    public readonly createdAt: Date,
    public readonly note?: string,
  ) {
    if (amount <= 0) throw new Error('Transaction amount must be positive');
    if (!category.trim()) throw new Error('Category is required');
  }

  /** Returns the signed value: positive for INCOME, negative for EXPENSE */
  get signedAmount(): number {
    return this.type === 'INCOME' ? this.amount : -this.amount;
  }
}
