export interface User {
  id: string;
  lineUserId: string;
  displayName: string;
  budget?: number;
  cycleStartDay: number;
}

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  category: string;
  note?: string;
  createdAt: Date;
}

export type CreateTransactionDTO = Omit<Transaction, 'id' | 'createdAt'>;

export interface TrainingCase {
  id: string;
  userId: string;
  keyword: string;
  category: string;
  type: TransactionType;
  createdAt: Date;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  budgetUsedPercent: number;
  recentTransactions: Transaction[];
}

export interface ChatLogEntry {
  id: string;
  userId: string;
  role: 'user' | 'bot';
  kind: 'text' | 'tx' | 'image';
  content: { text?: string; transaction?: Transaction; autoLearned?: boolean };
  createdAt: Date;
}
