import { create } from 'zustand';
import type { CategoryBudget, DashboardSummary, Transaction, TrainingCase, User } from '@jod-hai/shared';
import {
  fetchDashboardSummary,
  fetchTransactions,
  fetchUser,
  updateUserSettings,
  deleteTransaction,
  updateTransaction,
  fetchTrainingCases,
  upsertTrainingCase,
  deleteTrainingCase,
  fetchCategoryBudgets,
  saveCategoryBudgets,
} from '../services/api';

interface AppState {
  user: Pick<User, 'lineUserId' | 'displayName'> | null;
  userProfile: User | null;
  isReady: boolean;
  setUser: (user: Pick<User, 'lineUserId' | 'displayName'> | null) => void;
  setReady: (ready: boolean) => void;

  dashboard: DashboardSummary | null;
  isLoadingDashboard: boolean;
  dashboardError: string | null;
  loadDashboard: () => Promise<void>;

  transactions: Transaction[];
  isLoadingTransactions: boolean;
  loadTransactions: () => Promise<void>;
  editTransaction: (id: string, data: { amount?: number; type?: 'INCOME' | 'EXPENSE'; category?: string; note?: string }) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;

  loadUserProfile: () => Promise<void>;
  saveUserSettings: (settings: { budget?: number; cycleStartDay?: number; budgetPeriod?: string }) => Promise<void>;
  isSavingSettings: boolean;

  categoryBudgets: CategoryBudget[];
  isLoadingBudgets: boolean;
  loadCategoryBudgets: () => Promise<void>;
  saveCategoryBudgetsAction: (budgets: CategoryBudget[]) => Promise<void>;

  trainingCases: TrainingCase[];
  isLoadingTrainingCases: boolean;
  loadTrainingCases: () => Promise<void>;
  saveTrainingCase: (tc: { keyword: string; category: string; type: 'INCOME' | 'EXPENSE' }) => Promise<void>;
  removeTrainingCase: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  userProfile: null,
  isReady: false,
  setUser: (user) => set({ user }),
  setReady: (ready) => set({ isReady: ready }),

  dashboard: null,
  isLoadingDashboard: false,
  dashboardError: null,
  loadDashboard: async () => {
    const { user } = get();
    if (!user) return;
    set({ isLoadingDashboard: true, dashboardError: null });
    try {
      const data = await fetchDashboardSummary(user.lineUserId);
      data.recentTransactions = data.recentTransactions.map((tx) => ({
        ...tx,
        createdAt: new Date(tx.createdAt),
      }));
      set({ dashboard: data });
    } catch {
      set({ dashboardError: 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่' });
    } finally {
      set({ isLoadingDashboard: false });
    }
  },

  transactions: [],
  isLoadingTransactions: false,
  loadTransactions: async () => {
    const { user } = get();
    if (!user) return;
    set({ isLoadingTransactions: true });
    try {
      const txs = await fetchTransactions(user.lineUserId);
      set({ transactions: txs.map((tx) => ({ ...tx, createdAt: new Date(tx.createdAt) })) });
    } finally {
      set({ isLoadingTransactions: false });
    }
  },
  editTransaction: async (id, data) => {
    const tx = await updateTransaction(id, data);
    set((s) => ({
      transactions: s.transactions.map((t) => t.id === id ? { ...tx, createdAt: new Date(tx.createdAt) } : t),
    }));
    get().loadDashboard();
  },
  removeTransaction: async (id) => {
    const { user } = get();
    if (!user) return;
    set((s) => ({ transactions: s.transactions.filter((tx) => tx.id !== id) }));
    try {
      await deleteTransaction(user.lineUserId, id);
      get().loadDashboard();
    } catch {
      get().loadTransactions();
    }
  },

  loadUserProfile: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const profile = await fetchUser(user.lineUserId);
      set({ userProfile: profile });
    } catch {}
  },
  isSavingSettings: false,
  saveUserSettings: async (settings) => {
    const { user } = get();
    if (!user) return;
    set({ isSavingSettings: true });
    try {
      const updated = await updateUserSettings(user.lineUserId, settings);
      set({ userProfile: updated });
    } finally {
      set({ isSavingSettings: false });
    }
  },

  categoryBudgets: [],
  isLoadingBudgets: false,
  loadCategoryBudgets: async () => {
    const { user } = get();
    if (!user) return;
    set({ isLoadingBudgets: true });
    try {
      const budgets = await fetchCategoryBudgets(user.lineUserId);
      set({ categoryBudgets: budgets });
    } finally {
      set({ isLoadingBudgets: false });
    }
  },
  saveCategoryBudgetsAction: async (budgets) => {
    const { user } = get();
    if (!user) return;
    await saveCategoryBudgets(user.lineUserId, budgets);
    set({ categoryBudgets: budgets });
  },

  trainingCases: [],
  isLoadingTrainingCases: false,
  loadTrainingCases: async () => {
    const { user } = get();
    if (!user) return;
    set({ isLoadingTrainingCases: true });
    try {
      const cases = await fetchTrainingCases(user.lineUserId);
      set({ trainingCases: cases.map((tc) => ({ ...tc, createdAt: new Date(tc.createdAt) })) });
    } finally {
      set({ isLoadingTrainingCases: false });
    }
  },
  saveTrainingCase: async (tc) => {
    const { user } = get();
    if (!user) return;
    const saved = await upsertTrainingCase(user.lineUserId, tc);
    set((s) => {
      const idx = s.trainingCases.findIndex((t) => t.keyword === saved.keyword);
      const entry = { ...saved, createdAt: new Date(saved.createdAt) };
      if (idx >= 0) {
        const updated = [...s.trainingCases];
        updated[idx] = entry;
        return { trainingCases: updated };
      }
      return { trainingCases: [entry, ...s.trainingCases] };
    });
  },
  removeTrainingCase: async (id) => {
    set((s) => ({ trainingCases: s.trainingCases.filter((tc) => tc.id !== id) }));
    await deleteTrainingCase(id);
  },
}));
