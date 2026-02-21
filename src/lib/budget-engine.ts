import { Account, Transaction, Budget, Category, BudgetData, Goal } from '@/types';

export class BudgetEngine {
  private data: BudgetData;

  constructor(data: BudgetData) {
    this.data = data;
  }

  // === ENVELOPE BUDGETING CORE ===

  /**
   * Calculate total available money to budget for a given month
   * This is income minus immediate obligations and previous month rollovers
   */
  calculateAvailableToBudget(month: string): number {
    // Get all income for current month
    const monthlyIncome = this.getMonthlyIncome(month);
    
    // Get unassigned money from previous month (avoid recursion)
    const previousMonth = this.getPreviousMonth(month);
    const previousMonthBudgets = this.data.budgets.filter(b => b.month === previousMonth);
    const previousMonthAssigned = previousMonthBudgets.reduce((sum, b) => sum + b.assigned, 0);
    const previousMonthIncome = this.getMonthlyIncome(previousMonth);
    const previousUnassigned = Math.max(0, previousMonthIncome - previousMonthAssigned);
    
    // Get overspent categories from previous month (reduces available)
    const previousOverspending = this.calculateOverspending(previousMonth);
    
    return monthlyIncome + previousUnassigned - previousOverspending;
  }

  /**
   * Calculate how much money is assigned vs available for a month
   */
  getMonthlyBudgetSummary(month: string) {
    const budgets = this.data.budgets.filter(b => b.month === month);
    const totalAssigned = budgets.reduce((sum, b) => sum + b.assigned, 0);
    const availableToBudget = this.calculateAvailableToBudget(month);
    const toBeBudgeted = availableToBudget - totalAssigned;

    return {
      availableToBudget,
      totalAssigned,
      toBeBudgeted,
      isFullyAssigned: toBeBudgeted === 0,
      isOverAssigned: toBeBudgeted < 0
    };
  }

  /**
   * Assign money to a category envelope
   */
  assignMoney(categoryId: string, month: string, amount: number): Budget {
    const existingBudget = this.data.budgets.find(b => 
      b.categoryId === categoryId && b.month === month
    );

    if (existingBudget) {
      existingBudget.assigned += amount;
      existingBudget.available = this.calculateCategoryAvailable(categoryId, month);
      return existingBudget;
    } else {
      const newBudget: Budget = {
        id: `budget-${Date.now()}-${categoryId}`,
        categoryId,
        month,
        assigned: amount,
        activity: this.getCategoryActivity(categoryId, month),
        available: 0
      };
      newBudget.available = this.calculateCategoryAvailable(categoryId, month);
      this.data.budgets.push(newBudget);
      return newBudget;
    }
  }

  /**
   * Calculate available amount in a category envelope
   * Available = Previous Available + Assigned + Activity
   */
  calculateCategoryAvailable(categoryId: string, month: string): number {
    const budget = this.data.budgets.find(b => 
      b.categoryId === categoryId && b.month === month
    );
    
    const previousMonth = this.getPreviousMonth(month);
    const previousBudget = this.data.budgets.find(b => 
      b.categoryId === categoryId && b.month === previousMonth
    );
    
    const assigned = budget?.assigned || 0;
    const activity = this.getCategoryActivity(categoryId, month);
    const previousAvailable = previousBudget?.available || 0;
    
    return previousAvailable + assigned + activity;
  }

  // === DEBT MANAGEMENT ===

  /**
   * Get all debt accounts and their details
   */
  getDebtAccounts(): Account[] {
    return this.data.accounts.filter(account => 
      account.type === 'credit_card' || account.type === 'loan'
    );
  }

  /**
   * Calculate debt payoff plan using specified strategy
   */
  calculateDebtPayoffPlan(extraPayment: number = 0, strategy: 'snowball' | 'avalanche' = 'avalanche') {
    const debtAccounts = this.getDebtAccounts();
    const plan = debtAccounts.map(debt => ({
      accountId: debt.id,
      name: debt.name,
      balance: Math.abs(debt.balance),
      interestRate: debt.interestRate || 0,
      minimumPayment: debt.type === 'credit_card' 
        ? Math.max(25, Math.abs(debt.balance) * 0.02) // 2% minimum for credit cards
        : debt.interestRate ? this.calculateLoanPayment(Math.abs(debt.balance), debt.interestRate) : 0,
      payoffOrder: 0,
      monthsToPayoff: 0,
      totalInterest: 0
    }));

    // Sort by strategy
    if (strategy === 'avalanche') {
      plan.sort((a, b) => b.interestRate - a.interestRate); // Highest interest first
    } else {
      plan.sort((a, b) => a.balance - b.balance); // Smallest balance first
    }

    // Assign payoff order and calculate timelines
    plan.forEach((debt, index) => {
      debt.payoffOrder = index + 1;
      // Calculate months to payoff and total interest
      const { months, totalInterest } = this.calculatePayoffTime(
        debt.balance,
        debt.interestRate,
        debt.minimumPayment + (index === 0 ? extraPayment : 0)
      );
      debt.monthsToPayoff = months;
      debt.totalInterest = totalInterest;
    });

    return plan;
  }

  /**
   * Calculate monthly payment for a loan
   */
  private calculateLoanPayment(balance: number, annualRate: number, years: number = 10): number {
    const monthlyRate = annualRate / 100 / 12;
    const numPayments = years * 12;
    
    if (monthlyRate === 0) return balance / numPayments;
    
    return balance * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
           (Math.pow(1 + monthlyRate, numPayments) - 1);
  }

  /**
   * Calculate time to pay off debt
   */
  private calculatePayoffTime(balance: number, annualRate: number, payment: number) {
    if (payment <= 0) return { months: Infinity, totalInterest: 0 };
    
    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate === 0) {
      return { 
        months: Math.ceil(balance / payment),
        totalInterest: 0
      };
    }

    const months = Math.ceil(
      -Math.log(1 - (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate)
    );
    
    const totalInterest = (payment * months) - balance;
    
    return { months, totalInterest: Math.max(0, totalInterest) };
  }

  // === GOALS MANAGEMENT ===

  /**
   * Calculate progress towards a goal
   */
  calculateGoalProgress(goalId: string): {
    progress: number;
    monthsRemaining: number;
    onTrack: boolean;
    recommendedMonthly: number;
  } {
    const goal = this.data.goals.find(g => g.id === goalId);
    if (!goal) throw new Error('Goal not found');

    const currentAmount = goal.currentAmount;
    const progress = goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0;

    let monthsRemaining = 0;
    let recommendedMonthly = 0;
    let onTrack = true;

    if (goal.type === 'target_date' && goal.targetDate) {
      const targetDate = new Date(goal.targetDate);
      const now = new Date();
      monthsRemaining = Math.max(0, 
        (targetDate.getFullYear() - now.getFullYear()) * 12 + 
        (targetDate.getMonth() - now.getMonth())
      );
      
      if (monthsRemaining > 0) {
        recommendedMonthly = (goal.targetAmount - currentAmount) / monthsRemaining;
        onTrack = goal.monthlyFunding ? goal.monthlyFunding >= recommendedMonthly : false;
      }
    } else if (goal.type === 'monthly_funding' && goal.monthlyFunding) {
      recommendedMonthly = goal.monthlyFunding;
      if (recommendedMonthly > 0) {
        monthsRemaining = Math.ceil((goal.targetAmount - currentAmount) / recommendedMonthly);
      }
    }

    return {
      progress,
      monthsRemaining,
      onTrack,
      recommendedMonthly
    };
  }

  // === UTILITY METHODS ===

  private getMonthlyIncome(month: string): number {
    return this.data.transactions
      .filter(t => t.date.startsWith(month) && t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  private getCategoryActivity(categoryId: string, month: string): number {
    return this.data.transactions
      .filter(t => t.date.startsWith(month) && t.categoryId === categoryId)
      .reduce((sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount), 0);
  }

  // Method removed to avoid circular dependency

  private calculateOverspending(month: string): number {
    const budgets = this.data.budgets.filter(b => b.month === month);
    return budgets.reduce((sum, budget) => {
      const available = this.calculateCategoryAvailable(budget.categoryId, month);
      return sum + Math.max(0, -available); // Only negative balances count as overspending
    }, 0);
  }

  private getPreviousMonth(month: string): string {
    const [year, monthNum] = month.split('-').map(Number);
    const date = new Date(year, monthNum - 1);
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Auto-assign available money using priority rules
   */
  autoAssignMoney(month: string, priorities: string[] = []): Budget[] {
    const { toBeBudgeted } = this.getMonthlyBudgetSummary(month);
    if (toBeBudgeted <= 0) return [];

    const assigned: Budget[] = [];
    let remainingMoney = toBeBudgeted;

    // First priority: Cover overspent categories
    const overspentCategories = this.getOverspentCategories(month);
    for (const categoryId of overspentCategories) {
      if (remainingMoney <= 0) break;
      
      const needed = Math.abs(this.calculateCategoryAvailable(categoryId, month));
      const toAssign = Math.min(needed, remainingMoney);
      
      const budget = this.assignMoney(categoryId, month, toAssign);
      assigned.push(budget);
      remainingMoney -= toAssign;
    }

    // Second priority: Fund goals by priority
    for (const categoryId of priorities) {
      if (remainingMoney <= 0) break;
      
      const category = this.data.categories.find(c => c.id === categoryId);
      if (category?.isGoal) {
        const goal = this.data.goals.find(g => g.categoryId === categoryId && g.isActive);
        if (goal) {
          const { recommendedMonthly } = this.calculateGoalProgress(goal.id);
          const currentAssigned = this.data.budgets.find(b => 
            b.categoryId === categoryId && b.month === month
          )?.assigned || 0;
          
          const toAssign = Math.min(
            Math.max(0, recommendedMonthly - currentAssigned),
            remainingMoney
          );
          
          if (toAssign > 0) {
            const budget = this.assignMoney(categoryId, month, toAssign);
            assigned.push(budget);
            remainingMoney -= toAssign;
          }
        }
      }
    }

    return assigned;
  }

  private getOverspentCategories(month: string): string[] {
    return this.data.budgets
      .filter(b => b.month === month)
      .filter(b => this.calculateCategoryAvailable(b.categoryId, month) < 0)
      .map(b => b.categoryId);
  }

  // === NET WORTH & ANALYTICS ===

  /**
   * Calculate total net worth
   */
  calculateNetWorth(): {
    assets: number;
    liabilities: number;
    netWorth: number;
    accountBreakdown: { [key: string]: number };
  } {
    const accountBreakdown: { [key: string]: number } = {};
    let assets = 0;
    let liabilities = 0;

    this.data.accounts.forEach(account => {
      accountBreakdown[account.name] = account.balance;
      
      if (account.balance >= 0) {
        assets += account.balance;
      } else {
        liabilities += Math.abs(account.balance);
      }
    });

    return {
      assets,
      liabilities,
      netWorth: assets - liabilities,
      accountBreakdown
    };
  }

  /**
   * Calculate age of money (how long money sits before being spent)
   */
  calculateAgeOfMoney(): number {
    // Simplified calculation: average days between income and expense transactions
    const last90Days = new Date();
    last90Days.setDate(last90Days.getDate() - 90);
    
    const recentTransactions = this.data.transactions.filter(t => 
      new Date(t.date) >= last90Days
    );

    const incomeTransactions = recentTransactions.filter(t => t.type === 'income');
    const expenseTransactions = recentTransactions.filter(t => t.type === 'expense');

    if (incomeTransactions.length === 0 || expenseTransactions.length === 0) return 0;

    const avgIncomeDate = incomeTransactions.reduce((sum, t) => 
      sum + new Date(t.date).getTime(), 0) / incomeTransactions.length;
    
    const avgExpenseDate = expenseTransactions.reduce((sum, t) => 
      sum + new Date(t.date).getTime(), 0) / expenseTransactions.length;

    const daysDifference = (avgExpenseDate - avgIncomeDate) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.round(daysDifference));
  }
}

export default BudgetEngine;