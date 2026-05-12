/**
 * @jod-hai/shared
 * Core domain interfaces shared across the Jod-Hai monorepo.
 */

// ─── User ────────────────────────────────────────────────────────────────────

/**
 * Represents a registered Jod-Hai user linked to a LINE account.
 */
export interface User {
  /** Internal UUID primary key */
  id: string;
  /** LINE user ID (e.g. U1234…) */
  lineUserId: string;
  /** Display name pulled from LINE profile */
  displayName: string;
  /** Optional monthly budget amount in THB */
  budget?: number;
  /**
   * Day of month the budget cycle resets (1–28).
   * Defaults to 1 (first of every month).
   */
  cycleStartDay: number;
}

// ─── Transaction ─────────────────────────────────────────────────────────────

export type TransactionType = 'INCOME' | 'EXPENSE';

/**
 * Represents a single financial transaction recorded by the user.
 */
export interface Transaction {
  /** Internal UUID primary key */
  id: string;
  /** FK → User.id */
  userId: string;
  /** Monetary amount in THB (always positive) */
  amount: number;
  /** Whether this is income or an expense */
  type: TransactionType;
  /** Category tag (e.g. "Food", "Transport", "Salary") */
  category: string;
  /** Optional free-text note from the user */
  note?: string;
  /** ISO 8601 timestamp of when the transaction was created */
  createdAt: Date;
}

// ─── DTO Helpers ─────────────────────────────────────────────────────────────

/** Payload used when creating a new Transaction (omit server-generated fields) */
export type CreateTransactionDTO = Omit<Transaction, 'id' | 'createdAt'>;

// ─── TrainingCase ─────────────────────────────────────────────────────────────

export interface TrainingCase {
  id: string;
  userId: string;
  keyword: string;
  category: string;
  type: TransactionType;
  createdAt: Date;
}

/** Dashboard summary returned by the API */
export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  budgetUsedPercent: number;
  recentTransactions: Transaction[];
}
