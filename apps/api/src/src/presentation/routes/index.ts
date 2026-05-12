import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { ChatController } from '../controllers/ChatController';
import { TransactionController } from '../controllers/TransactionController';
import { UserController } from '../controllers/UserController';
import { TrainingCaseController } from '../controllers/TrainingCaseController';

export function createRouter(
  dashboardController: DashboardController,
  chatController: ChatController,
  transactionController: TransactionController,
  userController: UserController,
  trainingCaseController: TrainingCaseController,
): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── Chat ──────────────────────────────────────────────────────────────────
  router.post('/api/chat', (req, res, next) => chatController.handleChat(req, res, next));

  // ── Dashboard ─────────────────────────────────────────────────────────────
  router.get('/api/dashboard', (req, res, next) => dashboardController.getSummary(req, res, next));

  // ── Transactions ──────────────────────────────────────────────────────────
  router.get('/api/transactions', (req, res, next) => transactionController.list(req, res, next));
  router.put('/api/transactions/:id', (req, res, next) => transactionController.update(req, res, next));
  router.delete('/api/transactions/:id', (req, res, next) => transactionController.remove(req, res, next));

  // ── User / Settings ───────────────────────────────────────────────────────
  router.get('/api/user', (req, res, next) => userController.getUser(req, res, next));
  router.put('/api/user', (req, res, next) => userController.updateUser(req, res, next));

  // ── Training Cases ────────────────────────────────────────────────────────
  router.get('/api/training-cases', (req, res, next) => trainingCaseController.list(req, res, next));
  router.post('/api/training-cases', (req, res, next) => trainingCaseController.upsert(req, res, next));
  router.delete('/api/training-cases/:id', (req, res, next) => trainingCaseController.remove(req, res, next));

  return router;
}
