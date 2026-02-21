'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { 
  TargetIcon, 
  PlusIcon,
  CalendarIcon,
  DollarSignIcon,
  TrendingUpIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  EditIcon,
  TrashIcon,
  GiftIcon,
  HomeIcon,
  CarIcon,
  PlaneIcon,
  GraduationCapIcon,
  HeartIcon,
  PiggyBankIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { BudgetData, Goal, GoalType, Category } from '@/types';
import BudgetEngine from '@/lib/budget-engine';

interface GoalsTrackerProps {
  data: BudgetData;
  onAddGoal: (goal: Partial<Goal>) => void;
  onUpdateGoal: (goal: Goal) => void;
  onDeleteGoal: (goalId: string) => void;
}

interface GoalFormData {
  name: string;
  categoryId: string;
  type: GoalType;
  targetAmount: number;
  targetDate?: Date;
  monthlyFunding?: number;
}

export function GoalsTracker({ data, onAddGoal, onUpdateGoal, onDeleteGoal }: GoalsTrackerProps) {
  const [engine] = useState(() => new BudgetEngine(data));
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    name: '',
    categoryId: '',
    type: 'target_balance',
    targetAmount: 0,
    targetDate: undefined,
    monthlyFunding: 0
  });

  // Get goal categories
  const goalCategories = useMemo(() => 
    data.categories.filter(c => c.isGoal), [data.categories]
  );

  // Calculate goal progress for each goal
  const goalsWithProgress = useMemo(() => {
    return data.goals
      .filter(g => g.isActive)
      .map(goal => {
        const progress = engine.calculateGoalProgress(goal.id);
        const category = data.categories.find(c => c.id === goal.categoryId);
        return { ...goal, ...progress, category };
      })
      .sort((a, b) => {
        // Sort by completion status, then by target date
        if (a.progress >= 100 && b.progress < 100) return 1;
        if (a.progress < 100 && b.progress >= 100) return -1;
        
        if (a.targetDate && b.targetDate) {
          return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
        }
        return b.progress - a.progress;
      });
  }, [data.goals, data.categories, engine]);

  // Calculate total goals summary
  const goalsSummary = useMemo(() => {
    const total = goalsWithProgress.length;
    const completed = goalsWithProgress.filter(g => g.progress >= 100).length;
    const onTrack = goalsWithProgress.filter(g => g.onTrack && g.progress < 100).length;
    const behindSchedule = goalsWithProgress.filter(g => !g.onTrack && g.progress < 100).length;
    const totalTarget = goalsWithProgress.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = goalsWithProgress.reduce((sum, g) => sum + g.currentAmount, 0);

    return {
      total,
      completed,
      onTrack,
      behindSchedule,
      totalTarget,
      totalSaved,
      overallProgress: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0
    };
  }, [goalsWithProgress]);

  // Format currency
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.settings.currency
    }).format(amount);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!formData.name || !formData.categoryId || formData.targetAmount <= 0) return;

    const goalData: Partial<Goal> = {
      name: formData.name,
      categoryId: formData.categoryId,
      type: formData.type,
      targetAmount: formData.targetAmount,
      targetDate: formData.targetDate?.toISOString(),
      monthlyFunding: formData.monthlyFunding,
      currentAmount: 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    if (editingGoal) {
      onUpdateGoal({ ...editingGoal, ...goalData } as Goal);
      setEditingGoal(null);
    } else {
      onAddGoal(goalData);
    }

    setFormData({
      name: '',
      categoryId: '',
      type: 'target_balance',
      targetAmount: 0,
      targetDate: undefined,
      monthlyFunding: 0
    });
    setIsAddDialogOpen(false);
  };

  // Handle edit goal
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      categoryId: goal.categoryId,
      type: goal.type,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate ? new Date(goal.targetDate) : undefined,
      monthlyFunding: goal.monthlyFunding || 0
    });
    setIsAddDialogOpen(true);
  };

  // Get icon for goal category
  const getGoalIcon = (categoryId: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'emergency-fund': <PiggyBankIcon className="h-4 w-4" />,
      'vacation': <PlaneIcon className="h-4 w-4" />,
      'house-down-payment': <HomeIcon className="h-4 w-4" />,
      'new-car': <CarIcon className="h-4 w-4" />,
      'wedding': <HeartIcon className="h-4 w-4" />,
      'education': <GraduationCapIcon className="h-4 w-4" />
    };
    return iconMap[categoryId] || <TargetIcon className="h-4 w-4" />;
  };

  // Goal card component
  const GoalCard = ({ goal }: { goal: typeof goalsWithProgress[0] }) => {
    const isCompleted = goal.progress >= 100;
    const isOverdue = goal.targetDate && new Date(goal.targetDate) < new Date() && !isCompleted;
    
    return (
      <Card className={`${isCompleted ? 'border-green-200 bg-green-50' : ''} ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {getGoalIcon(goal.categoryId)}
              {goal.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              {isCompleted && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
              {isOverdue && <AlertCircleIcon className="h-5 w-5 text-red-600" />}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEditGoal(goal)}
              >
                <EditIcon className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDeleteGoal(goal.id)}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className={`text-sm font-bold ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                  {goal.progress.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.min(goal.progress, 100)} 
                className={`h-3 ${isCompleted ? '[&>div]:bg-green-500' : ''}`}
              />
              <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                <span>{formatAmount(goal.currentAmount)}</span>
                <span>{formatAmount(goal.targetAmount)}</span>
              </div>
            </div>

            {/* Target and Timeline */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {goal.targetDate && (
                <div>
                  <div className="text-muted-foreground">Target Date</div>
                  <div className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                    {format(new Date(goal.targetDate), 'MMM d, yyyy')}
                  </div>
                </div>
              )}
              <div>
                <div className="text-muted-foreground">Remaining</div>
                <div className="font-medium">
                  {formatAmount(Math.max(0, goal.targetAmount - goal.currentAmount))}
                </div>
              </div>
              {goal.monthsRemaining > 0 && (
                <div>
                  <div className="text-muted-foreground">Time Left</div>
                  <div className="font-medium">
                    {goal.monthsRemaining} months
                  </div>
                </div>
              )}
              <div>
                <div className="text-muted-foreground">Recommended/Month</div>
                <div className={`font-medium ${goal.onTrack ? 'text-green-600' : 'text-orange-600'}`}>
                  {formatAmount(goal.recommendedMonthly)}
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div>
              {isCompleted && (
                <Badge variant="default" className="bg-green-600">
                  ✓ Goal Achieved!
                </Badge>
              )}
              {!isCompleted && goal.onTrack && (
                <Badge variant="default" className="bg-blue-600">
                  On Track
                </Badge>
              )}
              {!isCompleted && !goal.onTrack && (
                <Badge variant="destructive">
                  Behind Schedule
                </Badge>
              )}
              {isOverdue && (
                <Badge variant="destructive" className="ml-2">
                  Overdue
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Goal form dialog
  const GoalFormDialog = () => (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingGoal ? 'Edit Goal' : 'Add New Goal'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="goal-name">Goal Name</Label>
            <Input
              id="goal-name"
              placeholder="Emergency Fund, Vacation, etc."
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="goal-category">Category</Label>
            <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {goalCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      {category.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="target-amount">Target Amount</Label>
            <Input
              id="target-amount"
              type="number"
              placeholder="10000"
              value={formData.targetAmount || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: parseFloat(e.target.value) || 0 }))}
            />
          </div>

          <div>
            <Label htmlFor="goal-type">Goal Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as GoalType }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="target_balance">Target Balance</SelectItem>
                <SelectItem value="target_date">Target by Date</SelectItem>
                <SelectItem value="monthly_funding">Monthly Funding</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.type === 'target_date' && (
            <div>
              <Label>Target Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.targetDate ? format(formData.targetDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.targetDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, targetDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {(formData.type === 'monthly_funding' || formData.type === 'target_date') && (
            <div>
              <Label htmlFor="monthly-funding">Monthly Funding Amount</Label>
              <Input
                id="monthly-funding"
                type="number"
                placeholder="500"
                value={formData.monthlyFunding || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, monthlyFunding: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} className="flex-1">
              {editingGoal ? 'Update Goal' : 'Add Goal'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddDialogOpen(false);
                setEditingGoal(null);
                setFormData({
                  name: '',
                  categoryId: '',
                  type: 'target_balance',
                  targetAmount: 0,
                  targetDate: undefined,
                  monthlyFunding: 0
                });
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Goals Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TargetIcon className="h-6 w-6" />
              Goals Overview
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{goalsSummary.total}</div>
              <div className="text-sm text-muted-foreground">Total Goals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{goalsSummary.completed}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{goalsSummary.onTrack}</div>
              <div className="text-sm text-muted-foreground">On Track</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{goalsSummary.behindSchedule}</div>
              <div className="text-sm text-muted-foreground">Behind</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{goalsSummary.overallProgress.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Overall Progress</div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Progress</span>
              <span className="text-sm text-muted-foreground">
                {formatAmount(goalsSummary.totalSaved)} / {formatAmount(goalsSummary.totalTarget)}
              </span>
            </div>
            <Progress value={goalsSummary.overallProgress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Goals List */}
      {goalsWithProgress.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TargetIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Goals Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start your financial journey by setting your first savings goal.
            </p>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Your First Goal
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goalsWithProgress.map(goal => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      <GoalFormDialog />
    </div>
  );
}

export default GoalsTracker;