import { Request, Response, NextFunction } from 'express';
import { IUserRepository, ICategoryBudget } from '../../domain/repositories/IUserRepository';

export class BudgetController {
  constructor(private readonly userRepo: IUserRepository) {}

  async getCategoryBudgets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lineUserId } = req.query as { lineUserId?: string };
      if (!lineUserId) { res.status(400).json({ error: 'lineUserId required' }); return; }

      const user = await this.userRepo.findByLineUserId(lineUserId);
      if (!user) { res.status(404).json({ error: 'User not found' }); return; }

      const budgets = await this.userRepo.getCategoryBudgets(user.id);
      res.json(budgets);
    } catch (err) { next(err); }
  }

  async setCategoryBudgets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lineUserId } = req.query as { lineUserId?: string };
      if (!lineUserId) { res.status(400).json({ error: 'lineUserId required' }); return; }

      const user = await this.userRepo.findByLineUserId(lineUserId);
      if (!user) { res.status(404).json({ error: 'User not found' }); return; }

      const budgets = req.body as ICategoryBudget[];
      if (!Array.isArray(budgets)) { res.status(400).json({ error: 'body must be an array' }); return; }

      await this.userRepo.setCategoryBudgets(user.id, budgets);
      res.json({ ok: true });
    } catch (err) { next(err); }
  }
}
