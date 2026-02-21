'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TransactionCard } from '@/components/TransactionCard';
import { TransactionDialog } from '@/components/TransactionDialog';
import { BudgetProgress } from '@/components/BudgetProgress';
import { CategoriesManager } from '@/components/CategoriesManager';
import { EnvelopeBudget } from '@/components/EnvelopeBudget';
import { DebtDashboard } from '@/components/DebtDashboard';
import { GoalsTracker } from '@/components/GoalsTracker';
import { 
  Transaction, 
  BudgetData, 
  TransactionType, 
  Category, 
  Budget, 
  Account,
  Goal,
  DEFAULT_CATEGORIES,
  DEFAULT_ACCOUNTS,
  DEFAULT_SETTINGS
} from '@/types';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  Settings,
  DollarSignIcon,
  CreditCardIcon,
  TargetIcon,
  BarChart3Icon,
  PiggyBankIcon,
  HomeIcon
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import BudgetEngine from '@/lib/budget-engine';

export default function BudgetTracker() {
  const [data, setData] = useState<BudgetData>({ 
    accounts: DEFAULT_ACCOUNTS,
    categories: DEFAULT_CATEGORIES, 
    transactions: [], 
    budgets: [],
    goals: [],
    settings: DEFAULT_SETTINGS
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'budget' | 'transactions' | 'debts' | 'goals' | 'reports' | 'settings'>('budget');

  const fetchData = useCallback(async () => {
    try {
      // For GitHub Pages static deployment, use localStorage
      const savedData = localStorage.getItem('budget-tracker-data');
      if (savedData) {
        const json = JSON.parse(savedData);
        
        // Ensure all required fields exist with defaults
        const enhancedData: BudgetData = {
          accounts: json.accounts || DEFAULT_ACCOUNTS,
          categories: json.categories && json.categories.length > 0 ? json.categories : DEFAULT_CATEGORIES,
          transactions: json.transactions || [],
          budgets: json.budgets || [],
          goals: json.goals || [],
          settings: { ...DEFAULT_SETTINGS, ...json.settings }
        };
        
        setData(enhancedData);
      } else {
        // Use defaults if no saved data
        setData({
          accounts: DEFAULT_ACCOUNTS,
          categories: DEFAULT_CATEGORIES,
          transactions: [],
          budgets: [],
          goals: [],
          settings: DEFAULT_SETTINGS
        });
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      // Use defaults if parsing fails
      setData({
        accounts: DEFAULT_ACCOUNTS,
        categories: DEFAULT_CATEGORIES,
        transactions: [],
        budgets: [],
        goals: [],
        settings: DEFAULT_SETTINGS
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const saveData = async (newData: BudgetData) => {
    try {
      // For GitHub Pages static deployment, use localStorage
      localStorage.setItem('budget-tracker-data', JSON.stringify(newData));
      setData(newData);
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initialize budget engine
  const engine = new BudgetEngine(data);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.settings.currency,
    }).format(amount);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    date.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1));
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const getCategory = (categoryId: string) => {
    return data.categories.find(c => c.id === categoryId);
  };

  // Calculate financial overview
  const monthTransactions = data.transactions.filter(t => t.date.startsWith(selectedMonth));
  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpenses;
  
  // Get budget summary
  const budgetSummary = engine.getMonthlyBudgetSummary(selectedMonth);
  
  // Get net worth
  const netWorth = engine.calculateNetWorth();
  
  // Get debt overview
  const debtAccounts = engine.getDebtAccounts();
  const totalDebt = debtAccounts.reduce((sum, account) => sum + Math.abs(account.balance), 0);

  // Filter transactions
  const filteredTransactions = monthTransactions
    .filter(t => filterType === 'all' || t.type === filterType)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const newData = {
      ...data,
      transactions: data.transactions.filter(t => t.id !== id),
    };
    saveData(newData);
  };

  const handleSaveTransaction = (transactionData: Partial<Transaction> & { id?: string }) => {
    const now = new Date().toISOString();
    
    if (transactionData.id) {
      const updatedTransactions = data.transactions.map(t =>
        t.id === transactionData.id
          ? { ...t, ...transactionData }
          : t
      );
      const newData = { ...data, transactions: updatedTransactions };
      saveData(newData);
    } else {
      const newTransaction: Transaction = {
        id: `txn-${Date.now()}`,
        type: transactionData.type!,
        accountId: transactionData.accountId || data.accounts[0]?.id || 'checking',
        categoryId: transactionData.categoryId!,
        amount: transactionData.amount!,
        description: transactionData.description!,
        date: transactionData.date!,
        createdAt: now,
        isReconciled: false
      };
      const newData = { ...data, transactions: [...data.transactions, newTransaction] };
      saveData(newData);
    }
  };

  // Budget management handlers
  const handleUpdateBudget = (budgets: Budget[]) => {
    const newData = { ...data, budgets };
    saveData(newData);
  };

  // Account management handlers
  const handleUpdateAccount = (account: Account) => {
    const updatedAccounts = data.accounts.map(a =>
      a.id === account.id ? account : a
    );
    const newData = { ...data, accounts: updatedAccounts };
    saveData(newData);
  };

  // Settings management handlers
  const handleUpdateSettings = (settings: Partial<BudgetData['settings']>) => {
    const newData = { ...data, settings: { ...data.settings, ...settings } };
    saveData(newData);
  };

  // Goal management handlers
  const handleAddGoal = (goalData: Partial<Goal>) => {
    const newGoal: Goal = {
      ...goalData as Goal,
      id: `goal-${Date.now()}`
    };
    const newData = { ...data, goals: [...data.goals, newGoal] };
    saveData(newData);
  };

  const handleUpdateGoal = (goal: Goal) => {
    const updatedGoals = data.goals.map(g => g.id === goal.id ? goal : g);
    const newData = { ...data, goals: updatedGoals };
    saveData(newData);
  };

  const handleDeleteGoal = (goalId: string) => {
    const newData = { ...data, goals: data.goals.filter(g => g.id !== goalId) };
    saveData(newData);
  };

  // Category management handlers
  const handleAddCategory = (categoryData: Partial<Category>) => {
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      label: categoryData.label!,
      icon: categoryData.icon!,
      type: categoryData.type!,
      color: categoryData.color!,
      isDebt: categoryData.isDebt || false,
      isGoal: categoryData.isGoal || false
    };
    const newData = { ...data, categories: [...data.categories, newCategory] };
    saveData(newData);
  };

  const handleEditCategory = (category: Category) => {
    const updatedCategories = data.categories.map(c =>
      c.id === category.id ? category : c
    );
    const newData = { ...data, categories: updatedCategories };
    saveData(newData);
  };

  const handleDeleteCategory = (id: string) => {
    const hasTransactions = data.transactions.some(t => t.categoryId === id);
    if (hasTransactions) {
      alert('Cannot delete category with existing transactions');
      return;
    }
    const newData = {
      ...data,
      categories: data.categories.filter(c => c.id !== id),
      budgets: data.budgets.filter(b => b.categoryId !== id),
    };
    saveData(newData);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* Mobile Header */}
          <div className="flex flex-col gap-3 sm:hidden">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">Commotion Labs</h1>
                <p className="text-xs text-muted-foreground">YNAB-Style Budget Tracker</p>
              </div>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <Button size="sm" variant="ghost" onClick={() => setView('settings')}>
                  <Settings className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {view !== 'settings' && (
              <div className="flex items-center justify-between bg-muted/50 rounded-lg p-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium text-sm">{formatMonth(selectedMonth)}</span>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Desktop Header */}
          <div className="hidden sm:flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Commotion Labs</h1>
              <p className="text-sm text-muted-foreground">YNAB-Style Budget Tracker</p>
            </div>
            <div className="flex items-center gap-3">
              {view !== 'settings' && view !== 'reports' && (
                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium text-sm px-2 min-w-[140px] text-center">
                    {formatMonth(selectedMonth)}
                  </span>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <ThemeToggle />
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Financial Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 mb-6">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <HomeIcon className="h-4 w-4 text-blue-500" />
                <span className="text-xs sm:text-sm text-muted-foreground">Net Worth</span>
              </div>
              <p className={`text-sm sm:text-xl font-bold ${netWorth.netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatAmount(netWorth.netWorth)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-xs sm:text-sm text-muted-foreground">Income</span>
              </div>
              <p className="text-sm sm:text-xl font-bold text-green-600">
                {formatAmount(totalIncome)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-xs sm:text-sm text-muted-foreground">Expenses</span>
              </div>
              <p className="text-sm sm:text-xl font-bold text-red-600">
                {formatAmount(totalExpenses)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <CreditCardIcon className="h-4 w-4 text-red-600" />
                <span className="text-xs sm:text-sm text-muted-foreground">Total Debt</span>
              </div>
              <p className="text-sm sm:text-xl font-bold text-red-600">
                {formatAmount(totalDebt)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <DollarSignIcon className="h-4 w-4 text-blue-500" />
                <span className="text-xs sm:text-sm text-muted-foreground">To Budget</span>
              </div>
              <p className={`text-sm sm:text-xl font-bold ${budgetSummary.toBeBudgeted >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatAmount(budgetSummary.toBeBudgeted)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={view} onValueChange={(v) => setView(v as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="budget" className="flex items-center gap-2">
              <DollarSignIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Budget</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Transactions</span>
            </TabsTrigger>
            <TabsTrigger value="debts" className="flex items-center gap-2">
              <CreditCardIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Debts</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-2">
              <TargetIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Goals</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart3Icon className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Envelope Budget Tab */}
          <TabsContent value="budget">
            <EnvelopeBudget
              data={data}
              month={selectedMonth}
              onUpdateBudget={handleUpdateBudget}
            />
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="sm:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Transactions</h2>
                </div>
                <div className="space-y-2">
                  {filteredTransactions.map((transaction) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      category={getCategory(transaction.categoryId)}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                  {filteredTransactions.length === 0 && (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        No transactions for {formatMonth(selectedMonth)}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
              <div>
                <BudgetProgress
                  budgets={data.budgets}
                  transactions={data.transactions}
                  categories={data.categories}
                  month={selectedMonth}
                />
              </div>
            </div>
          </TabsContent>

          {/* Debt Management Tab */}
          <TabsContent value="debts">
            <DebtDashboard
              data={data}
              onUpdateAccount={handleUpdateAccount}
              onUpdateSettings={handleUpdateSettings}
            />
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals">
            <GoalsTracker
              data={data}
              onAddGoal={handleAddGoal}
              onUpdateGoal={handleUpdateGoal}
              onDeleteGoal={handleDeleteGoal}
            />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Reports Coming Soon</h3>
                <p className="text-muted-foreground">
                  Advanced financial reports and analytics will be available in the next update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <CategoriesManager
              categories={data.categories}
              budgets={data.budgets}
              transactions={data.transactions}
              onAddCategory={handleAddCategory}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
              onUpdateBudget={(categoryId, limit) => {
                const existingBudget = data.budgets.find(b => b.categoryId === categoryId);
                let newBudgets: Budget[];
                
                if (limit === 0) {
                  newBudgets = data.budgets.filter(b => b.categoryId !== categoryId);
                } else if (existingBudget) {
                  newBudgets = data.budgets.map(b =>
                    b.categoryId === categoryId ? { ...b, assigned: limit } : b
                  );
                } else {
                  newBudgets = [...data.budgets, { 
                    id: `budget-${Date.now()}-${categoryId}`,
                    categoryId, 
                    assigned: limit, 
                    month: selectedMonth,
                    activity: 0,
                    available: limit
                  }];
                }
                
                const newData = { ...data, budgets: newBudgets };
                saveData(newData);
              }}
            />
          </TabsContent>
        </Tabs>
      </main>

      <TransactionDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        transaction={editingTransaction}
        categories={data.categories}
        accounts={data.accounts}
      />
    </div>
  );
}