import { create } from 'zustand';
import type { DashboardSummary, Transaction, User } from '@jod-hai/shared';
import { fetchDashboardSummary } from '../services/api';

interface AppState {
  // ── Auth ──────────────────────────────────────────────────────────────────
  user: Pick<User, 'lineUserId' | 'displayName'> | null;
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
  addTransactionOptimistic: (tx: Transaction) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // ── Auth ──────────────────────────────────────────────────────────────────
  user: null,
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
      set({ dashboard: data, transactions: data.recentTransactions });
    } catch (err) {
      set({ dashboardError: 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่' });
      console.error('[Store] loadDashboard error:', err);
    } finally {
      set({ isLoadingDashboard: false });
    }
  },

  // ── Transactions ──────────────────────────────────────────────────────────
  transactions: [],
  addTransactionOptimistic: (tx) =>
    set((state) => ({ transactions: [tx, ...state.transactions] })),
}));
