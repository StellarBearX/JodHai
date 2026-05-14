<p align="center">
  <img src="https://img.shields.io/badge/จดให้-Jod--Hai-4ade80?style=for-the-badge&labelColor=1a1a2e" alt="Jod-Hai" />
</p>

<h1 align="center">จดให้ (Jod-Hai)</h1>

<p align="center">
  <strong>บันทึกค่าใช้จ่ายผ่าน LINE แค่พิมพ์บอก — AI จัดการให้เอง</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/AI-Groq%20%2F%20Gemini-FF6B35?style=flat-square" />
</p>

---

## ทำอะไรได้บ้าง?

| ฟีเจอร์ | รายละเอียด |
|--------|-----------|
| **จดผ่าน LINE** | พิมพ์ภาษาไทยธรรมชาติ เช่น `"กาแฟ 65"` หรือ `"รับเงินเดือน 20000"` |
| **AI สนทนา** | น้องจดให้จะถามหากข้อมูลไม่ครบ ตอบกลับน่ารัก |
| **สแกนสลิป** | ส่งรูปใบเสร็จ/สลิป AI อ่านยอดแล้วบันทึกให้เลย |
| **แก้ไข / ลบ** | พิมพ์บอกว่าอยากแก้ไขหรือลบรายการไหน AI จัดการให้ |
| **Dashboard** | ดูสรุปรายรับ-รายจ่าย แยกหมวดหมู่ พร้อม AI วิเคราะห์ |
| **ตั้งงบประมาณ** | ตั้ง budget รายเดือน รับ warning เมื่อใกล้เกิน |
| **Auto-learning** | ระบบจำ keyword ของแต่ละคนเพื่อจัดหมวดได้แม่นยำขึ้น |

---

## Tech Stack

```
LINE Webhook ──► Express API ──► Groq AI (llama-3.3-70b)
                     │
                  Prisma ORM
                     │
                 PostgreSQL
                     │
              LIFF (React 19)
```

| ชั้น | เทคโนโลยี |
|-----|-----------|
| **AI** | Groq API — llama-3.3-70b-versatile (หรือ Gemini 2.5 Flash) |
| **Backend** | Node.js · Express · TypeScript · Clean Architecture |
| **Database** | PostgreSQL 16 · Prisma ORM |
| **Frontend** | React 19 · Vite · Tailwind CSS · Zustand · Framer Motion |
| **LINE** | Messaging API (Webhook) · LIFF SDK |
| **Auth** | LINE User ID + PIN (bcrypt) |
| **Monorepo** | npm workspaces |
| **Deploy** | Docker Compose |

---

## โครงสร้างโปรเจกต์

```
jod-hai/
├── apps/
│   ├── api/                      ← Express + TypeScript backend
│   │   ├── prisma/schema.prisma  ← DB schema
│   │   └── src/
│   │       ├── domain/           ← Entities + Repository Interfaces
│   │       ├── use-cases/        ← Business logic (framework-agnostic)
│   │       ├── infrastructure/   ← Prisma, AI Service, LINE SDK
│   │       └── presentation/     ← Controllers + Routes
│   │
│   └── liff/                     ← React frontend (served via nginx)
│       └── src/
│           ├── pages/            ← Dashboard, History, Settings, Chat, Login
│           ├── store/            ← Zustand state
│           └── services/         ← Axios API client
│
└── packages/
    └── shared/                   ← Shared TypeScript types
```

---

## รันด้วย Docker (แนะนำ)

```bash
git clone <repo-url> && cd jod-hai
cp apps/api/.env.example apps/api/.env
# แก้ไข .env ใส่ key ที่ต้องการ

docker compose up --build
```

| Service | URL |
|---------|-----|
| LIFF Frontend | http://localhost:5173 |
| API | http://localhost:3001 |
| PostgreSQL | localhost:5433 |

---

## รัน Local (Development)

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้งค่า environment

```bash
cp apps/api/.env.example apps/api/.env
# แก้ไขค่าตามด้านล่าง
```

### 3. Generate Prisma client + migrate

```bash
cd apps/api && npx prisma generate && npx prisma migrate dev
```

### 4. รัน dev servers

```bash
npm run dev
# API  → http://localhost:3001
# LIFF → http://localhost:5173
```

---

## Environment Variables

### `apps/api/.env`

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/jodhai"

# AI Provider — เลือก "openai" (Groq/OpenWebUI) หรือ "gemini"
AI_PROVIDER="openai"

# Groq (OpenAI-compatible)
OPENAI_BASE_URL="https://api.groq.com/openai/v1"
OPENAI_API_KEY="gsk_..."
OPENAI_MODEL="llama-3.3-70b-versatile"

# Gemini (ถ้าใช้ AI_PROVIDER=gemini)
# GEMINI_API_KEY="AIza..."

# Server
PORT=3001
NODE_ENV=development
LIFF_ORIGIN="http://localhost:5173"
```

### `apps/liff/.env`

```env
VITE_API_URL="http://localhost:3001"
VITE_LIFF_ID=""   # ว่างไว้ = dev mock mode (ไม่ต้อง LINE จริง)
```

---

## LINE Setup

1. สร้าง Messaging API channel ใน [LINE Developer Console](https://developers.line.biz/)
2. ตั้ง Webhook URL:
   ```
   https://your-domain.com/webhook
   ```
3. เปิด **Use webhook** แล้วกด **Verify**
4. สร้าง LIFF app → ใส่ LIFF ID ใน `VITE_LIFF_ID`

---

## ตัวอย่างการใช้งาน

```
คุณ:      กาแฟ 65
จดให้:    เรียบร้อยค่า~ ชายสายหวานอีกแล้วนะเนี่ย จดไว้เรียบร้อยจ้า!

คุณ:      ซื้อของ
จดให้:    วันนี้จ่ายไปเท่าไหร่อ่า?

คุณ:      350
จดให้:    โอ้โห! ช้อปหนักมากเลยนะวันนี้ จดไว้เรียบร้อยแล้วค่า

คุณ:      รับเงินเดือน 25000
จดให้:    รับเงินเดือนแล้ว! เยย~ จดให้เก็บไว้เรียบร้อยค่า

คุณ:      ลบรายการกาแฟเมื่อกี้ออกได้เลย
จดให้:    ลบแล้วจ้า! หายไปเรียบร้อยนะคะ
```
