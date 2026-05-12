const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

export interface ConversationTurn {
  role: 'user' | 'model';
  parts: [{ text: string }];
}

interface Session {
  history: ConversationTurn[];
  expiresAt: number;
}

class ConversationStore {
  private sessions = new Map<string, Session>();

  private prune() {
    const now = Date.now();
    for (const [key, s] of this.sessions) {
      if (s.expiresAt < now) this.sessions.delete(key);
    }
  }

  getHistory(userId: string): ConversationTurn[] {
    this.prune();
    return this.sessions.get(userId)?.history ?? [];
  }

  append(userId: string, role: 'user' | 'model', text: string) {
    this.prune();
    const session = this.sessions.get(userId) ?? { history: [], expiresAt: 0 };
    session.history.push({ role, parts: [{ text }] });
    session.expiresAt = Date.now() + SESSION_TTL_MS;
    this.sessions.set(userId, session);
  }

  clear(userId: string) {
    this.sessions.delete(userId);
  }
}

export const conversationStore = new ConversationStore();
