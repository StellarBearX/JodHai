import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { DashboardController } from '../controllers/DashboardController';
import { ChatController } from '../controllers/ChatController';
import { ChatLogController } from '../controllers/ChatLogController';
import { TransactionController } from '../controllers/TransactionController';
import { UserController } from '../controllers/UserController';
import { TrainingCaseController } from '../controllers/TrainingCaseController';

export function createRouter(
  authController: AuthController,
  dashboardController: DashboardController,
  chatController: ChatController,
  chatLogController: ChatLogController,
  transactionController: TransactionController,
  userController: UserController,
  trainingCaseController: TrainingCaseController,
): Router {
  const router = Router();

  router.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

  router.post('/api/auth', (req, res, next) => authController.auth(req, res, next));

  router.post('/api/chat', (req, res, next) => chatController.handleChat(req, res, next));
  router.get('/api/chat/history', (req, res, next) => chatLogController.history(req, res, next));

  router.get('/api/dashboard', (req, res, next) => dashboardController.getSummary(req, res, next));
  router.get('/api/dashboard/analysis', (req, res, next) => dashboardController.getAnalysis(req, res, next));

  router.get('/api/transactions', (req, res, next) => transactionController.list(req, res, next));
  router.put('/api/transactions/:id', (req, res, next) => transactionController.update(req, res, next));
  router.delete('/api/transactions/:id', (req, res, next) => transactionController.remove(req, res, next));

  router.get('/api/user', (req, res, next) => userController.getUser(req, res, next));
  router.put('/api/user', (req, res, next) => userController.updateUser(req, res, next));

  router.get('/api/training-cases', (req, res, next) => trainingCaseController.list(req, res, next));
  router.post('/api/training-cases', (req, res, next) => trainingCaseController.upsert(req, res, next));
  router.delete('/api/training-cases/:id', (req, res, next) => trainingCaseController.remove(req, res, next));

  return router;
}
