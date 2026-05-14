import { Request, Response, NextFunction } from 'express';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IChatLogRepository } from '../../domain/repositories/IChatLogRepository';

export class ChatLogController {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly chatLogRepo: IChatLogRepository,
  ) {}

  async history(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lineUserId } = req.query as { lineUserId?: string };
      if (!lineUserId) { res.status(400).json({ error: 'lineUserId required' }); return; }

      const user = await this.userRepo.findByLineUserId(lineUserId);
      if (!user) { res.json([]); return; }

      const logs = await this.chatLogRepo.findByUserId(user.id, 60);
      res.json(logs.map((l) => ({ ...l, content: JSON.parse(l.content) })));
    } catch (err) {
      next(err);
    }
  }
}
