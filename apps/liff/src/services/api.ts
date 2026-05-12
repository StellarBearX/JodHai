import axios from 'axios';
import type { DashboardSummary, Transaction, User } from '@jod-hai/shared';

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

// ─── Dev default user ─────────────────────────────────────────────────────────
export const DEV_LINE_USER_ID = 'U_dev_mock';
export const DEV_DISPLAY_NAME = 'นักพัฒนา';

// ─── API Functions ────────────────────────────────────────────────────────────

export async function fetchDashboardSummary(lineUserId: string): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>('/api/dashboard', {
    params: { lineUserId },
  });
  return data;
}

export async function fetchTransactions(
  lineUserId: string,
  options: { from?: string; to?: string; limit?: number } = {},
): Promise<Transaction[]> {
  const { data } = await api.get<Transaction[]>('/api/transactions', {
    params: { lineUserId, ...options },
  });
  return data;
}

export async function sendChatMessage(
  lineUserId: string,
  displayName: string,
  message: string,
): Promise<string> {
  const { data } = await api.post<{ reply: string }>('/api/chat', {
    lineUserId,
    displayName,
    message,
  });
  return data.reply;
}

export async function fetchUser(lineUserId: string): Promise<User> {
  const { data } = await api.get<User>('/api/user', { params: { lineUserId } });
  return data;
}

export async function updateUserSettings(
  lineUserId: string,
  settings: { budget?: number; cycleStartDay?: number },
): Promise<User> {
  const { data } = await api.put<User>('/api/user', settings, { params: { lineUserId } });
  return data;
}

export async function deleteTransaction(lineUserId: string, txId: string): Promise<void> {
  await api.delete(`/api/transactions/${txId}`, { params: { lineUserId } });
}

export default api;
