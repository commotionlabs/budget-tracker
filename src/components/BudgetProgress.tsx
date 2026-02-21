'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Budget, Transaction, Category } from '@/types';

interface BudgetProgressProps {
  budgets: Budget[];
  transactions: Transaction[];
  categories: Category[];
  month: string; // YYYY-MM format
}

export function BudgetProgress({ budgets, transactions, categories, month }: BudgetProgressProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategory = (categoryId: string) => {
    return categories.find(c => c.id === categoryId);
  };

  const getSpentByCategory = (categoryId: string) => {
    return transactions
      .filter(t => 
        t.categoryId === categoryId && 
        t.type === 'expense' &&
        t.date.startsWith(month)
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const sortedBudgets = [...budgets]
    .filter(b => getCategory(b.categoryId) && b.assigned > 0) // Only show budgets for existing categories with assigned money
    .sort((a, b) => {
      const aSpent = getSpentByCategory(a.categoryId);
      const bSpent = getSpentByCategory(b.categoryId);
      const aPercent = a.assigned > 0 ? (aSpent / a.assigned) * 100 : 0;
      const bPercent = b.assigned > 0 ? (bSpent / b.assigned) * 100 : 0;
      return bPercent - aPercent;
    });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Budget Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedBudgets.map((budget) => {
          const category = getCategory(budget.categoryId);
          if (!category) return null;
          
          const spent = getSpentByCategory(budget.categoryId);
          const percentage = budget.assigned > 0 ? Math.min((spent / budget.assigned) * 100, 100) : 0;
          const isOverBudget = spent > budget.assigned;
          const remaining = budget.assigned - spent;

          return (
            <div key={budget.categoryId} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span className="font-medium">{category.label}</span>
                </div>
                <div className="text-right">
                  <span className={isOverBudget ? 'text-red-600 font-medium' : ''}>
                    {formatAmount(spent)}
                  </span>
                  <span className="text-muted-foreground"> / {formatAmount(budget.assigned)}</span>
                </div>
              </div>
              <Progress 
                value={percentage} 
                className={`h-2 ${isOverBudget ? '[&>div]:bg-red-500' : ''}`}
              />
              <p className={`text-xs ${isOverBudget ? 'text-red-600' : 'text-muted-foreground'}`}>
                {isOverBudget 
                  ? `${formatAmount(Math.abs(remaining))} over budget`
                  : `${formatAmount(remaining)} remaining`
                }
              </p>
            </div>
          );
        })}
        {sortedBudgets.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No budgets set
          </p>
        )}
      </CardContent>
    </Card>
  );
}
