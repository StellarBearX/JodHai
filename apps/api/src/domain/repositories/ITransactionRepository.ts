import { TransactionEntity } from '../entities/TransactionEntity';
import { CreateTransactionDTO } from '@jod-hai/shared';

/**
 * Domain Layer: Transaction Repository Interface (Port)
 * Defines the contract that any persistence adapter must satisfy.
 * The use-cases depend only on this interface, never on Prisma directly.
 */
export interface ITransactionRepository {
  /** Find a single transaction by its ID */
  findById(id: string): Promise<TransactionEntity | null>;

  /** Retrieve all transactions belonging to a user, newest first */
  findAllByUserId(userId: string): Promise<TransactionEntity[]>;

  /**
   * Retrieve transactions for a user within a date range.
   * Used for budget-cycle calculations.
   */
  findByUserIdAndDateRange(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<TransactionEntity[]>;

  /** Persist a new transaction */
  create(data: CreateTransactionDTO): Promise<TransactionEntity>;

  /** Remove a transaction by ID */
  deleteById(id: string): Promise<void>;
}
