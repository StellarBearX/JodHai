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
import { GetTransactionListUseCase } from './use-cases/GetTransactionListUseCase';
import { DeleteTransactionUseCase } from './use-cases/DeleteTransactionUseCase';
import { UpdateUserSettingsUseCase } from './use-cases/UpdateUserSettingsUseCase';

// Presentation
import { WebhookController } from './presentation/controllers/WebhookController';
import { DashboardController } from './presentation/controllers/DashboardController';
import { ChatController } from './presentation/controllers/ChatController';
import { TransactionController } from './presentation/controllers/TransactionController';
import { UserController } from './presentation/controllers/UserController';
import { createRouter } from './presentation/routes';
import { errorHandler } from './presentation/middlewares/errorHandler';

// ─── Dependency Injection ─────────────────────────────────────────────────────
const transactionRepo = new PrismaTransactionRepository(prisma);
const userRepo = new PrismaUserRepository(prisma);
const aiService = new ClaudeAIService();

const processChatMessage = new ProcessChatMessageUseCase(userRepo, transactionRepo, aiService);
const getDashboardSummary = new GetDashboardSummaryUseCase(userRepo, transactionRepo);
const getTransactionList = new GetTransactionListUseCase(userRepo, transactionRepo);
const deleteTransaction = new DeleteTransactionUseCase(userRepo, transactionRepo);
const updateUserSettings = new UpdateUserSettingsUseCase(userRepo);

const lineWebhookHandler = new LineWebhookHandler(
  processChatMessage,
  process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '',
);

const webhookController = new WebhookController(lineWebhookHandler);
const dashboardController = new DashboardController(getDashboardSummary);
const chatController = new ChatController(processChatMessage);
const transactionController = new TransactionController(getTransactionList, deleteTransaction);
const userController = new UserController(userRepo, updateUserSettings);

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();

app.use(cors({ origin: process.env.LIFF_ORIGIN ?? '*' }));

// Parse JSON for all routes EXCEPT /webhook (which needs raw body for HMAC)
app.use((req, _res, next) => {
  if (req.path === '/webhook') return next();
  express.json()(req, _res, next);
});

app.use(
  '/',
  createRouter(
    webhookController,
    dashboardController,
    chatController,
    transactionController,
    userController,
  ),
);

app.use(errorHandler);

// ─── Dev-mode: ensure dev user exists on startup ───────────────────────────────
async function ensureDevUser() {
  if (process.env.NODE_ENV !== 'development') return;
  try {
    await userRepo.upsertByLineUserId('U_dev_mock', 'นักพัฒนา');
    console.log('✅ Dev user ensured: U_dev_mock');
  } catch (err) {
    console.warn('⚠️  Could not ensure dev user (DB may not be ready):', err);
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.listen(PORT, async () => {
  console.log(`🚀 Jod-Hai API  →  http://localhost:${PORT}`);
  console.log(`   Health       →  http://localhost:${PORT}/health`);
  console.log(`   Chat         →  POST http://localhost:${PORT}/api/chat`);
  console.log(`   Dashboard    →  GET  http://localhost:${PORT}/api/dashboard`);
  await ensureDevUser();
});

export default app;
