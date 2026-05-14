import { Request, Response, NextFunction } from 'express';
import { GetDashboardSummaryUseCase } from '../../use-cases/GetDashboardSummaryUseCase';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';
import { GeminiAIService } from '../../infrastructure/ai/GeminiAIService';

export class DashboardController {
  constructor(
    private readonly getDashboardSummary: GetDashboardSummaryUseCase,
    private readonly userRepo: IUserRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly aiService: GeminiAIService,
  ) {}

  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lineUserId = req.query.lineUserId as string;
      if (!lineUserId) { res.status(400).json({ error: 'lineUserId query param is required' }); return; }
      const summary = await this.getDashboardSummary.execute(lineUserId);
      res.json(summary);
    } catch (err) { next(err); }
  }

  async getAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lineUserId = req.query.lineUserId as string;
      if (!lineUserId) { res.status(400).json({ error: 'lineUserId required' }); return; }
      const user = await this.userRepo.findByLineUserId(lineUserId);
      if (!user) { res.status(404).json({ error: 'User not found' }); return; }
      const now = new Date();
      const stats = await this.transactionRepo.getMonthlyStats(user.id, now.getFullYear(), now.getMonth() + 1);
      const analysis = await this.aiService.analyzeDashboard(stats);
      res.json({ analysis });
    } catch (err) { next(err); }
  }
}
