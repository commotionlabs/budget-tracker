'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Transaction, TransactionType, Category } from '@/types';

interface TransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (transaction: Partial<Transaction> & { id?: string }) => void;
  transaction?: Transaction | null;
  categories: Category[];
}

export function TransactionDialog({ 
  open, 
  onClose, 
  onSave, 
  transaction,
  categories
}: TransactionDialogProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setCategoryId(transaction.categoryId);
      setAmount(transaction.amount.toString());
      setDescription(transaction.description);
      setDate(transaction.date);
    } else {
      setType('expense');
      setCategoryId(expenseCategories[0]?.id || '');
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [transaction, open, expenseCategories]);

  // Reset category when type changes
  useEffect(() => {
    const currentCategory = categories.find(c => c.id === categoryId);
    if (currentCategory && currentCategory.type !== type) {
      const defaultCategory = type === 'income' ? incomeCategories[0] : expenseCategories[0];
      setCategoryId(defaultCategory?.id || '');
    }
  }, [type, categoryId, categories, incomeCategories, expenseCategories]);

  const handleSave = () => {
    const transactionData: Partial<Transaction> & { id?: string } = {
      type,
      categoryId,
      amount: parseFloat(amount),
      description,
      date,
    };

    if (transaction) {
      transactionData.id = transaction.id;
    }

    onSave(transactionData);
    onClose();
  };

  const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto w-[calc(100%-2rem)] rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {transaction ? 'Edit Transaction' : 'New Transaction'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 sm:py-4">
          <Tabs value={type} onValueChange={(v) => setType(v as TransactionType)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expense" className="text-red-600 dark:text-red-400 data-[state=active]:bg-red-50 dark:data-[state=active]:bg-red-900/30">
                Expense
              </TabsTrigger>
              <TabsTrigger value="income" className="text-green-600 dark:text-green-400 data-[state=active]:bg-green-50 dark:data-[state=active]:bg-green-900/30">
                Income
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-7 h-10"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {currentCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this for?"
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10"
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto order-2 sm:order-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!amount || !description || !categoryId || parseFloat(amount) <= 0}
            className={`w-full sm:w-auto order-1 sm:order-2 text-white ${
              type === 'income' ? 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600' : 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
            }`}
          >
            {transaction ? 'Save Changes' : `Add ${type === 'income' ? 'Income' : 'Expense'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
