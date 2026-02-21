'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  PlusIcon, 
  MinusIcon, 
  TrendingUpIcon, 
  TrendingDownIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  DollarSignIcon,
  TargetIcon,
  CreditCardIcon
} from 'lucide-react';
import { BudgetData, Category, Budget, Account } from '@/types';
import BudgetEngine from '@/lib/budget-engine';

interface EnvelopeBudgetProps {
  data: BudgetData;
  month: string;
  onUpdateBudget: (budgets: Budget[]) => void;
}

export function EnvelopeBudget({ data, month, onUpdateBudget }: EnvelopeBudgetProps) {
  const [engine] = useState(() => new BudgetEngine(data));
  const [assignmentAmounts, setAssignmentAmounts] = useState<{ [key: string]: string }>({});

  // Calculate budget summary
  const budgetSummary = useMemo(() => 
    engine.getMonthlyBudgetSummary(month), [engine, month]
  );

  // Group categories by type
  const categoryGroups = useMemo(() => {
    const groups = {
      immediate: data.categories.filter(c => 
        c.type === 'expense' && !c.isDebt && !c.isGoal &&
        ['housing', 'utilities', 'groceries', 'transportation', 'insurance', 'minimum-payments'].includes(c.id)
      ),
      trueExpenses: data.categories.filter(c => 
        c.type === 'expense' && !c.isDebt && !c.isGoal &&
        !['housing', 'utilities', 'groceries', 'transportation', 'insurance', 'minimum-payments'].includes(c.id)
      ),
      goals: data.categories.filter(c => c.isGoal),
      debts: data.categories.filter(c => c.isDebt)
    };
    return groups;
  }, [data.categories]);

  // Get budget for category
  const getCategoryBudget = (categoryId: string): Budget | null => {
    return data.budgets.find(b => b.categoryId === categoryId && b.month === month) || null;
  };

  // Calculate category available amount
  const getCategoryAvailable = (categoryId: string): number => {
    return engine.calculateCategoryAvailable(categoryId, month);
  };

  // Handle money assignment
  const handleAssignMoney = (categoryId: string, amount: number) => {
    if (amount === 0) return;
    
    const newBudget = engine.assignMoney(categoryId, month, amount);
    const updatedBudgets = data.budgets.filter(b => 
      !(b.categoryId === categoryId && b.month === month)
    );
    updatedBudgets.push(newBudget);
    
    onUpdateBudget(updatedBudgets);
    setAssignmentAmounts(prev => ({ ...prev, [categoryId]: '' }));
  };

  // Handle quick assignment buttons
  const handleQuickAssign = (categoryId: string, amount: number) => {
    handleAssignMoney(categoryId, amount);
  };

  // Auto-assign money
  const handleAutoAssign = () => {
    const assigned = engine.autoAssignMoney(month, data.settings.autoAssignPriority);
    if (assigned.length > 0) {
      const updatedBudgets = [...data.budgets];
      assigned.forEach(newBudget => {
        const existingIndex = updatedBudgets.findIndex(b => 
          b.categoryId === newBudget.categoryId && b.month === month
        );
        if (existingIndex >= 0) {
          updatedBudgets[existingIndex] = newBudget;
        } else {
          updatedBudgets.push(newBudget);
        }
      });
      onUpdateBudget(updatedBudgets);
    }
  };

  // Format currency
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.settings.currency
    }).format(amount);
  };

  // Get category status
  const getCategoryStatus = (categoryId: string) => {
    const available = getCategoryAvailable(categoryId);
    const budget = getCategoryBudget(categoryId);
    
    if (available < 0) return { type: 'overspent', color: 'text-red-600', icon: AlertTriangleIcon };
    if (available === 0 && budget?.assigned > 0) return { type: 'spent', color: 'text-yellow-600', icon: TrendingDownIcon };
    if (available > 0) return { type: 'available', color: 'text-green-600', icon: CheckCircleIcon };
    return { type: 'empty', color: 'text-gray-400', icon: DollarSignIcon };
  };

  // Category row component
  const CategoryRow = ({ category, group }: { category: Category; group: string }) => {
    const budget = getCategoryBudget(category.id);
    const available = getCategoryAvailable(category.id);
    const assigned = budget?.assigned || 0;
    const activity = budget?.activity || 0;
    const status = getCategoryStatus(category.id);
    const Icon = status.icon;

    return (
      <div className="flex items-center gap-3 p-3 bg-background border rounded-lg">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${category.color} text-white text-sm`}>
            {category.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-sm truncate">{category.label}</h4>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon className="h-3 w-3" />
              <span className={status.color}>
                {status.type === 'overspent' && `Overspent ${formatAmount(Math.abs(available))}`}
                {status.type === 'spent' && 'Fully spent'}
                {status.type === 'available' && `${formatAmount(available)} available`}
                {status.type === 'empty' && 'Not budgeted'}
              </span>
            </div>
          </div>
        </div>

        {/* Budget amounts */}
        <div className="grid grid-cols-3 gap-2 text-xs min-w-[180px]">
          <div className="text-center">
            <div className="text-muted-foreground">Assigned</div>
            <div className="font-medium">{formatAmount(assigned)}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Activity</div>
            <div className={`font-medium ${activity < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatAmount(activity)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground">Available</div>
            <div className={`font-medium ${available < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatAmount(available)}
            </div>
          </div>
        </div>

        {/* Assignment controls */}
        <div className="flex items-center gap-1">
          {budgetSummary.toBeBudgeted > 0 && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={() => handleQuickAssign(category.id, -10)}
                disabled={assigned <= 0}
              >
                <MinusIcon className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                placeholder="0"
                value={assignmentAmounts[category.id] || ''}
                onChange={(e) => setAssignmentAmounts(prev => ({ ...prev, [category.id]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const amount = parseFloat(assignmentAmounts[category.id] || '0');
                    handleAssignMoney(category.id, amount);
                  }
                }}
                className="w-16 h-7 text-xs text-center"
              />
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 p-0"
                onClick={() => handleQuickAssign(category.id, 10)}
              >
                <PlusIcon className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  // Group header component
  const GroupHeader = ({ title, icon, categories }: { title: string; icon: React.ReactNode; categories: Category[] }) => {
    const totalAssigned = categories.reduce((sum, cat) => {
      const budget = getCategoryBudget(cat.id);
      return sum + (budget?.assigned || 0);
    }, 0);

    const totalAvailable = categories.reduce((sum, cat) => {
      return sum + getCategoryAvailable(cat.id);
    }, 0);

    return (
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold">{title}</h3>
          <Badge variant="outline" className="text-xs">
            {categories.length} categories
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-center">
            <div className="text-muted-foreground text-xs">Assigned</div>
            <div className="font-medium">{formatAmount(totalAssigned)}</div>
          </div>
          <div className="text-center">
            <div className="text-muted-foreground text-xs">Available</div>
            <div className={`font-medium ${totalAvailable < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatAmount(totalAvailable)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Budget Summary Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSignIcon className="h-5 w-5" />
            Budget Summary - {month}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatAmount(budgetSummary.availableToBudget)}
              </div>
              <div className="text-sm text-muted-foreground">Available to Budget</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatAmount(budgetSummary.totalAssigned)}
              </div>
              <div className="text-sm text-muted-foreground">Total Assigned</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${budgetSummary.toBeBudgeted < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatAmount(budgetSummary.toBeBudgeted)}
              </div>
              <div className="text-sm text-muted-foreground">To Be Budgeted</div>
            </div>
            <div className="text-center">
              <Button 
                onClick={handleAutoAssign}
                disabled={budgetSummary.toBeBudgeted <= 0}
                className="w-full"
              >
                Auto Assign
              </Button>
            </div>
          </div>
          
          {budgetSummary.isOverAssigned && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangleIcon className="h-4 w-4" />
                <span className="font-medium">Over-assigned by {formatAmount(Math.abs(budgetSummary.toBeBudgeted))}</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                You've assigned more money than you have available. Remove money from categories or add more income.
              </p>
            </div>
          )}
          
          {budgetSummary.isFullyAssigned && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircleIcon className="h-4 w-4" />
                <span className="font-medium">All money assigned!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Great job! Every dollar has been given a job.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Immediate Obligations */}
      <div className="space-y-4">
        <GroupHeader 
          title="Immediate Obligations" 
          icon={<AlertTriangleIcon className="h-5 w-5 text-red-500" />}
          categories={categoryGroups.immediate}
        />
        <div className="space-y-2">
          {categoryGroups.immediate.map(category => (
            <CategoryRow key={category.id} category={category} group="immediate" />
          ))}
        </div>
      </div>

      {/* Debt Payoff */}
      {categoryGroups.debts.length > 0 && (
        <div className="space-y-4">
          <GroupHeader 
            title="Debt Payoff" 
            icon={<CreditCardIcon className="h-5 w-5 text-red-600" />}
            categories={categoryGroups.debts}
          />
          <div className="space-y-2">
            {categoryGroups.debts.map(category => (
              <CategoryRow key={category.id} category={category} group="debts" />
            ))}
          </div>
        </div>
      )}

      {/* Savings Goals */}
      {categoryGroups.goals.length > 0 && (
        <div className="space-y-4">
          <GroupHeader 
            title="Savings Goals" 
            icon={<TargetIcon className="h-5 w-5 text-green-600" />}
            categories={categoryGroups.goals}
          />
          <div className="space-y-2">
            {categoryGroups.goals.map(category => (
              <CategoryRow key={category.id} category={category} group="goals" />
            ))}
          </div>
        </div>
      )}

      {/* True Expenses */}
      <div className="space-y-4">
        <GroupHeader 
          title="True Expenses" 
          icon={<TrendingDownIcon className="h-5 w-5 text-blue-500" />}
          categories={categoryGroups.trueExpenses}
        />
        <div className="space-y-2">
          {categoryGroups.trueExpenses.map(category => (
            <CategoryRow key={category.id} category={category} group="expenses" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default EnvelopeBudget;