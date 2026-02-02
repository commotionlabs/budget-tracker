'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Category, Budget, Transaction } from '@/types';
import { CategoryDialog } from './CategoryDialog';
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

interface CategoriesManagerProps {
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  onAddCategory: (category: Partial<Category>) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onUpdateBudget: (categoryId: string, limit: number) => void;
}

export function CategoriesManager({
  categories,
  budgets,
  transactions,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onUpdateBudget,
}: CategoriesManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetValue, setBudgetValue] = useState('');

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const getBudgetForCategory = (categoryId: string) => {
    return budgets.find(b => b.categoryId === categoryId);
  };

  const getTransactionCount = (categoryId: string) => {
    return transactions.filter(t => t.categoryId === categoryId).length;
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleSaveCategory = (categoryData: Partial<Category> & { id?: string }) => {
    if (categoryData.id) {
      const existing = categories.find(c => c.id === categoryData.id);
      if (existing) {
        onEditCategory({ ...existing, ...categoryData } as Category);
      }
    } else {
      onAddCategory(categoryData);
    }
  };

  const handleStartEditBudget = (categoryId: string) => {
    const budget = getBudgetForCategory(categoryId);
    setBudgetValue(budget ? budget.limit.toString() : '');
    setEditingBudget(categoryId);
  };

  const handleSaveBudget = (categoryId: string) => {
    const limit = parseFloat(budgetValue) || 0;
    onUpdateBudget(categoryId, limit);
    setEditingBudget(null);
    setBudgetValue('');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const CategoryItem = ({ category }: { category: Category }) => {
    const budget = getBudgetForCategory(category.id);
    const txnCount = getTransactionCount(category.id);
    const canDelete = txnCount === 0;

    return (
      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 group">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
          category.type === 'income' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'
        }`}>
          {category.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{category.label}</p>
          <p className="text-xs text-muted-foreground">
            {txnCount} transaction{txnCount !== 1 ? 's' : ''}
          </p>
        </div>
        {category.type === 'expense' && (
          <div className="text-right">
            {editingBudget === category.id ? (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={budgetValue}
                  onChange={(e) => setBudgetValue(e.target.value)}
                  className="w-24 h-8 text-sm"
                  placeholder="0"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveBudget(category.id);
                    if (e.key === 'Escape') setEditingBudget(null);
                  }}
                />
                <Button size="sm" className="h-8" onClick={() => handleSaveBudget(category.id)}>
                  Save
                </Button>
              </div>
            ) : (
              <button
                onClick={() => handleStartEditBudget(category.id)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {budget ? formatAmount(budget.limit) : 'Set budget'}
              </button>
            )}
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(category)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDeleteCategory(category.id)}
              disabled={!canDelete}
              className={canDelete ? 'text-red-600' : 'text-muted-foreground'}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {canDelete ? 'Delete' : 'Has transactions'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">Expense Categories</CardTitle>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setEditingCategory(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardHeader>
          <CardContent className="divide-y">
            {expenseCategories.map((category) => (
              <CategoryItem key={category.id} category={category} />
            ))}
            {expenseCategories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No expense categories
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">Income Categories</CardTitle>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setEditingCategory(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardHeader>
          <CardContent className="divide-y">
            {incomeCategories.map((category) => (
              <CategoryItem key={category.id} category={category} />
            ))}
            {incomeCategories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No income categories
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <CategoryDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        category={editingCategory}
      />
    </>
  );
}
