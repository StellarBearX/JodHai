export interface ChatLogEntry {
  id: string;
  userId: string;
  role: 'user' | 'bot';
  kind: 'text' | 'tx' | 'image';
  content: string; // JSON
  createdAt: Date;
}

export interface IChatLogRepository {
  save(entry: Omit<ChatLogEntry, 'id' | 'createdAt'>): Promise<ChatLogEntry>;
  findByUserId(userId: string, limit?: number): Promise<ChatLogEntry[]>;
}
