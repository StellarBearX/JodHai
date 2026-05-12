import { Request, Response, NextFunction } from 'express';
import { GetTransactionListUseCase } from '../../use-cases/GetTransactionListUseCase';
import { DeleteTransactionUseCase } from '../../use-cases/DeleteTransactionUseCase';
import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';

export class TransactionController {
  constructor(
    private readonly getList: GetTransactionListUseCase,
    private readonly deleteOne: DeleteTransactionUseCase,
    private readonly transactionRepo: ITransactionRepository,
  ) {}

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lineUserId, from, to, limit } = req.query as Record<string, string>;
      if (!lineUserId) { res.status(400).json({ error: 'lineUserId required' }); return; }
      const txs = await this.getList.execute(lineUserId, {
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      });
      res.json(txs);
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { amount, type, category, note } = req.body as {
        amount?: number; type?: 'INCOME' | 'EXPENSE'; category?: string; note?: string;
      };
      const tx = await this.transactionRepo.updateById(id, { amount, type, category, note });
      res.json(tx);
    } catch (err) { next(err); }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { lineUserId } = req.query as { lineUserId?: string };
      if (!lineUserId) { res.status(400).json({ error: 'lineUserId required' }); return; }
      await this.deleteOne.execute(lineUserId, id);
      res.status(204).send();
    } catch (err) {
      const msg = (err as Error).message;
      if (msg.includes('Forbidden')) { res.status(403).json({ error: msg }); return; }
      if (msg.includes('not found')) { res.status(404).json({ error: msg }); return; }
      next(err);
    }
  }
}
