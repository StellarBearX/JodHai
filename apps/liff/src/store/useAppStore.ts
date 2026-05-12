import { create } from 'zustand';
import type { DashboardSummary, Transaction, User } from '@jod-hai/shared';
import {
  fetchDashboardSummary,
  fetchTransactions,
  fetchUser,
  updateUserSettings,
  deleteTransaction,
  DEV_LINE_USER_ID,
  DEV_DISPLAY_NAME,
} from '../services/api';

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AppState {
  // ── Auth ──────────────────────────────────────────────────────────────────
  user: Pick<User, 'lineUserId' | 'displayName'> | null;
  userProfile: User | null;
  isLiffReady: boolean;
  setUser: (user: Pick<User, 'lineUserId' | 'displayName'> | null) => void;
  setLiffReady: (ready: boolean) => void;

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: DashboardSummary | null;
  isLoadingDashboard: boolean;
  dashboardError: string | null;
  loadDashboard: () => Promise<void>;

  // ── Transactions ──────────────────────────────────────────────────────────
  transactions: Transaction[];
  isLoadingTransactions: boolean;
  loadTransactions: () => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;

  // ── User Settings ─────────────────────────────────────────────────────────
  loadUserProfile: () => Promise<void>;
  saveUserSettings: (settings: { budget?: number; cycleStartDay?: number }) => Promise<void>;
  isSavingSettings: boolean;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────────────────────
  user: null,
  userProfile: null,
  isLiffReady: false,
  setUser: (user) => set({ user }),
  setLiffReady: (ready) => set({ isLiffReady: ready }),

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: null,
  isLoadingDashboard: false,
  dashboardError: null,
  loadDashboard: async () => {
    const { user } = get();
    if (!user) return;
    set({ isLoadingDashboard: true, dashboardError: null });
    try {
      const data = await fetchDashboardSummary(user.lineUserId);
      // Rehydrate Date objects from JSON strings
      data.recentTransactions = data.recentTransactions.map((tx) => ({
        ...tx,
        createdAt: new Date(tx.createdAt),
      }));
      set({ dashboard: data });
    } catch (err) {
      set({ dashboardError: 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่' });
      console.error('[Store] loadDashboard:', err);
    } finally {
      set({ isLoadingDashboard: false });
    }
  },

  // ── Transactions ──────────────────────────────────────────────────────────
  transactions: [],
  isLoadingTransactions: false,
  loadTransactions: async () => {
    const { user } = get();
    if (!user) return;
    set({ isLoadingTransactions: true });
    try {
      const txs = await fetchTransactions(user.lineUserId);
      set({
        transactions: txs.map((tx) => ({ ...tx, createdAt: new Date(tx.createdAt) })),
      });
    } catch (err) {
      console.error('[Store] loadTransactions:', err);
    } finally {
      set({ isLoadingTransactions: false });
    }
  },
  removeTransaction: async (id) => {
    const { user } = get();
    if (!user) return;
    // Optimistic remove
    set((s) => ({ transactions: s.transactions.filter((tx) => tx.id !== id) }));
    try {
      await deleteTransaction(user.lineUserId, id);
      // Refresh dashboard counts
      get().loadDashboard();
    } catch (err) {
      console.error('[Store] removeTransaction:', err);
      // Rollback would reload from server
      get().loadTransactions();
    }
  },

  // ── User Settings ─────────────────────────────────────────────────────────
  loadUserProfile: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const profile = await fetchUser(user.lineUserId);
      set({ userProfile: profile });
    } catch (err) {
      console.error('[Store] loadUserProfile:', err);
    }
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
}));
