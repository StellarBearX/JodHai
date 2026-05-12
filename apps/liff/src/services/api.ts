import axios from 'axios';
import type { DashboardSummary, Transaction, TrainingCase, User, ChatLogEntry } from '@jod-hai/shared';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3001',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResult {
  lineUserId: string;
  displayName: string;
  isNew: boolean;
}

export async function authLogin(displayName: string, pin: string): Promise<AuthResult> {
  const { data } = await api.post<AuthResult>('/api/auth', { displayName, pin });
  return data;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatTransactionResponse {
  transaction: Transaction;
  usedTraining: boolean;
  autoLearned: boolean;
}

export interface ChatQuestionResponse {
  question: string;
}

export type ChatResponse = ChatTransactionResponse | ChatQuestionResponse;

export function isChatQuestion(r: ChatResponse): r is ChatQuestionResponse {
  return 'question' in r;
}

export async function sendChatMessage(lineUserId: string, displayName: string, message: string): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>('/api/chat', { lineUserId, displayName, message });
  return data;
}

export async function sendChatImage(lineUserId: string, displayName: string, imageBase64: string, imageMimeType: string): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>('/api/chat', { lineUserId, displayName, imageBase64, imageMimeType });
  return data;
}

export async function fetchChatHistory(lineUserId: string): Promise<ChatLogEntry[]> {
  const { data } = await api.get<ChatLogEntry[]>('/api/chat/history', { params: { lineUserId } });
  return data;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function fetchDashboardSummary(lineUserId: string): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>('/api/dashboard', { params: { lineUserId } });
  return data;
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function fetchTransactions(lineUserId: string, options: { from?: string; to?: string; limit?: number } = {}): Promise<Transaction[]> {
  const { data } = await api.get<Transaction[]>('/api/transactions', { params: { lineUserId, ...options } });
  return data;
}

export async function updateTransaction(id: string, payload: { amount?: number; type?: 'INCOME' | 'EXPENSE'; category?: string; note?: string }): Promise<Transaction> {
  const { data } = await api.put<Transaction>(`/api/transactions/${id}`, payload);
  return data;
}

export async function deleteTransaction(lineUserId: string, txId: string): Promise<void> {
  await api.delete(`/api/transactions/${txId}`, { params: { lineUserId } });
}

// ─── User ─────────────────────────────────────────────────────────────────────

export async function fetchUser(lineUserId: string): Promise<User> {
  const { data } = await api.get<User>('/api/user', { params: { lineUserId } });
  return data;
}

export async function updateUserSettings(lineUserId: string, settings: { budget?: number; cycleStartDay?: number }): Promise<User> {
  const { data } = await api.put<User>('/api/user', settings, { params: { lineUserId } });
  return data;
}

// ─── Training Cases ───────────────────────────────────────────────────────────

export async function fetchTrainingCases(lineUserId: string): Promise<TrainingCase[]> {
  const { data } = await api.get<TrainingCase[]>('/api/training-cases', { params: { lineUserId } });
  return data;
}

export async function upsertTrainingCase(lineUserId: string, tc: { keyword: string; category: string; type: 'INCOME' | 'EXPENSE' }): Promise<TrainingCase> {
  const { data } = await api.post<TrainingCase>('/api/training-cases', tc, { params: { lineUserId } });
  return data;
}

export async function deleteTrainingCase(id: string): Promise<void> {
  await api.delete(`/api/training-cases/${id}`);
}

export default api;
