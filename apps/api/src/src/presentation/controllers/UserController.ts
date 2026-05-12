import { Request, Response, NextFunction } from 'express';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UpdateUserSettingsUseCase } from '../../use-cases/UpdateUserSettingsUseCase';

/**
 * Presentation: User Controller
 *
 * GET  /api/user?lineUserId=
 * PUT  /api/user?lineUserId=   body: { budget, cycleStartDay }
 */
export class UserController {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly updateSettings: UpdateUserSettingsUseCase,
  ) {}

  async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lineUserId } = req.query as { lineUserId?: string };
      if (!lineUserId) {
        res.status(400).json({ error: 'lineUserId query param is required' });
        return;
      }

      const user = await this.userRepo.findByLineUserId(lineUserId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        id: user.id,
        lineUserId: user.lineUserId,
        displayName: user.displayName,
        budget: user.budget,
        cycleStartDay: user.cycleStartDay,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { lineUserId } = req.query as { lineUserId?: string };
      if (!lineUserId) {
        res.status(400).json({ error: 'lineUserId query param is required' });
        return;
      }

      const { budget, cycleStartDay } = req.body as {
        budget?: number;
        cycleStartDay?: number;
      };

      const updated = await this.updateSettings.execute(lineUserId, { budget, cycleStartDay });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
}
