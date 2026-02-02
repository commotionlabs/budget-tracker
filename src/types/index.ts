export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  label: string;
  icon: string;
  type: TransactionType;
  color: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  categoryId: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface Budget {
  categoryId: string;
  limit: number;
  period: 'monthly';
}

export interface BudgetData {
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
}

export const DEFAULT_CATEGORIES: Category[] = [
  // Income categories
  { id: 'salary', label: 'Salary', icon: '💼', type: 'income', color: 'bg-green-500' },
  { id: 'freelance', label: 'Freelance', icon: '💻', type: 'income', color: 'bg-green-400' },
  { id: 'investments', label: 'Investments', icon: '📈', type: 'income', color: 'bg-green-600' },
  { id: 'other-income', label: 'Other Income', icon: '💰', type: 'income', color: 'bg-green-300' },
  // Expense categories
  { id: 'housing', label: 'Housing', icon: '🏠', type: 'expense', color: 'bg-blue-500' },
  { id: 'transportation', label: 'Transportation', icon: '🚗', type: 'expense', color: 'bg-yellow-500' },
  { id: 'food', label: 'Food & Dining', icon: '🍽️', type: 'expense', color: 'bg-orange-500' },
  { id: 'utilities', label: 'Utilities', icon: '💡', type: 'expense', color: 'bg-purple-500' },
  { id: 'healthcare', label: 'Healthcare', icon: '🏥', type: 'expense', color: 'bg-red-500' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', type: 'expense', color: 'bg-pink-500' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', type: 'expense', color: 'bg-indigo-500' },
  { id: 'subscriptions', label: 'Subscriptions', icon: '📱', type: 'expense', color: 'bg-cyan-500' },
  { id: 'other-expense', label: 'Other', icon: '📦', type: 'expense', color: 'bg-slate-500' },
];

export const COLOR_OPTIONS = [
  'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-teal-500',
  'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-slate-500',
  'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-teal-400',
  'bg-blue-400', 'bg-indigo-400', 'bg-purple-400', 'bg-pink-400', 'bg-cyan-500',
];

export const ICON_OPTIONS = [
  '💼', '💻', '📈', '💰', '🏠', '🚗', '🍽️', '💡', '🏥', '🎬',
  '🛍️', '📱', '📦', '✈️', '🎮', '📚', '🎵', '🏋️', '🐕', '👶',
  '💳', '🎁', '☕', '🍕', '🚌', '⛽', '💊', '🦷', '👔', '💇',
];
