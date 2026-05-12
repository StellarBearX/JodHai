# จดให้ (Jod-Hai) 📒

> A LINE-based personal expense tracker. Record transactions by chatting in LINE, and view your financial dashboard through a LIFF app — powered by Claude 3 Haiku for natural language understanding.

---

## Architecture Overview

```
jod-hai/                          ← npm workspaces monorepo
├── apps/
│   ├── api/                      ← Node.js + Express + TypeScript backend
│   │   ├── prisma/
│   │   │   └── schema.prisma     ← PostgreSQL schema (User + Transaction)
│   │   └── src/
│   │       ├── domain/           ← Entities + Repository Interfaces (Pure TypeScript)
│   │       ├── use-cases/        ← Business logic (framework-agnostic)
│   │       ├── infrastructure/   ← Adapters: Prisma, Claude AI, LINE SDK
│   │       └── presentation/     ← Express controllers, routes, middleware
│   │
│   └── liff/                     ← React + TypeScript + Vite frontend
│       └── src/
│           ├── layouts/          ← MainLayout with bottom nav
│           ├── pages/            ← Dashboard, History, Settings
│           ├── store/            ← Zustand global state
│           └── services/         ← Axios API client
│
└── packages/
    └── shared/                   ← Shared TypeScript interfaces (User, Transaction, etc.)
```

### Design Patterns

| Layer | Pattern | Detail |
|---|---|---|
| **Domain** | Entity + Repository Interface | Pure TS classes with invariant validation; no framework imports |
| **Use-Cases** | Application Services | Orchestrate domain objects; injected via constructor |
| **Infrastructure** | Repository Pattern (Adapter) | `PrismaTransactionRepository` implements `ITransactionRepository` |
| **AI** | Service Wrapper | `ClaudeAIService` wraps Anthropic SDK; swappable for testing |
| **Frontend** | Zustand + React Router | Single store slice per concern; lazy LIFF SDK load |

---

## Prerequisites

- **Node.js** ≥ 18
- **PostgreSQL** running locally (or Docker)
- **LINE Developer account** with a Messaging API channel + LIFF app
- **Anthropic API key**

---

## Quick Start

### 1. Install all workspace dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
# Backend
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your DB URL, LINE keys, and Anthropic key

# Frontend
cp apps/liff/.env.example apps/liff/.env
# Edit VITE_LIFF_ID (leave blank for dev mock mode)
```

### 3. Set up the database

```bash
# Generate the Prisma client
npm run prisma:generate --workspace=apps/api

# Run migrations (creates the DB tables)
npm run prisma:migrate --workspace=apps/api
```

### 4. Start both dev servers concurrently

```bash
npm run dev
```

This starts:
- **API** → `http://localhost:3001` (nodemon + ts-node)
- **LIFF** → `http://localhost:5173` (Vite HMR)

### Individual servers

```bash
npm run dev:api    # Backend only
npm run dev:liff   # Frontend only
```

---

## Environment Variables

### `apps/api/.env`

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `LINE_CHANNEL_SECRET` | From LINE Developer Console |
| `LINE_CHANNEL_ACCESS_TOKEN` | From LINE Developer Console |
| `ANTHROPIC_API_KEY` | From console.anthropic.com |
| `PORT` | API port (default: 3001) |
| `LIFF_ORIGIN` | CORS origin for the LIFF app |

### `apps/liff/.env`

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend base URL |
| `VITE_LIFF_ID` | LINE LIFF ID (blank = dev mock mode) |

---

## LINE Webhook Setup

1. In LINE Developer Console → Messaging API → Webhook URL:
   ```
   https://your-domain.com/webhook
   ```
2. Enable **Use webhook** and **Verify** it.

---

## Chatbot Commands

| Message example | Action |
|---|---|
| `กาแฟ 65` | Records ฿65 Food expense |
| `รับเงินเดือน 20000` | Records ฿20,000 Salary income |
| `ค่าน้ำมัน 500 ไปทำงาน` | Records ฿500 Transport expense with note |

---

## Tech Stack

| | Technology |
|---|---|
| **Chatbot NLP** | Anthropic Claude 3 Haiku |
| **Backend** | Node.js, Express, TypeScript |
| **ORM** | Prisma + PostgreSQL |
| **Frontend** | React 19, Vite, TypeScript |
| **Styling** | Tailwind CSS v3 |
| **State** | Zustand |
| **Routing** | React Router v6 |
| **LINE** | @line/bot-sdk, @line/liff |
| **Monorepo** | npm workspaces |