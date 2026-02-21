export type TransactionType = 'income' | 'expense' | 'transfer';
export type AccountType = 'checking' | 'savings' | 'credit_card' | 'loan' | 'investment' | 'cash';
export type GoalType = 'target_balance' | 'monthly_funding' | 'target_date';
export type DebtStrategy = 'snowball' | 'avalanche' | 'custom';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  lastReconciled: string | null;
  isActive: boolean;
  interestRate?: number; // For loans/credit cards
  creditLimit?: number;  // For credit cards
  institution?: string;
  notes?: string;
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  type: TransactionType;
  color: string;
  parentId?: string; // For subcategories
  isDebt?: boolean;  // Special debt categories
  isGoal?: boolean;  // Savings goal categories
}

export interface Transaction {
  id: string;
  type: TransactionType;
  accountId: string;
  toAccountId?: string; // For transfers
  categoryId: string;
  amount: number;
  description: string;
  date: string;
  createdAt: string;
  isReconciled: boolean;
  payee?: string;
  memo?: string;
  splits?: TransactionSplit[]; // For split transactions
}

export interface TransactionSplit {
  categoryId: string;
  amount: number;
  memo?: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  month: string; // YYYY-MM
  assigned: number;     // Money assigned to this envelope
  activity: number;     // Money spent/earned
  available: number;    // Money remaining in envelope
}

export interface Goal {
  id: string;
  categoryId: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  targetDate?: string;
  monthlyFunding?: number;
  currentAmount: number;
  isActive: boolean;
  createdAt: string;
}

export interface DebtAccount extends Account {
  type: 'credit_card' | 'loan';
  minimumPayment: number;
  payoffDate?: string;
  payoffAmount?: number;
  paymentStrategy: DebtStrategy;
  isInPayoffPlan: boolean;
}

export interface BudgetData {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  settings: BudgetSettings;
}

export interface BudgetSettings {
  currency: string;
  dateFormat: string;
  firstDayOfWeek: number;
  debtStrategy: DebtStrategy;
  autoAssignPriority: string[];
  ageOfMoney?: number;
}

// Enhanced categories with debt and savings goals
export const DEFAULT_CATEGORIES: Category[] = [
  // === INCOME CATEGORIES ===
  { id: 'salary', label: 'Salary', icon: '💼', type: 'income', color: 'bg-green-500' },
  { id: 'freelance', label: 'Freelance', icon: '💻', type: 'income', color: 'bg-green-400' },
  { id: 'investments', label: 'Investment Returns', icon: '📈', type: 'income', color: 'bg-green-600' },
  { id: 'side-hustle', label: 'Side Hustle', icon: '🚀', type: 'income', color: 'bg-green-300' },
  { id: 'refunds', label: 'Refunds', icon: '💰', type: 'income', color: 'bg-green-200' },
  { id: 'other-income', label: 'Other Income', icon: '💵', type: 'income', color: 'bg-green-300' },

  // === IMMEDIATE OBLIGATIONS ===
  { id: 'housing', label: 'Housing', icon: '🏠', type: 'expense', color: 'bg-red-500' },
  { id: 'utilities', label: 'Utilities', icon: '💡', type: 'expense', color: 'bg-orange-500' },
  { id: 'groceries', label: 'Groceries', icon: '🛒', type: 'expense', color: 'bg-blue-500' },
  { id: 'transportation', label: 'Transportation', icon: '🚗', type: 'expense', color: 'bg-yellow-500' },
  { id: 'insurance', label: 'Insurance', icon: '🛡️', type: 'expense', color: 'bg-purple-500' },
  { id: 'minimum-payments', label: 'Minimum Payments', icon: '💳', type: 'expense', color: 'bg-red-600', isDebt: true },

  // === TRUE EXPENSES ===
  { id: 'car-maintenance', label: 'Car Maintenance', icon: '🔧', type: 'expense', color: 'bg-indigo-500' },
  { id: 'home-maintenance', label: 'Home Maintenance', icon: '🔨', type: 'expense', color: 'bg-teal-500' },
  { id: 'healthcare', label: 'Healthcare', icon: '🏥', type: 'expense', color: 'bg-red-400' },
  { id: 'subscriptions', label: 'Subscriptions', icon: '📱', type: 'expense', color: 'bg-cyan-500' },
  { id: 'gifts', label: 'Gifts', icon: '🎁', type: 'expense', color: 'bg-pink-500' },
  { id: 'clothing', label: 'Clothing', icon: '👕', type: 'expense', color: 'bg-purple-400' },

  // === QUALITY OF LIFE ===
  { id: 'dining-out', label: 'Dining Out', icon: '🍽️', type: 'expense', color: 'bg-orange-400' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', type: 'expense', color: 'bg-pink-400' },
  { id: 'hobbies', label: 'Hobbies', icon: '🎨', type: 'expense', color: 'bg-indigo-400' },
  { id: 'personal-care', label: 'Personal Care', icon: '💇', type: 'expense', color: 'bg-teal-400' },
  { id: 'miscellaneous', label: 'Miscellaneous', icon: '📦', type: 'expense', color: 'bg-slate-500' },

  // === SAVINGS GOALS ===
  { id: 'emergency-fund', label: 'Emergency Fund', icon: '🛡️', type: 'expense', color: 'bg-green-700', isGoal: true },
  { id: 'vacation', label: 'Vacation', icon: '✈️', type: 'expense', color: 'bg-blue-600', isGoal: true },
  { id: 'house-down-payment', label: 'House Down Payment', icon: '🏡', type: 'expense', color: 'bg-green-800', isGoal: true },
  { id: 'retirement', label: 'Retirement', icon: '👴', type: 'expense', color: 'bg-indigo-700', isGoal: true },
  { id: 'new-car', label: 'New Car Fund', icon: '🚙', type: 'expense', color: 'bg-yellow-700', isGoal: true },

  // === DEBT PAYOFF ===
  { id: 'credit-card-1', label: 'Credit Card 1', icon: '💳', type: 'expense', color: 'bg-red-700', isDebt: true },
  { id: 'credit-card-2', label: 'Credit Card 2', icon: '💳', type: 'expense', color: 'bg-red-600', isDebt: true },
  { id: 'student-loan', label: 'Student Loans', icon: '🎓', type: 'expense', color: 'bg-red-800', isDebt: true },
  { id: 'personal-loan', label: 'Personal Loan', icon: '💸', type: 'expense', color: 'bg-red-500', isDebt: true },
];

export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'checking',
    name: 'Primary Checking',
    type: 'checking',
    balance: 0,
    lastReconciled: null,
    isActive: true,
    institution: 'Your Bank'
  },
  {
    id: 'savings',
    name: 'Savings Account',
    type: 'savings',
    balance: 0,
    lastReconciled: null,
    isActive: true,
    institution: 'Your Bank'
  },
];

export const DEFAULT_SETTINGS: BudgetSettings = {
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  firstDayOfWeek: 0, // Sunday
  debtStrategy: 'avalanche',
  autoAssignPriority: [],
};

export const COLOR_OPTIONS = [
  'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-teal-500',
  'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-slate-500',
  'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400', 'bg-teal-400',
  'bg-blue-400', 'bg-indigo-400', 'bg-purple-400', 'bg-pink-400', 'bg-cyan-500',
  'bg-red-700', 'bg-orange-700', 'bg-yellow-700', 'bg-green-700', 'bg-teal-700',
  'bg-blue-700', 'bg-indigo-700', 'bg-purple-700', 'bg-pink-700', 'bg-slate-700',
];

export const ICON_OPTIONS = [
  // Money & Finance
  '💼', '💰', '💵', '💳', '🏦', '📈', '📉', '💸', '🪙', '💎',
  // Housing & Utilities
  '🏠', '🏡', '🏢', '💡', '🔥', '💧', '📶', '🌐', '📺', '🔌',
  // Transportation
  '🚗', '🚙', '🚌', '🚊', '✈️', '🚲', '⛽', '🅿️', '🚇', '🛣️',
  // Food & Dining
  '🍽️', '🍕', '🍔', '🍝', '☕', '🍺', '🛒', '🥗', '🍩', '🧑‍🍳',
  // Health & Personal Care
  '🏥', '💊', '🦷', '💇', '🧴', '🧼', '👔', '👕', '👗', '👟',
  // Entertainment & Hobbies
  '🎬', '🎮', '🎵', '📚', '🎨', '🏋️', '⚽', '🎸', '📸', '🎭',
  // Goals & Savings
  '🎯', '🛡️', '🎁', '✈️', '🏖️', '👴', '👶', '🎓', '🚙', '📱',
  // Other
  '📦', '🔧', '🔨', '🛠️', '📋', '📅', '🔄', '⭐', '🚀', '🎊'
];