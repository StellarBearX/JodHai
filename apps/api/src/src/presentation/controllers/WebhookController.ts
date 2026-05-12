import { Request, Response, NextFunction } from 'express';
import { middleware as lineMiddleware, WebhookEvent } from '@line/bot-sdk';
import { LineWebhookHandler } from '../../infrastructure/line/LineWebhookHandler';

/**
 * Presentation: LINE Webhook Controller
 */
export class WebhookController {
  constructor(private readonly handler: LineWebhookHandler) {}

  /**
   * POST /webhook
   * Verified by LINE signature middleware before reaching here.
   */
  async handleWebhook(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const events: WebhookEvent[] = req.body.events;

    // Respond 200 immediately — LINE requires a fast acknowledgement
    res.status(200).json({ status: 'ok' });

    // Process events asynchronously
    this.handler.handleEvents(events).catch((err) => {
      console.error('[WebhookController] Unhandled error:', err);
    });
  }
}
