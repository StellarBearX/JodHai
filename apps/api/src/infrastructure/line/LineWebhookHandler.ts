import { WebhookEvent, TextMessage, PostbackEvent } from '@line/bot-sdk';
import { messagingApi } from '@line/bot-sdk';
import { ProcessChatMessageUseCase } from '../../use-cases/ProcessChatMessageUseCase';
import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';
import type { TransactionEntity } from '../../domain/entities/TransactionEntity';
import type { UserEntity } from '../../domain/entities/UserEntity';

const CATEGORY_EMOJI: Record<string, string> = {
  Food: '🍜',
  Transport: '🚗',
  Shopping: '🛍️',
  Health: '💊',
  Entertainment: '🎬',
  Bills: '📄',
  Salary: '💰',
  Other: '📦',
};

function formatThaiDateTime(date: Date): string {
  return date.toLocaleString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok',
  });
}

function buildFlexMessage(tx: TransactionEntity, user: UserEntity): messagingApi.Message {
  const isExpense = tx.type === 'EXPENSE';
  const typeLabel = isExpense ? 'รายจ่าย' : 'รายรับ';
  const typeColor = isExpense ? '#E91E8C' : '#16a34a';
  const typeBg = isExpense ? '#fce4f3' : '#dcfce7';
  const amountColor = isExpense ? '#E91E8C' : '#16a34a';
  const categoryEmoji = CATEGORY_EMOJI[tx.category] ?? '📦';
  const displayNote = tx.note ?? tx.category;
  const cycleDay = user.cycleStartDay;

  const bubble = {
    type: 'bubble',
    size: 'kilo',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#fff0f7',
      paddingAll: '16px',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              flex: 1,
              contents: [
                {
                  type: 'text',
                  text: 'จดสำเร็จ ✅',
                  weight: 'bold',
                  size: 'lg',
                  color: '#1a1a1a',
                },
                {
                  type: 'text',
                  text: 'อย่าลืมตรวจสอบรายการที่จดด้วยนะคะ',
                  size: 'xs',
                  color: '#888888',
                  margin: 'xs',
                  wrap: true,
                },
              ],
            },
            {
              type: 'image',
              url: 'https://profile.line-scdn.net/0h00i8Vl7mMGRnOSr3a2N4bCtAH2sjJ2dIZS98MSxYSzslN2IAbSooHS0ZTCZ_Y2EDPissHiwQSmcs',
              size: '60px',
              flex: 0,
              aspectMode: 'fit',
            },
          ],
        },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#ffffff',
      paddingAll: '16px',
      spacing: 'md',
      contents: [
        {
          type: 'box',
          layout: 'horizontal',
          alignItems: 'center',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              backgroundColor: typeBg,
              cornerRadius: '20px',
              paddingTop: '4px',
              paddingBottom: '4px',
              paddingStart: '10px',
              paddingEnd: '10px',
              flex: 0,
              contents: [
                {
                  type: 'text',
                  text: typeLabel,
                  size: 'xs',
                  color: typeColor,
                  weight: 'bold',
                },
              ],
            },
            {
              type: 'text',
              text: `- ${tx.category}`,
              size: 'sm',
              color: '#444444',
              margin: 'sm',
              flex: 1,
            },
          ],
        },
        {
          type: 'text',
          text: formatThaiDateTime(tx.createdAt),
          size: 'xs',
          color: '#888888',
        },
        {
          type: 'box',
          layout: 'horizontal',
          alignItems: 'center',
          contents: [
            {
              type: 'text',
              text: displayNote,
              size: 'sm',
              color: '#333333',
              flex: 1,
              wrap: true,
            },
            {
              type: 'text',
              text: `฿${tx.amount.toLocaleString('th-TH')}`,
              size: 'sm',
              weight: 'bold',
              color: amountColor,
              flex: 0,
              margin: 'sm',
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '✏️',
                data: `action=edit&txId=${tx.id}`,
                displayText: 'แก้ไขรายการ',
              },
              style: 'secondary',
              height: 'sm',
              flex: 0,
            },
            {
              type: 'button',
              action: {
                type: 'postback',
                label: '✗',
                data: `action=delete&txId=${tx.id}`,
                displayText: 'ลบรายการ',
              },
              style: 'secondary',
              height: 'sm',
              flex: 0,
              color: '#fff0f0',
            },
          ],
        },
        { type: 'separator' },
        {
          type: 'box',
          layout: 'horizontal',
          alignItems: 'center',
          contents: [
            {
              type: 'text',
              text: `${categoryEmoji} ${tx.category}`,
              size: 'sm',
              color: '#333333',
              flex: 1,
            },
            {
              type: 'text',
              text: `฿${tx.amount.toLocaleString('th-TH')}`,
              size: 'sm',
              weight: 'bold',
              color: amountColor,
              flex: 0,
            },
          ],
        },
        {
          type: 'box',
          layout: 'vertical',
          height: '6px',
          backgroundColor: '#f0f0f0',
          cornerRadius: '3px',
          contents: [
            {
              type: 'box',
              layout: 'vertical',
              width: '100%',
              height: '6px',
              backgroundColor: '#E91E8C',
              cornerRadius: '3px',
              contents: [],
            },
          ],
        },
        {
          type: 'text',
          text: `รอบงบ: รายเดือน (วันที่ ${cycleDay})`,
          size: 'xs',
          color: '#888888',
          align: 'end',
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#fafafa',
      paddingAll: '12px',
      contents: [
        {
          type: 'text',
          text: '👵 ป้าจัดหมวดไม่ถูก ถ้าไม่ใช่ กด ✏️ เพื่อแก้ไขได้เลยนะคะ',
          size: 'xs',
          color: '#888888',
          wrap: true,
        },
      ],
    },
  };

  return {
    type: 'flex',
    altText: `จดสำเร็จ! ${isExpense ? 'จ่าย' : 'รับ'} ฿${tx.amount.toLocaleString('th-TH')} (${tx.category})`,
    contents: bubble,
  } as messagingApi.Message;
}

export class LineWebhookHandler {
  private lineClient: messagingApi.MessagingApiClient;

  constructor(
    private readonly processChatMessage: ProcessChatMessageUseCase,
    private readonly transactionRepo: ITransactionRepository,
    channelAccessToken: string,
  ) {
    this.lineClient = new messagingApi.MessagingApiClient({ channelAccessToken });
  }

  async handleEvents(events: WebhookEvent[]): Promise<void> {
    await Promise.all(events.map((event) => this.handleSingleEvent(event)));
  }

  private async handleSingleEvent(event: WebhookEvent): Promise<void> {
    if (event.source.type !== 'user') return;

    if (event.type === 'postback') {
      await this.handlePostback(event as PostbackEvent);
      return;
    }

    if (event.type !== 'message' || event.message.type !== 'text') return;

    const lineUserId = event.source.userId;
    const rawMessage = (event.message as TextMessage).text;
    const replyToken = event.replyToken;

    try {
      const profile = await this.lineClient.getProfile(lineUserId);

      let replyMessages: messagingApi.Message[];
      try {
        const result = await this.processChatMessage.execute(
          lineUserId,
          profile.displayName,
          rawMessage,
        );
        if (result.kind === 'question') {
          replyMessages = [{ type: 'text', text: result.question } as messagingApi.Message];
        } else {
          replyMessages = [buildFlexMessage(result.transaction, result.user)];
        }
      } catch (err: any) {
        if (err?.message === 'PARSE_FAILED') {
          replyMessages = [{
            type: 'text',
            text: `ขอโทษนะ 😅 ไม่เข้าใจข้อความนี้\nลองพิมพ์ใหม่แบบ เช่น\n• "กาแฟ 65"\n• "รับเงินเดือน 20000"`,
          }];
        } else {
          throw err;
        }
      }

      await this.lineClient.replyMessage({ replyToken, messages: replyMessages });
    } catch (err) {
      console.error('[LINE Webhook] Error processing event:', err);
      await this.lineClient.replyMessage({
        replyToken,
        messages: [{ type: 'text', text: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง 🙏' }],
      });
    }
  }

  private async handlePostback(event: PostbackEvent): Promise<void> {
    const params = new URLSearchParams(event.postback.data);
    const action = params.get('action');
    const txId = params.get('txId');
    const replyToken = event.replyToken;

    if (!txId) return;

    if (action === 'delete') {
      try {
        await this.transactionRepo.deleteById(txId);
        await this.lineClient.replyMessage({
          replyToken,
          messages: [{ type: 'text', text: '🗑️ ลบรายการเรียบร้อยแล้วค่ะ' }],
        });
      } catch (err) {
        console.error('[LINE Webhook] Delete failed:', err);
        await this.lineClient.replyMessage({
          replyToken,
          messages: [{ type: 'text', text: 'ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง 🙏' }],
        });
      }
    } else if (action === 'edit') {
      const liffUrl = process.env.LIFF_URL ?? 'https://liff.line.me/';
      await this.lineClient.replyMessage({
        replyToken,
        messages: [{
          type: 'text',
          text: `✏️ แก้ไขรายการได้ที่แอปนะคะ\n${liffUrl}`,
        }],
      });
    }
  }
}
