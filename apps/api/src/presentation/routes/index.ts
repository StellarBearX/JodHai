import { Router } from 'express';
import { middleware as lineMiddleware } from '@line/bot-sdk';
import { WebhookController } from '../controllers/WebhookController';
import { DashboardController } from '../controllers/DashboardController';

export function createRouter(
  webhookController: WebhookController,
  dashboardController: DashboardController,
): Router {
  const router = Router();

  // ── Health ────────────────────────────────────────────────────────────────
  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── LINE Webhook ──────────────────────────────────────────────────────────
  router.post(
    '/webhook',
    lineMiddleware({
      channelSecret: process.env.LINE_CHANNEL_SECRET ?? '',
    }),
    (req, res, next) => webhookController.handleWebhook(req, res, next),
  );

  // ── Dashboard API ─────────────────────────────────────────────────────────
  router.get('/api/dashboard', (req, res, next) =>
    dashboardController.getSummary(req, res, next),
  );

  return router;
}
