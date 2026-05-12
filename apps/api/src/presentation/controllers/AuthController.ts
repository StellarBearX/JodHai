import { Request, Response, NextFunction } from 'express';
import { PrismaUserRepository } from '../../infrastructure/database/PrismaUserRepository';

export class AuthController {
  constructor(private readonly userRepo: PrismaUserRepository) {}

  async auth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { displayName, pin } = req.body as { displayName?: string; pin?: string };

      if (!displayName?.trim() || !pin || !/^\d{4}$/.test(pin)) {
        res.status(400).json({ error: 'ต้องใส่ชื่อและ PIN 4 หลัก' });
        return;
      }

      try {
        const { user, isNew } = await this.userRepo.loginOrRegister(displayName.trim(), pin);
        res.json({ lineUserId: user.lineUserId, displayName: user.displayName, isNew });
      } catch (err: any) {
        if (err?.message === 'INVALID_PIN') {
          res.status(401).json({ error: 'PIN ไม่ถูกต้อง' });
          return;
        }
        throw err;
      }
    } catch (err) {
      next(err);
    }
  }
}
