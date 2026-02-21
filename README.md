# 🏦 YNAB-Style Budget Tracker

A comprehensive envelope budgeting and financial management system inspired by YNAB (You Need A Budget), built with Next.js, TypeScript, and modern web technologies.

![Budget Tracker](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![Version](https://img.shields.io/badge/Version-2.0.0-orange)

## 🚀 Features

### 💰 **Envelope Budgeting (YNAB Method)**
- **Give Every Dollar a Job**: Assign all available income to specific budget categories
- **Real-time Available Calculations**: Track exactly how much money is available in each envelope
- **Overspending Protection**: Automatic alerts when categories go over budget
- **Month-to-Month Rollover**: Unused money rolls forward to next month
- **Auto-Assignment**: Intelligent money distribution based on priorities

### 📊 **Advanced Debt Management**
- **Multiple Payoff Strategies**: 
  - Debt Avalanche (highest interest first)
  - Debt Snowball (smallest balance first)
  - Custom payoff plans
- **Payoff Timeline Calculations**: See exactly when you'll be debt-free
- **Interest Savings Tracking**: Calculate total interest saved with extra payments
- **Credit Utilization Monitoring**: Track credit card utilization ratios
- **Net Worth Impact Analysis**: See how debt payoff improves your net worth

### 🎯 **Smart Goals Tracking**
- **Multiple Goal Types**:
  - Target Balance (save $X total)
  - Target Date (save $X by specific date)
  - Monthly Funding (save $X per month)
- **Progress Visualization**: Beautiful progress bars and completion tracking
- **On-Track Analysis**: Know if you're saving enough to meet your goals
- **Priority-Based Auto-Funding**: Goals get funded based on your priorities

### 🏦 **Multi-Account Support**
- **Account Types**: Checking, Savings, Credit Cards, Loans, Investments
- **Balance Tracking**: Monitor all account balances in one place
- **Transaction Reconciliation**: Match your budget with real account balances
- **Net Worth Calculation**: Automatic assets vs. liabilities tracking

### 📱 **Modern User Experience**
- **Mobile-First Design**: Fully responsive for all devices
- **Dark/Light Mode**: Toggle between themes for comfortable viewing
- **Intuitive Navigation**: Tab-based interface for easy access to all features
- **Real-Time Calculations**: All numbers update instantly as you make changes
- **Smart Categorization**: Organized categories for different types of expenses

### 📈 **Financial Intelligence**
- **Age of Money**: Track how long your money sits before being spent
- **Spending Trends**: Understand your financial patterns
- **Budget vs. Actual**: Compare planned spending with actual spending
- **Category Performance**: See which categories consistently go over budget

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui components
- **Icons**: Lucide React
- **Data Storage**: JSON file-based (easily upgradeable to database)
- **Date Handling**: date-fns
- **Build Tool**: Turbopack for development

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or pnpm

### Installation

1. **Clone and setup**:
   ```bash
   cd projects/budget
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### First Time Setup

1. **Review Default Categories**: Check the pre-loaded categories in Settings
2. **Add Your Accounts**: Set up your checking, savings, and credit card accounts
3. **Set Up Goals**: Create savings goals for things like emergency fund, vacation, etc.
4. **Start Budgeting**: Add income and assign it to your categories (envelopes)
5. **Track Spending**: Add transactions and watch your budget in real-time

## 📋 Usage Guide

### 🎯 **The YNAB Method in 4 Steps**

1. **Give Every Dollar a Job**
   - When money comes in, assign it to categories before spending
   - Use the "To Be Budgeted" amount to see unassigned money

2. **Embrace Your True Expenses**
   - Budget for irregular expenses (car maintenance, gifts, etc.)
   - Build up money over time for these true expenses

3. **Roll with the Punches**
   - When you overspend, move money from another category
   - Don't create new debt - just adjust your plan

4. **Age Your Money**
   - Spend money that's older, not paycheck-to-paycheck
   - Build a buffer so you're not living on the edge

### 💡 **Key Features Explained**

#### **Envelope Budgeting**
- Each category is like an envelope with cash
- You can only spend what's in each envelope
- Move money between envelopes as needed

#### **Debt Payoff Strategies**
- **Avalanche**: Pay minimums on all debts, extra goes to highest interest rate
- **Snowball**: Pay minimums on all debts, extra goes to smallest balance
- Choose based on what motivates you most

#### **Goals System**
- Set specific, measurable financial goals
- Automatic progress tracking and recommendations
- Integration with envelope budgeting

## 🏗 Architecture

### **Data Structure**
```typescript
interface BudgetData {
  accounts: Account[];        // Bank accounts, credit cards, etc.
  categories: Category[];     // Budget categories/envelopes
  transactions: Transaction[]; // All financial transactions
  budgets: Budget[];          // Monthly budget assignments
  goals: Goal[];              // Savings goals and targets
  settings: BudgetSettings;   // App preferences
}
```

### **Core Engine**
The `BudgetEngine` class handles all financial calculations:
- Available money calculations
- Debt payoff projections
- Goal progress tracking
- Net worth analysis
- Age of money calculations

### **Component Architecture**
- **EnvelopeBudget**: Main budgeting interface
- **DebtDashboard**: Debt management and payoff planning
- **GoalsTracker**: Savings goals and progress
- **TransactionDialog**: Add/edit transactions
- **CategoriesManager**: Manage budget categories

## 🔧 Customization

### **Adding New Categories**
Categories support:
- Custom icons (emoji)
- Color coding
- Type classification (income/expense)
- Special flags (debt, goal, etc.)

### **Extending Account Types**
Easy to add new account types:
```typescript
type AccountType = 'checking' | 'savings' | 'credit_card' | 'loan' | 'investment' | 'cash';
```

### **Custom Goal Types**
Three built-in goal types with room for expansion:
- `target_balance`: Save up to a specific amount
- `target_date`: Save amount by specific date  
- `monthly_funding`: Save specific amount each month

## 📊 Data Export/Import

### **Backup Your Data**
Budget data is stored in `/data/budget.json`:
```bash
# Backup
cp data/budget.json backup-$(date +%Y%m%d).json

# Restore  
cp backup-20240101.json data/budget.json
```

### **Data Format**
All data is stored as structured JSON, making it easy to:
- Export to Excel/CSV
- Import from other budgeting apps
- Create custom reports
- Backup and sync across devices

## 🚀 Deployment

### **Vercel (Recommended)**
```bash
npm run build
vercel deploy
```

### **Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### **Self-Hosted**
```bash
npm run build
npm start
```

## 🎯 Roadmap

### **Phase 1: Core Features** ✅
- [x] Envelope budgeting
- [x] Debt management
- [x] Goals tracking
- [x] Multi-account support
- [x] Mobile-responsive design

### **Phase 2: Advanced Features** 🚧
- [ ] Bank account sync (Plaid integration)
- [ ] Advanced reporting and analytics
- [ ] Receipt scanning and categorization
- [ ] Bill reminders and recurring transactions
- [ ] Investment tracking

### **Phase 3: Collaboration** 📋
- [ ] Multi-user support (family budgets)
- [ ] Shared goals and expenses
- [ ] Permission levels
- [ ] Activity feeds

### **Phase 4: Intelligence** 🤖
- [ ] AI-powered categorization
- [ ] Spending pattern recognition
- [ ] Predictive budgeting
- [ ] Financial health scoring

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

### **Areas for Contribution**
- Additional export formats
- New visualizations and charts
- Performance optimizations
- Mobile app development
- Bank integration plugins

## 📄 License

MIT License - feel free to use this for your own financial management needs!

## 🙏 Acknowledgments

- Inspired by YNAB (You Need A Budget)
- Built with amazing open-source tools
- Designed for real-world budgeting needs

---

**💡 Pro Tip**: The best budget is the one you'll actually use consistently. Start simple, build the habit, then add complexity as needed.

**🎯 Mission**: Help people gain complete control over their finances through the proven envelope budgeting method, enhanced with modern technology.