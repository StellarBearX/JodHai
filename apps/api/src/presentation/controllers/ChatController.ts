import { Request, Response, NextFunction } from 'express';
import { ProcessChatMessageUseCase } from '../../use-cases/ProcessChatMessageUseCase';

export class ChatController {
  constructor(private readonly processChatMessage: ProcessChatMessageUseCase) {}

  async handleChat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lineUserId, displayName, message: chatMessage, imageBase64, imageMimeType } = req.body as {
        lineUserId?: string;
        displayName?: string;
        message?: string;
        imageBase64?: string;
        imageMimeType?: string;
      };
      const message = chatMessage;

      if (!lineUserId || (!message && !imageBase64)) {
        res.status(400).json({ error: 'lineUserId and message or imageBase64 are required' });
        return;
      }

      let result;
      try {
        result = await this.processChatMessage.execute(
          lineUserId,
          displayName ?? 'ผู้ใช้งาน',
          message ?? '',
          imageBase64,
          imageMimeType,
        );
      } catch (err: any) {
        if (err?.message === 'PARSE_FAILED') {
          res.json({ question: 'ขอโทษนะคะ ไม่แน่ใจว่าหมายถึงอะไร ลองพิมพ์ใหม่ได้เลยค่ะ เช่น "กาแฟ 65" หรือ "รับเงินเดือน 20000" 😊' });
          return;
        }
        throw err;
      }

      if (result.kind === 'question') {
        res.json({ question: result.question });
        return;
      }

      const { transaction, usedTraining, autoLearned, message: botMsg, emotion } = result;
      res.json({ transaction, usedTraining, autoLearned, message: botMsg, emotion });
    } catch (err) {
      next(err);
    }
  }
}
