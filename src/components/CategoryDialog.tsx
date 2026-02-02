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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Category, TransactionType, COLOR_OPTIONS, ICON_OPTIONS } from '@/types';

interface CategoryDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (category: Partial<Category> & { id?: string }) => void;
  category?: Category | null;
}

export function CategoryDialog({ 
  open, 
  onClose, 
  onSave, 
  category
}: CategoryDialogProps) {
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('📦');
  const [type, setType] = useState<TransactionType>('expense');
  const [color, setColor] = useState('bg-slate-500');

  useEffect(() => {
    if (category) {
      setLabel(category.label);
      setIcon(category.icon);
      setType(category.type);
      setColor(category.color);
    } else {
      setLabel('');
      setIcon('📦');
      setType('expense');
      setColor('bg-slate-500');
    }
  }, [category, open]);

  const handleSave = () => {
    const categoryData: Partial<Category> & { id?: string } = {
      label,
      icon,
      type,
      color,
    };

    if (category) {
      categoryData.id = category.id;
    }

    onSave(categoryData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto w-[calc(100%-2rem)] rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {category ? 'Edit Category' : 'New Category'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2 sm:py-4">
          <Tabs value={type} onValueChange={(v) => setType(v as TransactionType)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expense" className="text-red-600 data-[state=active]:bg-red-50">
                Expense
              </TabsTrigger>
              <TabsTrigger value="income" className="text-green-600 data-[state=active]:bg-green-50">
                Income
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Category name..."
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Icon</label>
            <div className="grid grid-cols-10 gap-1">
              {ICON_OPTIONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`w-8 h-8 text-lg rounded flex items-center justify-center transition-all ${
                    icon === i 
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' 
                      : 'hover:bg-muted'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Color</label>
            <div className="grid grid-cols-10 gap-1">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded ${c} transition-all ${
                    color === c 
                      ? 'ring-2 ring-primary ring-offset-2' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
              type === 'income' ? 'bg-green-100' : 'bg-red-50'
            }`}>
              {icon}
            </div>
            <div>
              <p className="font-medium">{label || 'Category name'}</p>
              <p className="text-xs text-muted-foreground capitalize">{type}</p>
            </div>
            <div className={`ml-auto w-4 h-4 rounded ${color}`} />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto order-2 sm:order-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!label}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {category ? 'Save Changes' : 'Add Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
