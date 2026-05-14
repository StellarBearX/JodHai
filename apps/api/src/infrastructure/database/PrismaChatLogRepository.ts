import { PrismaClient } from '@prisma/client';
import { IChatLogRepository, ChatLogEntry } from '../../domain/repositories/IChatLogRepository';

export class PrismaChatLogRepository implements IChatLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(entry: Omit<ChatLogEntry, 'id' | 'createdAt'>): Promise<ChatLogEntry> {
    const row = await this.prisma.chatLog.create({ data: entry });
    return { ...row, role: row.role as 'user' | 'bot', kind: row.kind as 'text' | 'tx' | 'image' };
  }

  async findByUserId(userId: string, limit = 60): Promise<ChatLogEntry[]> {
    const rows = await this.prisma.chatLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    return rows.map((r) => ({ ...r, role: r.role as 'user' | 'bot', kind: r.kind as 'text' | 'tx' | 'image' }));
  }
}
