import axios from 'axios';
import type { DashboardSummary, Transaction } from '@jod-hai/shared';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach LINE access token on every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('line_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── API Functions ────────────────────────────────────────────────────────────

export async function fetchDashboardSummary(lineUserId: string): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>('/api/dashboard', {
    params: { lineUserId },
  });
  return data;
}

export async function fetchTransactions(lineUserId: string): Promise<Transaction[]> {
  const { data } = await api.get<Transaction[]>('/api/transactions', {
    params: { lineUserId },
  });
  return data;
}

export default api;
