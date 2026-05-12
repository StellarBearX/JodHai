import { Router } from 'express';
import { middleware as lineMiddleware } from '@line/bot-sdk';
import { WebhookController } from '../controllers/WebhookController';
import { DashboardController } from '../controllers/DashboardController';
import { ChatController } from '../controllers/ChatController';
import { TransactionController } from '../controllers/TransactionController';
import { UserController } from '../controllers/UserController';

export function createRouter(
  webhookController: WebhookController,
  dashboardController: DashboardController,
  chatController: ChatController,
  transactionController: TransactionController,
  userController: UserController,
): Router {
  const router = Router();

  // ── Health ────────────────────────────────────────────────────────────────
  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── LINE Webhook (production) ─────────────────────────────────────────────
  // Only register if LINE keys are configured
  const lineSecret = process.env.LINE_CHANNEL_SECRET;
  if (lineSecret && lineSecret !== 'dev_placeholder') {
    router.post(
      '/webhook',
      lineMiddleware({ channelSecret: lineSecret }),
      (req, res, next) => webhookController.handleWebhook(req, res, next),
    );
  }

  // ── Chat (dev-mode direct API) ────────────────────────────────────────────
  router.post('/api/chat', (req, res, next) => chatController.handleChat(req, res, next));

  // ── Dashboard ─────────────────────────────────────────────────────────────
  router.get('/api/dashboard', (req, res, next) => dashboardController.getSummary(req, res, next));

  // ── Transactions ──────────────────────────────────────────────────────────
  router.get('/api/transactions', (req, res, next) => transactionController.list(req, res, next));
  router.delete('/api/transactions/:id', (req, res, next) => transactionController.remove(req, res, next));

  // ── User / Settings ───────────────────────────────────────────────────────
  router.get('/api/user', (req, res, next) => userController.getUser(req, res, next));
  router.put('/api/user', (req, res, next) => userController.updateUser(req, res, next));

  return router;
}
