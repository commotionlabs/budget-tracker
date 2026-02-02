'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TransactionCard } from '@/components/TransactionCard';
import { TransactionDialog } from '@/components/TransactionDialog';
import { BudgetProgress } from '@/components/BudgetProgress';
import { CategoriesManager } from '@/components/CategoriesManager';
import { Transaction, BudgetData, TransactionType, Category, Budget, DEFAULT_CATEGORIES } from '@/types';
import { Plus, TrendingUp, TrendingDown, Wallet, RefreshCw, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function BudgetTracker() {
  const [data, setData] = useState<BudgetData>({ categories: DEFAULT_CATEGORIES, transactions: [], budgets: [] });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'transactions' | 'budgets' | 'settings'>('transactions');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/data');
      const json = await res.json();
      // Ensure categories exist, use defaults if not
      if (!json.categories || json.categories.length === 0) {
        json.categories = DEFAULT_CATEGORIES;
      }
      setData(json);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveData = async (newData: BudgetData) => {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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

  // Calculate totals for selected month
  const monthTransactions = data.transactions.filter(t => t.date.startsWith(selectedMonth));
  const totalIncome = monthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = monthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpenses;

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
    setData(newData);
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
      setData(newData);
      saveData(newData);
    } else {
      const newTransaction: Transaction = {
        id: `txn-${Date.now()}`,
        type: transactionData.type!,
        categoryId: transactionData.categoryId!,
        amount: transactionData.amount!,
        description: transactionData.description!,
        date: transactionData.date!,
        createdAt: now,
      };
      const newData = { ...data, transactions: [...data.transactions, newTransaction] };
      setData(newData);
      saveData(newData);
    }
  };

  // Category management handlers
  const handleAddCategory = (categoryData: Partial<Category>) => {
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      label: categoryData.label!,
      icon: categoryData.icon!,
      type: categoryData.type!,
      color: categoryData.color!,
    };
    const newData = { ...data, categories: [...data.categories, newCategory] };
    setData(newData);
    saveData(newData);
  };

  const handleEditCategory = (category: Category) => {
    const updatedCategories = data.categories.map(c =>
      c.id === category.id ? category : c
    );
    const newData = { ...data, categories: updatedCategories };
    setData(newData);
    saveData(newData);
  };

  const handleDeleteCategory = (id: string) => {
    // Check if category has transactions
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
    setData(newData);
    saveData(newData);
  };

  const handleUpdateBudget = (categoryId: string, limit: number) => {
    const existingBudget = data.budgets.find(b => b.categoryId === categoryId);
    let newBudgets: Budget[];
    
    if (limit === 0) {
      // Remove budget if limit is 0
      newBudgets = data.budgets.filter(b => b.categoryId !== categoryId);
    } else if (existingBudget) {
      // Update existing budget
      newBudgets = data.budgets.map(b =>
        b.categoryId === categoryId ? { ...b, limit } : b
      );
    } else {
      // Create new budget
      newBudgets = [...data.budgets, { categoryId, limit, period: 'monthly' as const }];
    }
    
    const newData = { ...data, budgets: newBudgets };
    setData(newData);
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
                <p className="text-xs text-muted-foreground">Budget Tracker</p>
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
              <p className="text-sm text-muted-foreground">Budget Tracker</p>
            </div>
            <div className="flex items-center gap-3">
              {view !== 'settings' && (
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
              <Button variant="outline" onClick={() => setView(view === 'settings' ? 'transactions' : 'settings')}>
                <Settings className="h-4 w-4 mr-2" />
                {view === 'settings' ? 'Back' : 'Categories'}
              </Button>
              {view !== 'settings' && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {view === 'settings' ? (
          <CategoriesManager
            categories={data.categories}
            budgets={data.budgets}
            transactions={data.transactions}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            onUpdateBudget={handleUpdateBudget}
          />
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
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
                    <Wallet className="h-4 w-4 text-blue-500" />
                    <span className="text-xs sm:text-sm text-muted-foreground">Balance</span>
                  </div>
                  <p className={`text-sm sm:text-xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatAmount(balance)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Mobile View Tabs */}
            <div className="sm:hidden">
              <Tabs value={view} onValueChange={(v) => setView(v as 'transactions' | 'budgets')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="budgets">Budgets</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Content */}
            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
              {/* Transactions */}
              <div className={`sm:col-span-2 space-y-3 ${view === 'budgets' ? 'hidden sm:block' : ''}`}>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Transactions</h2>
                  <Select value={filterType} onValueChange={(v) => setFilterType(v as 'all' | TransactionType)}>
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expenses</SelectItem>
                    </SelectContent>
                  </Select>
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

              {/* Budgets Sidebar */}
              <div className={`${view === 'transactions' ? 'hidden sm:block' : ''}`}>
                <BudgetProgress
                  budgets={data.budgets}
                  transactions={data.transactions}
                  categories={data.categories}
                  month={selectedMonth}
                />
              </div>
            </div>
          </>
        )}
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
      />
    </div>
  );
}
