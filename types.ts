
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
}

export interface Summary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
}

export const CATEGORIES = [
  'Makanan',
  'Transportasi',
  'Hiburan',
  'Belanja',
  'Kesehatan',
  'Tagihan',
  'Lainnya'
] as const;

export type Category = typeof CATEGORIES[number];
