import { Request, Response, NextFunction } from 'express';
import { GetDashboardSummaryUseCase } from '../../use-cases/GetDashboardSummaryUseCase';

/**
 * Presentation: Dashboard Controller
 * In production, lineUserId is extracted from a verified LIFF ID token.
 */
export class DashboardController {
  constructor(private readonly getDashboardSummary: GetDashboardSummaryUseCase) {}

  /** GET /api/dashboard?lineUserId=Uxxxxx */
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const lineUserId = req.query.lineUserId as string;
      if (!lineUserId) {
        res.status(400).json({ error: 'lineUserId query param is required' });
        return;
      }
      const summary = await this.getDashboardSummary.execute(lineUserId);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  }
}
