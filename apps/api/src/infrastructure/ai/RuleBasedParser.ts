import { TransactionType } from '@jod-hai/shared';
import { ParsedTransaction } from './ClaudeAIService';

/**
 * Rule-based Thai/English transaction parser.
 * Used as fallback when ANTHROPIC_API_KEY is not set.
 *
 * Supported patterns (Thai + English):
 *   "กาแฟ 65"            → EXPENSE, Food, 65
 *   "ข้าว 45 บาท"        → EXPENSE, Food, 45
 *   "รับเงินเดือน 20000" → INCOME, Salary, 20000
 *   "เงินเดือน 25000"    → INCOME, Salary, 25000
 *   "ค่าน้ำมัน 500"      → EXPENSE, Transport, 500
 *   "coffee 85"          → EXPENSE, Food, 85
 */

type CategoryRule = {
  keywords: string[];
  category: string;
  type: TransactionType;
};

const RULES: CategoryRule[] = [
  // ── Income ────────────────────────────────────────────────────────────────
  { keywords: ['เงินเดือน', 'salary', 'salery', 'รับเงิน', 'ฝากเงิน', 'freelance', 'ค่าจ้าง', 'โบนัส', 'bonus'], category: 'Salary',        type: 'INCOME' },
  { keywords: ['ดอกเบี้ย', 'คืนเงิน', 'refund', 'interest', 'เงินปันผล', 'dividend'],                                category: 'Other',         type: 'INCOME' },
  { keywords: ['รายได้', 'income', 'ได้เงิน', 'รับเงิน'],                                                            category: 'Other',         type: 'INCOME' },

  // ── Food ─────────────────────────────────────────────────────────────────
  { keywords: ['กาแฟ', 'coffee', 'ชา', 'tea', 'นม', 'milk', 'ชานม', 'ไข่มุก', 'boba', 'bubble tea'],              category: 'Food',          type: 'EXPENSE' },
  { keywords: ['ข้าว', 'อาหาร', 'food', 'meal', 'ก๋วยเตี๋ยว', 'ส้มตำ', 'ลาบ', 'หมูกระทะ', 'บุฟเฟ่', 'sushi', 'pizza', 'burger', 'เบอร์เกอร์', 'ราดหน้า', 'ผัดไทย', 'ต้มยำ'], category: 'Food', type: 'EXPENSE' },
  { keywords: ['ขนม', 'snack', 'เค้ก', 'cake', 'ไอศกรีม', 'ice cream', 'ของกิน'],                                   category: 'Food',          type: 'EXPENSE' },
  { keywords: ['ร้านอาหาร', 'restaurant', 'delivery', 'เดลิเวอรี', 'grab food', 'foodpanda', 'line man'],          category: 'Food',          type: 'EXPENSE' },

  // ── Transport ─────────────────────────────────────────────────────────────
  { keywords: ['น้ำมัน', 'gas', 'ปั๊ม', 'xshell', 'xsell', 'gasoline', 'petrol', 'diesel'],                        category: 'Transport',     type: 'EXPENSE' },
  { keywords: ['grab', 'taxi', 'แท็กซี่', 'แท็กซี', 'bolt', 'uber', 'วิน', 'มอเตอร์ไซค์', 'motorcycle'],         category: 'Transport',     type: 'EXPENSE' },
  { keywords: ['bts', 'mrt', 'รถไฟฟ้า', 'สกายเทรน', 'subway', 'รถเมล์', 'bus', 'เรือ', 'boat', 'ferry'],          category: 'Transport',     type: 'EXPENSE' },
  { keywords: ['ค่าน้ำมัน', 'ค่าเดินทาง', 'transport', 'parking', 'ที่จอดรถ'],                                      category: 'Transport',     type: 'EXPENSE' },

  // ── Shopping ─────────────────────────────────────────────────────────────
  { keywords: ['ซื้อ', 'buy', 'ช้อป', 'shop', 'shopping', 'เสื้อ', 'กางเกง', 'รองเท้า', 'shoes', 'clothes'],      category: 'Shopping',      type: 'EXPENSE' },
  { keywords: ['shopee', 'lazada', 'amazon', 'aliexpress', 'จัตุจักร', 'ห้าง', 'mall', 'central', 'the mall'],     category: 'Shopping',      type: 'EXPENSE' },

  // ── Health ────────────────────────────────────────────────────────────────
  { keywords: ['ยา', 'medicine', 'drug', 'pharmacy', 'ร้านขายยา', 'หมอ', 'doctor', 'โรงพยาบาล', 'hospital', 'คลินิก', 'clinic', 'ฟัน', 'dentist'], category: 'Health', type: 'EXPENSE' },
  { keywords: ['ฟิตเนส', 'gym', 'fitness', 'วิ่ง', 'yoga', 'สุขภาพ', 'health'],                                     category: 'Health',        type: 'EXPENSE' },

  // ── Entertainment ─────────────────────────────────────────────────────────
  { keywords: ['หนัง', 'movie', 'cinema', 'โรงหนัง', 'netflix', 'spotify', 'youtube', 'game', 'เกม', 'คาราโอเกะ'], category: 'Entertainment', type: 'EXPENSE' },
  { keywords: ['concert', 'คอนเสิร์ต', 'เที่ยว', 'travel', 'ท่องเที่ยว', 'ทะเล', 'ภูเขา'],                         category: 'Entertainment', type: 'EXPENSE' },

  // ── Bills ─────────────────────────────────────────────────────────────────
  { keywords: ['ค่าไฟ', 'ไฟฟ้า', 'electricity', 'electric', 'pea', 'mea'],                                          category: 'Bills',         type: 'EXPENSE' },
  { keywords: ['ค่าน้ำ', 'ประปา', 'water bill', 'mwa'],                                                             category: 'Bills',         type: 'EXPENSE' },
  { keywords: ['ค่าเน็ต', 'internet', 'wifi', 'wi-fi', 'true', 'ais', 'dtac', 'nt', 'tot'],                        category: 'Bills',         type: 'EXPENSE' },
  { keywords: ['ค่าเช่า', 'rent', 'หอ', 'คอนโด', 'condo', 'apartment', 'ค่าห้อง'],                                 category: 'Bills',         type: 'EXPENSE' },
  { keywords: ['ประกัน', 'insurance', 'บัตรเครดิต', 'credit card'],                                                 category: 'Bills',         type: 'EXPENSE' },
];

/** Extract the first number found in the string */
function extractAmount(text: string): number | null {
  const match = text.match(/(\d[\d,]*\.?\d*)/);
  if (!match) return null;
  return parseFloat(match[1].replace(/,/g, ''));
}

/** Extract a note (non-numeric text after or before the number) */
function extractNote(text: string): string {
  return text.replace(/\d[\d,]*\.?\d*/g, '').replace(/บาท|thb|฿/gi, '').replace(/\s+/g, ' ').trim();
}

export function ruleBasedParse(rawMessage: string): ParsedTransaction {
  const lower = rawMessage.toLowerCase().trim();

  let matchedRule: CategoryRule | null = null;
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      matchedRule = rule;
      break;
    }
  }

  const amount = extractAmount(rawMessage);
  if (!amount || amount <= 0) {
    throw new Error(`Cannot extract amount from: "${rawMessage}"`);
  }

  const note = extractNote(rawMessage) || undefined;

  if (matchedRule) {
    return {
      amount,
      type: matchedRule.type,
      category: matchedRule.category,
      note,
    };
  }

  // Default: treat as expense, Other category
  return { amount, type: 'EXPENSE', category: 'Other', note };
}
