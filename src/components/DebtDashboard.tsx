'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCardIcon, 
  TrendingDownIcon,
  TrendingUpIcon,
  TargetIcon,
  CalendarIcon,
  DollarSignIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ZapIcon,
  SnowflakeIcon
} from 'lucide-react';
import { BudgetData, Account, DebtStrategy } from '@/types';
import BudgetEngine from '@/lib/budget-engine';

interface DebtDashboardProps {
  data: BudgetData;
  onUpdateAccount: (account: Account) => void;
  onUpdateSettings: (settings: Partial<BudgetData['settings']>) => void;
}

export function DebtDashboard({ data, onUpdateAccount, onUpdateSettings }: DebtDashboardProps) {
  const [engine] = useState(() => new BudgetEngine(data));
  const [extraPayment, setExtraPayment] = useState(0);
  const [strategy, setStrategy] = useState<DebtStrategy>(data.settings.debtStrategy);

  // Calculate debt overview
  const debtOverview = useMemo(() => {
    const debtAccounts = engine.getDebtAccounts();
    const totalDebt = debtAccounts.reduce((sum, account) => sum + Math.abs(account.balance), 0);
    const totalMinimumPayments = debtAccounts.reduce((sum, account) => {
      const minimum = account.type === 'credit_card' 
        ? Math.max(25, Math.abs(account.balance) * 0.02)
        : 0;
      return sum + minimum;
    }, 0);
    
    const payoffPlan = engine.calculateDebtPayoffPlan(extraPayment, strategy === 'custom' ? 'avalanche' : strategy);
    const totalInterest = payoffPlan.reduce((sum, debt) => sum + debt.totalInterest, 0);
    const maxMonths = Math.max(...payoffPlan.map(debt => debt.monthsToPayoff));

    return {
      totalDebt,
      totalMinimumPayments,
      totalInterest,
      timeToPayoff: maxMonths,
      accounts: debtAccounts,
      payoffPlan
    };
  }, [engine, extraPayment, strategy]);

  // Calculate net worth impact
  const netWorthData = useMemo(() => {
    const { netWorth } = engine.calculateNetWorth();
    const debtFreeNetWorth = netWorth + debtOverview.totalDebt;
    const improvement = debtFreeNetWorth - netWorth;
    
    return {
      current: netWorth,
      debtFree: debtFreeNetWorth,
      improvement
    };
  }, [engine, debtOverview.totalDebt]);

  // Format currency
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.settings.currency
    }).format(amount);
  };

  // Format time
  const formatMonths = (months: number) => {
    if (months === Infinity) return 'Never';
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) return `${months} months`;
    if (remainingMonths === 0) return `${years} ${years === 1 ? 'year' : 'years'}`;
    return `${years}y ${remainingMonths}m`;
  };

  // Handle strategy change
  const handleStrategyChange = (newStrategy: DebtStrategy) => {
    setStrategy(newStrategy);
    onUpdateSettings({ debtStrategy: newStrategy });
  };

  // Debt account card
  const DebtAccountCard = ({ account, planInfo }: { 
    account: Account; 
    planInfo: ReturnType<typeof engine.calculateDebtPayoffPlan>[0];
  }) => {
    const balance = Math.abs(account.balance);
    const utilization = account.type === 'credit_card' && account.creditLimit 
      ? (balance / account.creditLimit) * 100 
      : 0;
    
    const getUtilizationColor = (util: number) => {
      if (util >= 90) return 'text-red-600';
      if (util >= 70) return 'text-orange-600';
      if (util >= 30) return 'text-yellow-600';
      return 'text-green-600';
    };

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5" />
              {account.name}
            </CardTitle>
            <Badge variant={account.type === 'credit_card' ? 'destructive' : 'secondary'}>
              #{planInfo.payoffOrder}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Balance and Interest */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {formatAmount(balance)}
                </div>
                <div className="text-sm text-muted-foreground">Current Balance</div>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {(account.interestRate || 0).toFixed(2)}%
                </div>
                <div className="text-sm text-muted-foreground">Interest Rate</div>
              </div>
            </div>

            {/* Credit Card Utilization */}
            {account.type === 'credit_card' && account.creditLimit && (
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Credit Utilization</span>
                  <span className={getUtilizationColor(utilization)}>
                    {utilization.toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={Math.min(utilization, 100)} 
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {formatAmount(balance)} / {formatAmount(account.creditLimit)}
                </div>
              </div>
            )}

            {/* Payoff Plan */}
            <div className="bg-muted/50 rounded-lg p-3">
              <h4 className="font-medium mb-2">Payoff Plan</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Minimum Payment</div>
                  <div className="font-medium">{formatAmount(planInfo.minimumPayment)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Time to Payoff</div>
                  <div className="font-medium">{formatMonths(planInfo.monthsToPayoff)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Interest</div>
                  <div className="font-medium text-red-600">{formatAmount(planInfo.totalInterest)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total Paid</div>
                  <div className="font-medium">{formatAmount(balance + planInfo.totalInterest)}</div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>Progress</span>
                <span>0% paid off</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Strategy comparison
  const StrategyComparison = () => {
    const avalanchePlan = engine.calculateDebtPayoffPlan(extraPayment, 'avalanche');
    const snowballPlan = engine.calculateDebtPayoffPlan(extraPayment, 'snowball');

    const avalancheTime = Math.max(...avalanchePlan.map(d => d.monthsToPayoff));
    const avalancheInterest = avalanchePlan.reduce((sum, d) => sum + d.totalInterest, 0);
    
    const snowballTime = Math.max(...snowballPlan.map(d => d.monthsToPayoff));
    const snowballInterest = snowballPlan.reduce((sum, d) => sum + d.totalInterest, 0);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className={strategy === 'avalanche' ? 'ring-2 ring-blue-500' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ZapIcon className="h-5 w-5 text-blue-500" />
              Debt Avalanche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Pay minimums on all debts, put extra toward highest interest rate debt first.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-lg font-semibold">{formatMonths(avalancheTime)}</div>
                  <div className="text-xs text-muted-foreground">Time to payoff</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-red-600">
                    {formatAmount(avalancheInterest)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total interest</div>
                </div>
              </div>
              <Button 
                variant={strategy === 'avalanche' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => handleStrategyChange('avalanche')}
              >
                {strategy === 'avalanche' ? 'Current Strategy' : 'Select Avalanche'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className={strategy === 'snowball' ? 'ring-2 ring-blue-500' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SnowflakeIcon className="h-5 w-5 text-blue-400" />
              Debt Snowball
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Pay minimums on all debts, put extra toward smallest balance debt first.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-lg font-semibold">{formatMonths(snowballTime)}</div>
                  <div className="text-xs text-muted-foreground">Time to payoff</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-red-600">
                    {formatAmount(snowballInterest)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total interest</div>
                </div>
              </div>
              <Button 
                variant={strategy === 'snowball' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => handleStrategyChange('snowball')}
              >
                {strategy === 'snowball' ? 'Current Strategy' : 'Select Snowball'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (debtOverview.accounts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Congratulations!</h3>
          <p className="text-muted-foreground">
            You have no debt accounts. You're on the path to financial freedom!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Debt Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCardIcon className="h-6 w-6" />
            Debt Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatAmount(debtOverview.totalDebt)}
              </div>
              <div className="text-sm text-muted-foreground">Total Debt</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatAmount(debtOverview.totalMinimumPayments)}
              </div>
              <div className="text-sm text-muted-foreground">Min. Payments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatAmount(debtOverview.totalInterest)}
              </div>
              <div className="text-sm text-muted-foreground">Total Interest</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatMonths(debtOverview.timeToPayoff)}
              </div>
              <div className="text-sm text-muted-foreground">Time to Freedom</div>
            </div>
          </div>

          {/* Extra Payment Control */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-4">
              <label className="font-medium">Extra Monthly Payment:</label>
              <Input
                type="number"
                placeholder="0"
                value={extraPayment || ''}
                onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
                className="w-32"
              />
              <div className="text-sm text-muted-foreground">
                Adding {formatAmount(extraPayment)} saves {formatAmount(Math.max(0, debtOverview.totalInterest - engine.calculateDebtPayoffPlan(0, strategy === 'custom' ? 'avalanche' : strategy).reduce((sum, d) => sum + d.totalInterest, 0)))} in interest
              </div>
            </div>
          </div>

          {/* Net Worth Impact */}
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-800 mb-2">Net Worth Impact</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-green-700">Current Net Worth</div>
                <div className="font-semibold">{formatAmount(netWorthData.current)}</div>
              </div>
              <div>
                <div className="text-green-700">Debt-Free Net Worth</div>
                <div className="font-semibold">{formatAmount(netWorthData.debtFree)}</div>
              </div>
              <div>
                <div className="text-green-700">Improvement</div>
                <div className="font-semibold text-green-600">+{formatAmount(netWorthData.improvement)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="accounts">Debt Accounts</TabsTrigger>
          <TabsTrigger value="strategy">Strategy</TabsTrigger>
          <TabsTrigger value="payoff">Payoff Plan</TabsTrigger>
        </TabsList>

        {/* Debt Accounts Tab */}
        <TabsContent value="accounts">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debtOverview.accounts.map(account => {
              const planInfo = debtOverview.payoffPlan.find(p => p.accountId === account.id)!;
              return (
                <DebtAccountCard 
                  key={account.id} 
                  account={account} 
                  planInfo={planInfo}
                />
              );
            })}
          </div>
        </TabsContent>

        {/* Strategy Comparison Tab */}
        <TabsContent value="strategy">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Choose Your Debt Payoff Strategy</h3>
              <p className="text-muted-foreground">
                Both strategies work, but they optimize for different goals. Choose the one that motivates you most.
              </p>
            </div>
            <StrategyComparison />
          </div>
        </TabsContent>

        {/* Payoff Plan Tab */}
        <TabsContent value="payoff">
          <Card>
            <CardHeader>
              <CardTitle>Debt Payoff Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {debtOverview.payoffPlan
                  .sort((a, b) => a.payoffOrder - b.payoffOrder)
                  .map((debt, index) => (
                    <div key={debt.accountId} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full font-bold text-sm">
                        {debt.payoffOrder}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{debt.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatAmount(debt.balance)} at {debt.interestRate.toFixed(2)}% interest
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatMonths(debt.monthsToPayoff)}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatAmount(debt.totalInterest)} interest
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DebtDashboard;