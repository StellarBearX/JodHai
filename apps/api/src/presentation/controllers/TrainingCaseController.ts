import { Request, Response, NextFunction } from 'express';
import { ITrainingCaseRepository } from '../../domain/repositories/ITrainingCaseRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';

export class TrainingCaseController {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly trainingCaseRepo: ITrainingCaseRepository,
  ) {}

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lineUserId } = req.query as { lineUserId?: string };
      if (!lineUserId) { res.status(400).json({ error: 'lineUserId required' }); return; }
      const user = await this.userRepo.findByLineUserId(lineUserId);
      if (!user) { res.status(404).json({ error: 'User not found' }); return; }
      const cases = await this.trainingCaseRepo.findAllByUserId(user.id);
      res.json(cases);
    } catch (err) { next(err); }
  }

  async upsert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lineUserId } = req.query as { lineUserId?: string };
      const { keyword, category, type } = req.body as { keyword?: string; category?: string; type?: string };
      if (!lineUserId || !keyword || !category || !type) {
        res.status(400).json({ error: 'lineUserId, keyword, category, type required' }); return;
      }
      if (type !== 'INCOME' && type !== 'EXPENSE') {
        res.status(400).json({ error: 'type must be INCOME or EXPENSE' }); return;
      }
      const user = await this.userRepo.findByLineUserId(lineUserId);
      if (!user) { res.status(404).json({ error: 'User not found' }); return; }
      const tc = await this.trainingCaseRepo.upsert({ userId: user.id, keyword, category, type });
      res.json(tc);
    } catch (err) { next(err); }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.trainingCaseRepo.deleteById(req.params.id);
      res.status(204).end();
    } catch (err) { next(err); }
  }
}
