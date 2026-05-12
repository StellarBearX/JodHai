/**
 * Prisma seed script — populates the dev database with sample data.
 * Run: npx ts-node prisma/seed.ts  (from apps/api directory)
 * Or:  npm run prisma:seed --workspace=apps/api
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const DEV_USER_LINE_ID = 'U_dev_mock';

const SEED_TRANSACTIONS = [
  { amount: 25000, type: 'INCOME',  category: 'Salary',        note: 'เงินเดือนเดือนนี้',     daysAgo: 10 },
  { amount: 5000,  type: 'INCOME',  category: 'Other',         note: 'ค่า freelance',          daysAgo: 7  },
  { amount: 65,    type: 'EXPENSE', category: 'Food',          note: 'ชานมไข่มุก',             daysAgo: 1  },
  { amount: 250,   type: 'EXPENSE', category: 'Food',          note: 'อาหารกลางวัน',            daysAgo: 1  },
  { amount: 380,   type: 'EXPENSE', category: 'Transport',     note: 'Grab ไปทำงาน',           daysAgo: 2  },
  { amount: 150,   type: 'EXPENSE', category: 'Food',          note: 'ข้าวเย็น + น้ำ',         daysAgo: 2  },
  { amount: 1200,  type: 'EXPENSE', category: 'Shopping',      note: 'เสื้อผ้า Shopee',         daysAgo: 3  },
  { amount: 500,   type: 'EXPENSE', category: 'Bills',         note: 'ค่าไฟ',                  daysAgo: 4  },
  { amount: 299,   type: 'EXPENSE', category: 'Entertainment', note: 'Netflix รายเดือน',        daysAgo: 5  },
  { amount: 850,   type: 'EXPENSE', category: 'Health',        note: 'ยาและวิตามิน',            daysAgo: 6  },
  { amount: 45,    type: 'EXPENSE', category: 'Food',          note: 'กาแฟเช้า',               daysAgo: 6  },
  { amount: 320,   type: 'EXPENSE', category: 'Transport',     note: 'BTS + MRT ทั้งอาทิตย์',  daysAgo: 7  },
  { amount: 3500,  type: 'EXPENSE', category: 'Bills',         note: 'ค่าเช่าหอ (ส่วนหนึ่ง)', daysAgo: 8  },
  { amount: 2000,  type: 'INCOME',  category: 'Other',         note: 'คืนเงินเพื่อน',           daysAgo: 9  },
  { amount: 189,   type: 'EXPENSE', category: 'Food',          note: 'บุฟเฟ่ต์หมูกระทะ',      daysAgo: 9  },
] as const;

async function main() {
  console.log('🌱 Seeding database...');

  // ── Upsert dev user ────────────────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { lineUserId: DEV_USER_LINE_ID },
    update: { displayName: 'นักพัฒนา' },
    create: {
      id: uuidv4(),
      lineUserId: DEV_USER_LINE_ID,
      displayName: 'นักพัฒนา',
      budget: 20000,
      cycleStartDay: 1,
    },
  });
  console.log(`✅ User: ${user.displayName} (${user.id})`);

  // ── Clear existing transactions for clean seed ──────────────────────────────
  const deleted = await prisma.transaction.deleteMany({ where: { userId: user.id } });
  console.log(`🗑️  Cleared ${deleted.count} existing transactions`);

  // ── Insert sample transactions ─────────────────────────────────────────────
  const now = new Date();
  for (const t of SEED_TRANSACTIONS) {
    const createdAt = new Date(now);
    createdAt.setDate(now.getDate() - t.daysAgo);
    createdAt.setHours(Math.floor(Math.random() * 14) + 7, Math.floor(Math.random() * 60), 0, 0);

    await prisma.transaction.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        amount: t.amount,
        type: t.type,
        category: t.category,
        note: t.note,
        createdAt,
      },
    });
  }
  console.log(`✅ Inserted ${SEED_TRANSACTIONS.length} sample transactions`);
  console.log('\n🎉 Seed complete! Run `npm run dev` to start the app.');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
