import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import prisma from './infrastructure/database/prismaClient';
import { PrismaTransactionRepository } from './infrastructure/database/PrismaTransactionRepository';
import { PrismaUserRepository } from './infrastructure/database/PrismaUserRepository';
import { PrismaTrainingCaseRepository } from './infrastructure/database/PrismaTrainingCaseRepository';
import { PrismaChatLogRepository } from './infrastructure/database/PrismaChatLogRepository';
import { GeminiAIService } from './infrastructure/ai/GeminiAIService';

import { ProcessChatMessageUseCase } from './use-cases/ProcessChatMessageUseCase';
import { GetDashboardSummaryUseCase } from './use-cases/GetDashboardSummaryUseCase';
import { GetTransactionListUseCase } from './use-cases/GetTransactionListUseCase';
import { DeleteTransactionUseCase } from './use-cases/DeleteTransactionUseCase';
import { UpdateUserSettingsUseCase } from './use-cases/UpdateUserSettingsUseCase';

import { AuthController } from './presentation/controllers/AuthController';
import { DashboardController } from './presentation/controllers/DashboardController';
import { ChatController } from './presentation/controllers/ChatController';
import { ChatLogController } from './presentation/controllers/ChatLogController';
import { TransactionController } from './presentation/controllers/TransactionController';
import { UserController } from './presentation/controllers/UserController';
import { TrainingCaseController } from './presentation/controllers/TrainingCaseController';
import { createRouter } from './presentation/routes';
import { errorHandler } from './presentation/middlewares/errorHandler';

const transactionRepo = new PrismaTransactionRepository(prisma);
const userRepo = new PrismaUserRepository(prisma);
const trainingCaseRepo = new PrismaTrainingCaseRepository(prisma);
const chatLogRepo = new PrismaChatLogRepository(prisma);
const aiService = new GeminiAIService();

const processChatMessage = new ProcessChatMessageUseCase(userRepo, transactionRepo, trainingCaseRepo, aiService, chatLogRepo);
const getDashboardSummary = new GetDashboardSummaryUseCase(userRepo, transactionRepo);
const getTransactionList = new GetTransactionListUseCase(userRepo, transactionRepo);
const deleteTransaction = new DeleteTransactionUseCase(userRepo, transactionRepo);
const updateUserSettings = new UpdateUserSettingsUseCase(userRepo);

const authController = new AuthController(userRepo);
const dashboardController = new DashboardController(getDashboardSummary);
const chatController = new ChatController(processChatMessage);
const chatLogController = new ChatLogController(userRepo, chatLogRepo);
const transactionController = new TransactionController(getTransactionList, deleteTransaction, transactionRepo);
const userController = new UserController(userRepo, updateUserSettings);
const trainingCaseController = new TrainingCaseController(userRepo, trainingCaseRepo);

const app = express();
app.use(cors({ origin: process.env.LIFF_ORIGIN ?? '*' }));
app.use(express.json({ limit: '10mb' }));

app.use('/', createRouter(authController, dashboardController, chatController, chatLogController, transactionController, userController, trainingCaseController));
app.use(errorHandler);

const PORT = parseInt(process.env.PORT ?? '3001', 10);
app.listen(PORT, () => console.log(`🚀 Jod-Hai API → http://localhost:${PORT}`));

export default app;
