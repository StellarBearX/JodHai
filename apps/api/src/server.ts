import 'dotenv/config';
import express from 'express';
import cors from 'cors';

// Infrastructure
import prisma from './infrastructure/database/prismaClient';
import { PrismaTransactionRepository } from './infrastructure/database/PrismaTransactionRepository';
import { PrismaUserRepository } from './infrastructure/database/PrismaUserRepository';
import { ClaudeAIService } from './infrastructure/ai/ClaudeAIService';
import { LineWebhookHandler } from './infrastructure/line/LineWebhookHandler';

// Use-Cases
import { ProcessChatMessageUseCase } from './use-cases/ProcessChatMessageUseCase';
import { GetDashboardSummaryUseCase } from './use-cases/GetDashboardSummaryUseCase';

// Presentation
import { WebhookController } from './presentation/controllers/WebhookController';
import { DashboardController } from './presentation/controllers/DashboardController';
import { createRouter } from './presentation/routes';
import { errorHandler } from './presentation/middlewares/errorHandler';

// ─── Dependency Injection (manual, no IoC container) ─────────────────────────
const transactionRepo = new PrismaTransactionRepository(prisma);
const userRepo = new PrismaUserRepository(prisma);
const aiService = new ClaudeAIService();

const processChatMessage = new ProcessChatMessageUseCase(userRepo, transactionRepo, aiService);
const getDashboardSummary = new GetDashboardSummaryUseCase(userRepo, transactionRepo);

const lineWebhookHandler = new LineWebhookHandler(
  processChatMessage,
  process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '',
);

const webhookController = new WebhookController(lineWebhookHandler);
const dashboardController = new DashboardController(getDashboardSummary);

// ─── Express App ─────────────────────────────────────────────────────────────
const app = express();

app.use(cors({ origin: process.env.LIFF_ORIGIN ?? '*' }));

// NOTE: express.json() is intentionally NOT global — the LINE middleware
// needs the raw body for signature verification. It is applied per-route inside
// createRouter() for non-webhook routes via express.json().
app.use(
  (req, _res, next) => {
    if (req.path !== '/webhook') {
      express.json()(req, _res, next);
    } else {
      next();
    }
  },
);

app.use('/', createRouter(webhookController, dashboardController));
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.listen(PORT, () => {
  console.log(`🚀 Jod-Hai API running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

export default app;
