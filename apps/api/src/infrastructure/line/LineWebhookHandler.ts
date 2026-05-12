import { WebhookEvent, TextMessage } from '@line/bot-sdk';
import { messagingApi } from '@line/bot-sdk';
import { ProcessChatMessageUseCase } from '../../use-cases/ProcessChatMessageUseCase';

/**
 * Infrastructure: LINE Webhook Handler
 * Bridges the raw LINE SDK events to our use-case layer.
 */
export class LineWebhookHandler {
  private lineClient: messagingApi.MessagingApiClient;

  constructor(
    private readonly processChatMessage: ProcessChatMessageUseCase,
    channelAccessToken: string,
  ) {
    this.lineClient = new messagingApi.MessagingApiClient({ channelAccessToken });
  }

  /**
   * Processes an array of webhook events from LINE.
   * Handles text messages; ignores other event types.
   */
  async handleEvents(events: WebhookEvent[]): Promise<void> {
    await Promise.all(events.map((event) => this.handleSingleEvent(event)));
  }

  private async handleSingleEvent(event: WebhookEvent): Promise<void> {
    if (event.type !== 'message' || event.message.type !== 'text') return;
    if (event.source.type !== 'user') return;

    const lineUserId = event.source.userId;
    const rawMessage = (event.message as TextMessage).text;
    const replyToken = event.replyToken;

    try {
      // Fetch user profile for display name
      const profile = await this.lineClient.getProfile(lineUserId);
      const replyText = await this.processChatMessage.execute(
        lineUserId,
        profile.displayName,
        rawMessage,
      );

      await this.lineClient.replyMessage({
        replyToken,
        messages: [{ type: 'text', text: replyText }],
      });
    } catch (err) {
      console.error('[LINE Webhook] Error processing event:', err);
      await this.lineClient.replyMessage({
        replyToken,
        messages: [{ type: 'text', text: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง 🙏' }],
      });
    }
  }
}
