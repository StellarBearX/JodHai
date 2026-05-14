import { ITransactionRepository } from '../domain/repositories/ITransactionRepository';
import { IUserRepository } from '../domain/repositories/IUserRepository';
import { ITrainingCaseRepository } from '../domain/repositories/ITrainingCaseRepository';
import { IChatLogRepository } from '../domain/repositories/IChatLogRepository';
import { TransactionEntity } from '../domain/entities/TransactionEntity';
import { UserEntity } from '../domain/entities/UserEntity';
import { GeminiAIService } from '../infrastructure/ai/GeminiAIService';
import { conversationStore } from '../infrastructure/conversation/ConversationStore';

export type UseCaseResult =
  | { kind: 'transaction'; transaction: TransactionEntity; user: UserEntity; usedTraining: boolean; autoLearned: boolean; message: string; emotion: string }
  | { kind: 'question'; question: string }
  | { kind: 'answer'; answer: string; emotion: string }
  | { kind: 'edited'; transaction: TransactionEntity; message: string; emotion: string }
  | { kind: 'deleted'; message: string; emotion: string };

// ── Intent detection (local, no AI cost) ─────────────────────────────────────
const QUERY_PAT = [
  /เงินเหลือ/, /ยอดคงเหลือ/, /ยอดเหลือ/, /ดูยอด/, /เช็คยอด/,
  /ใช้ไปเท่าไหร่/, /จ่ายไปเท่าไหร่/, /ใช้จ่ายไป/, /ใช้เงินไป/,
  /รายจ่ายเดือน/, /รายรับเดือน/, /เดือนนี้ใช้/, /เดือนนี้รับ/, /เดือนนี้จ่าย/,
  /สรุปเดือน/, /ดูสรุป/, /สรุปการใช้จ่าย/, /งบเหลือ/, /รับมาเท่าไหร่/,
  /ดูรายจ่าย/, /ดูรายรับ/, /balance/i,
];
const EDIT_PAT  = [/แก้รายการ/, /แก้ไข/, /เปลี่ยนจาก/, /อัปเดตรายการ/, /แก้ตัวเลข/, /แก้ยอด/, /แก้จาก/];
const DELETE_PAT = [/ลบรายการ/, /ลบอัน/, /ยกเลิกรายการ/, /ลบตัวนี้/, /ลบค่า/, /ลบ.{0,10}เมื่อกี้/, /cancel/i];

function detectIntent(text: string): 'query' | 'edit' | 'delete' | 'record' {
  if (DELETE_PAT.some((p) => p.test(text))) return 'delete';
  if (EDIT_PAT.some((p) => p.test(text))) return 'edit';
  if (QUERY_PAT.some((p) => p.test(text))) return 'query';
  return 'record';
}

export class ProcessChatMessageUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly trainingCaseRepo: ITrainingCaseRepository,
    private readonly aiService: GeminiAIService,
    private readonly chatLogRepo: IChatLogRepository,
  ) {}

  async execute(
    lineUserId: string,
    displayName: string,
    rawMessage: string,
    imageBase64?: string,
    imageMimeType?: string,
  ): Promise<UseCaseResult> {
    const user = await this.userRepo.upsertByLineUserId(lineUserId, displayName);

    if (imageBase64) {
      await this.chatLogRepo.save({ userId: user.id, role: 'user', kind: 'image', content: JSON.stringify({ text: '[ส่งรูปใบเสร็จ]' }) });
    } else if (rawMessage) {
      await this.chatLogRepo.save({ userId: user.id, role: 'user', kind: 'text', content: JSON.stringify({ text: rawMessage }) });
    }

    // Image → direct parse
    if (imageBase64 && imageMimeType) {
      return this.handleRecord(user, lineUserId, rawMessage, imageBase64, imageMimeType);
    }

    // Text intent routing (only on fresh turn, not mid-conversation)
    const history = conversationStore.getHistory(lineUserId);
    if (history.length === 0) {
      const intent = detectIntent(rawMessage);

      if (intent === 'query') {
        return this.handleQuery(user, rawMessage);
      }
      if (intent === 'edit' || intent === 'delete') {
        return this.handleEditDelete(user, lineUserId, rawMessage, intent);
      }

      // Training cache check
      const trainingCases = await this.trainingCaseRepo.findAllByUserId(user.id);
      const lower = rawMessage.toLowerCase();
      const matched = trainingCases.find((tc) => lower.includes(tc.keyword.toLowerCase()));
      if (matched) {
        const amountMatch = rawMessage.match(/(\d[\d,]*\.?\d*)/);
        const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;
        if (amount && amount > 0) {
          const note = rawMessage.replace(/\d[\d,]*\.?\d*/g, '').replace(/บาท|thb|฿/gi, '').trim() || undefined;
          const transaction = await this.transactionRepo.create({ userId: user.id, amount, type: matched.type, category: matched.category, note });
          conversationStore.clear(lineUserId);
          const msg = `เรียบร้อยค่า! ⚡ จดให้รู้จัก "${matched.keyword}" แล้ว ไม่ต้องโทร AI เลย~`;
          await this.chatLogRepo.save({ userId: user.id, role: 'bot', kind: 'tx', content: JSON.stringify({ transaction: this.txToJson(transaction) }) });
          return { kind: 'transaction', transaction, user, usedTraining: true, autoLearned: false, message: msg, emotion: 'happy' };
        }
      }
    }

    return this.handleRecord(user, lineUserId, rawMessage);
  }

  // ── Query ──────────────────────────────────────────────────────────────────
  private async handleQuery(user: UserEntity, question: string): Promise<UseCaseResult> {
    const now = new Date();
    const stats = await this.transactionRepo.getMonthlyStats(user.id, now.getFullYear(), now.getMonth() + 1);
    const res = await this.aiService.answerQuery(stats, question);
    await this.chatLogRepo.save({ userId: user.id, role: 'bot', kind: 'text', content: JSON.stringify({ text: res.answer }) });
    return { kind: 'answer', answer: res.answer, emotion: res.emotion };
  }

  // ── Edit / Delete ──────────────────────────────────────────────────────────
  private async handleEditDelete(user: UserEntity, lineUserId: string, message: string, intent: 'edit' | 'delete'): Promise<UseCaseResult> {
    const recentTxs = await this.transactionRepo.findRecentByUserId(user.id, 10);
    if (recentTxs.length === 0) {
      return { kind: 'answer', answer: 'ยังไม่มีรายการเลยนะคะ เพิ่มรายการก่อนได้เลยจ้า 😊', emotion: 'neutral' };
    }

    const parsed = await this.aiService.parseEditDeleteIntent(recentTxs, message);

    if (parsed.action === 'notfound') {
      return { kind: 'question', question: parsed.message };
    }

    if (parsed.action === 'delete') {
      await this.transactionRepo.deleteById(parsed.txId);
      await this.chatLogRepo.save({ userId: user.id, role: 'bot', kind: 'text', content: JSON.stringify({ text: parsed.message }) });
      return { kind: 'deleted', message: parsed.message, emotion: parsed.emotion };
    }

    // edit
    const updated = await this.transactionRepo.updateById(parsed.txId, parsed.changes);
    await this.chatLogRepo.save({ userId: user.id, role: 'bot', kind: 'tx', content: JSON.stringify({ transaction: this.txToJson(updated), message: parsed.message }) });
    return { kind: 'edited', transaction: updated, message: parsed.message, emotion: parsed.emotion };
  }

  // ── Record (existing) ──────────────────────────────────────────────────────
  private async handleRecord(user: UserEntity, lineUserId: string, rawMessage: string, imageBase64?: string, imageMimeType?: string): Promise<UseCaseResult> {
    try {
      let response;
      if (imageBase64 && imageMimeType) {
        conversationStore.clear(lineUserId);
        response = await this.aiService.parseFromImage(imageBase64, imageMimeType);
      } else {
        const history = conversationStore.getHistory(lineUserId);
        response = await this.aiService.chat(history, rawMessage);
        conversationStore.append(lineUserId, 'user', rawMessage);
      }

      if (!response.complete) {
        conversationStore.append(lineUserId, 'model', JSON.stringify({ complete: false, question: response.question }));
        await this.chatLogRepo.save({ userId: user.id, role: 'bot', kind: 'text', content: JSON.stringify({ text: response.question }) });
        return { kind: 'question', question: response.question };
      }

      conversationStore.clear(lineUserId);
      const tx = response.transaction;
      const transaction = await this.transactionRepo.create({ userId: user.id, amount: tx.amount, type: tx.type, category: tx.category, note: tx.note });
      const autoLearned = await this.tryAutoLearn(user.id, tx.note, tx.category, tx.type);
      await this.chatLogRepo.save({ userId: user.id, role: 'bot', kind: 'tx', content: JSON.stringify({ transaction: this.txToJson(transaction), autoLearned, message: response.message }) });
      return { kind: 'transaction', transaction, user, usedTraining: false, autoLearned, message: response.message, emotion: response.emotion };
    } catch {
      conversationStore.clear(lineUserId);
      throw new Error('PARSE_FAILED');
    }
  }

  private txToJson(tx: TransactionEntity) {
    return { id: tx.id, userId: tx.userId, amount: tx.amount, type: tx.type, category: tx.category, note: tx.note, createdAt: tx.createdAt };
  }

  private async tryAutoLearn(userId: string, note: string | undefined, category: string, type: 'INCOME' | 'EXPENSE'): Promise<boolean> {
    if (!note) return false;
    const clean = note.trim();
    if (clean.length < 2 || clean.length > 15 || /\d/.test(clean)) return false;
    try {
      await this.trainingCaseRepo.upsert({ userId, keyword: clean.toLowerCase(), category, type });
      return true;
    } catch { return false; }
  }
}
