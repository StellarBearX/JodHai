import { Request, Response, NextFunction } from 'express';
import { ProcessChatMessageUseCase } from '../../use-cases/ProcessChatMessageUseCase';

/**
 * Presentation: Chat Controller
 * Handles the dev-mode chat endpoint that mimics the LINE webhook flow
 * but accepts JSON directly — no LINE signature required.
 *
 * POST /api/chat
 * Body: { lineUserId: string, displayName: string, message: string }
 */
export class ChatController {
  constructor(private readonly processChatMessage: ProcessChatMessageUseCase) {}

  async handleChat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lineUserId, displayName, message } = req.body as {
        lineUserId?: string;
        displayName?: string;
        message?: string;
      };

      if (!lineUserId || !message) {
        res.status(400).json({ error: 'lineUserId and message are required' });
        return;
      }

      const reply = await this.processChatMessage.execute(
        lineUserId,
        displayName ?? 'ผู้ใช้งาน',
        message,
      );

      res.json({ reply });
    } catch (err) {
      next(err);
    }
  }
}
