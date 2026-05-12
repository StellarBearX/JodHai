import { Request, Response, NextFunction } from 'express';
import { GetTransactionListUseCase } from '../../use-cases/GetTransactionListUseCase';
import { DeleteTransactionUseCase } from '../../use-cases/DeleteTransactionUseCase';

/**
 * Presentation: Transaction Controller
 *
 * GET  /api/transactions?lineUserId=&from=&to=&limit=
 * DELETE /api/transactions/:id?lineUserId=
 */
export class TransactionController {
  constructor(
    private readonly getList: GetTransactionListUseCase,
    private readonly deleteOne: DeleteTransactionUseCase,
  ) {}

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lineUserId, from, to, limit } = req.query as Record<string, string>;
      if (!lineUserId) {
        res.status(400).json({ error: 'lineUserId query param is required' });
        return;
      }

      const txs = await this.getList.execute(lineUserId, {
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      });

      res.json(txs);
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { lineUserId } = req.query as { lineUserId?: string };

      if (!lineUserId) {
        res.status(400).json({ error: 'lineUserId query param is required' });
        return;
      }

      await this.deleteOne.execute(lineUserId, id);
      res.status(204).send();
    } catch (err) {
      if ((err as Error).message.includes('Forbidden')) {
        res.status(403).json({ error: (err as Error).message });
        return;
      }
      if ((err as Error).message.includes('not found')) {
        res.status(404).json({ error: (err as Error).message });
        return;
      }
      next(err);
    }
  }
}
