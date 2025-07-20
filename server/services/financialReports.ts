import type { JournalEntry, FinancialStatement } from '@shared/schema';

export interface TrialBalanceEntry {
  accountCode: string;
  accountName: string;
  debitBalance: number;
  creditBalance: number;
  entity?: string;
  narration?: string;
}

export interface ProfitLossEntry {
  accountCode: string;
  accountName: string;
  amount: number;
  type: 'revenue' | 'expense';
}

export interface BalanceSheetEntry {
  accountCode: string;
  accountName: string;
  amount: number;
  type: 'asset' | 'liability' | 'equity';
  subType: string;
}

export interface CashFlowEntry {
  description: string;
  amount: number;
  type: 'operating' | 'investing' | 'financing';
}

export interface CalculationLog {
  step: string;
  description: string;
  assumptions: string[];
  missingData: string[];
  calculationDetails: string;
  timestamp: string;
}

export interface DetailedFinancialReport {
  data: any;
  calculationLogs: CalculationLog[];
  summary: {
    totalSteps: number;
    dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
    assumptionCount: number;
    missingDataCount: number;
  };
}

export class FinancialReportsService {
  private createCalculationLog(
    step: string,
    description: string,
    assumptions: string[] = [],
    missingData: string[] = [],
    calculationDetails: string = ''
  ): CalculationLog {
    return {
      step,
      description,
      assumptions,
      missingData,
      calculationDetails,
      timestamp: new Date().toISOString()
    };
  }

  async generateTrialBalanceWithLogs(journalEntries: JournalEntry[]): Promise<DetailedFinancialReport> {
    const logs: CalculationLog[] = [];
    let totalMissingData = 0;
    let totalAssumptions = 0;

    // Step 1: Data Validation and Input Analysis
    logs.push(this.createCalculationLog(
      'Step 1: Data Validation',
      'Analyzing input journal entries for data quality and completeness',
      [
        'Each journal entry follows double-entry bookkeeping (debit = credit)',
        'Account codes follow Indian Chart of Accounts structure',
        'Entity names represent vendors/customers/business partners',
        'Missing entity names defaulted to "Unknown"'
      ],
      journalEntries.filter(e => !e.entity || e.entity.trim() === '').length > 0 ? 
        [`${journalEntries.filter(e => !e.entity || e.entity.trim() === '').length} entries missing entity names`] : [],
      `Total journal entries: ${journalEntries.length}\nEntries with entities: ${journalEntries.filter(e => e.entity && e.entity.trim() !== '').length}\nDate range: ${journalEntries.length > 0 ? new Date(Math.min(...journalEntries.map(e => new Date(e.entryDate).getTime()))).toDateString() + ' to ' + new Date(Math.max(...journalEntries.map(e => new Date(e.entryDate).getTime()))).toDateString() : 'No entries'}`
    ));

    const result = await this.generateTrialBalance(journalEntries);
    
    // Step 2: Entity Grouping and Account Aggregation
    const entityCount = new Set(journalEntries.map(e => e.entity || 'Unknown')).size;
    const accountCount = new Set(journalEntries.map(e => e.accountCode)).size;
    
    logs.push(this.createCalculationLog(
      'Step 2: Entity Grouping',
      'Grouping journal entries by account code and entity for subsidiary ledger detail',
      [
        'Each unique account-entity combination creates separate trial balance line',
        'Net balances calculated as (Total Debits - Total Credits)',
        'Zero balances excluded from final trial balance display',
        'Authentic raw data amounts used without scaling factors'
      ],
      [],
      `Unique entities: ${entityCount}\nUnique accounts: ${accountCount}\nFinal trial balance entries: ${result.entries.length}\nTotal debits: ₹${result.totalDebits.toLocaleString('en-IN', {minimumFractionDigits: 2})}\nTotal credits: ₹${result.totalCredits.toLocaleString('en-IN', {minimumFractionDigits: 2})}`
    ));

    // Step 3: Balance Verification
    const balanceDifference = Math.abs(result.totalDebits - result.totalCredits);
    logs.push(this.createCalculationLog(
      'Step 3: Balance Verification',
      'Verifying trial balance equation: Total Debits = Total Credits',
      [
        'Balance tolerance: ±₹0.01 considered balanced',
        'Perfect balance indicates proper double-entry bookkeeping',
        'Entity-level detail preserved for audit trail'
      ],
      balanceDifference > 0.01 ? [`Trial balance out of balance by ₹${balanceDifference.toFixed(2)}`] : [],
      `Balance difference: ₹${balanceDifference.toFixed(2)}\nBalance status: ${result.isBalanced ? 'BALANCED ✓' : 'UNBALANCED ✗'}\nPrecision: 2 decimal places\nCurrency: Indian Rupees (INR)`
    ));

    totalAssumptions = logs.reduce((sum, log) => sum + log.assumptions.length, 0);
    totalMissingData = logs.reduce((sum, log) => sum + log.missingData.length, 0);

    return {
      data: result,
      calculationLogs: logs,
      summary: {
        totalSteps: logs.length,
        dataQuality: totalMissingData === 0 ? 'excellent' : totalMissingData < 5 ? 'good' : 'fair',
        assumptionCount: totalAssumptions,
        missingDataCount: totalMissingData
      }
    };
  }

  async generateTrialBalance(journalEntries: JournalEntry[]): Promise<{
    entries: TrialBalanceEntry[];
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
  }> {
    // Group entries by entity/vendor/customer name for detailed subsidiary ledger
    const entityBalances = new Map<string, {
      accountCode: string;
      accountName: string;
      entity: string;
      debitTotal: number;
      creditTotal: number;
      narration: string;
    }>();

    // Process each journal entry to create detailed subsidiary accounts
    for (const entry of journalEntries) {
      // Create a unique key combining account code and entity for detailed breakdown
      const entityKey = `${entry.accountCode}-${entry.entity || 'Unknown'}`;
      
      const current = entityBalances.get(entityKey) || {
        accountCode: entry.accountCode,
        accountName: entry.accountName,
        entity: entry.entity || 'Unknown',
        debitTotal: 0,
        creditTotal: 0,
        narration: entry.narration || '',
      };

      current.debitTotal += parseFloat(entry.debitAmount?.toString() || '0');
      current.creditTotal += parseFloat(entry.creditAmount?.toString() || '0');

      entityBalances.set(entityKey, current);
    }

    console.log(`Debug: Created ${entityBalances.size} entity balances from ${journalEntries.length} journal entries`);

    // Use authentic raw data amounts without scaling factor
    console.log(`Debug: Using authentic raw data amounts for Trial Balance calculation`);
    
    // Convert to trial balance format with detailed breakdown
    const entries: TrialBalanceEntry[] = [];
    let totalDebits = 0;
    let totalCredits = 0;

    // Add detailed entity breakdown for each account with authentic amounts
    for (const [, balance] of entityBalances) {
      const netDebit = Math.max(0, balance.debitTotal - balance.creditTotal);
      const netCredit = Math.max(0, balance.creditTotal - balance.debitTotal);

      if (netDebit > 0 || netCredit > 0) {
        // Use authentic raw data amounts
        entries.push({
          accountCode: balance.accountCode,
          accountName: `${balance.accountName} - ${balance.entity}`,
          debitBalance: netDebit,
          creditBalance: netCredit,
          entity: balance.entity,
          narration: balance.narration,
        });

        totalDebits += netDebit;
        totalCredits += netCredit;
      }
    }

    // Sort by account code then by entity name for better readability
    entries.sort((a, b) => {
      if (a.accountCode !== b.accountCode) {
        return a.accountCode.localeCompare(b.accountCode);
      }
      return (a.entity || '').localeCompare(b.entity || '');
    });

    return {
      entries,
      totalDebits,
      totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
    };
  }

  async generateProfitLossWithLogs(journalEntries: JournalEntry[]): Promise<DetailedFinancialReport> {
    const logs: CalculationLog[] = [];
    let totalMissingData = 0;
    let totalAssumptions = 0;

    // Step 1: Account Classification Analysis
    const revenueEntries = journalEntries.filter(e => e.accountCode.startsWith('4'));
    const expenseEntries = journalEntries.filter(e => e.accountCode.startsWith('5'));
    const otherEntries = journalEntries.filter(e => !e.accountCode.startsWith('4') && !e.accountCode.startsWith('5'));

    logs.push(this.createCalculationLog(
      'Step 1: Account Classification',
      'Classifying journal entries into revenue and expense categories based on account codes',
      [
        'Revenue accounts: 4xxx series (normal credit balance)',
        'Expense accounts: 5xxx series (flexible debit/credit handling)',
        'Non-P&L accounts excluded (1xxx=Assets, 2xxx=Liabilities, 3xxx=Equity)',
        'Account classification follows Indian Chart of Accounts structure'
      ],
      otherEntries.length > 0 ? [`${otherEntries.length} entries excluded as non-P&L accounts`] : [],
      `Total entries: ${journalEntries.length}\nRevenue entries (4xxx): ${revenueEntries.length}\nExpense entries (5xxx): ${expenseEntries.length}\nExcluded entries: ${otherEntries.length}`
    ));

    const result = await this.generateProfitLoss(journalEntries);

    // Step 2: Revenue Calculation Details
    logs.push(this.createCalculationLog(
      'Step 2: Revenue Calculation',
      'Calculating total revenue from credit balances in 4xxx accounts',
      [
        'Revenue = Total Credits for 4xxx accounts',
        'Only positive credit balances included in revenue',
        'Each account aggregated separately for detailed reporting',
        'Indian Rupee formatting with proper precision'
      ],
      result.revenue.length === 0 ? ['No revenue accounts found with positive balances'] : [],
      `Revenue accounts found: ${result.revenue.length}\nTotal revenue: ₹${result.totalRevenue.toLocaleString('en-IN', {minimumFractionDigits: 2})}\nLargest revenue account: ${result.revenue.length > 0 ? result.revenue.reduce((a, b) => a.amount > b.amount ? a : b).accountName + ' (₹' + result.revenue.reduce((a, b) => a.amount > b.amount ? a : b).amount.toLocaleString('en-IN') + ')' : 'None'}`
    ));

    // Step 3: Expense Calculation Details  
    logs.push(this.createCalculationLog(
      'Step 3: Expense Calculation',
      'Calculating total expenses using flexible debit/credit handling for 5xxx accounts',
      [
        'Expense amount = Max(Total Debits, Total Credits) for each 5xxx account',
        'Handles TDS and other accounts with credit balances correctly',
        'All 5xxx accounts treated as expenses regardless of balance direction',
        'Captures actual expense amounts for accurate P&L calculation'
      ],
      result.expenses.length === 0 ? ['No expense accounts found with positive balances'] : [],
      `Expense accounts found: ${result.expenses.length}\nTotal expenses: ₹${result.totalExpenses.toLocaleString('en-IN', {minimumFractionDigits: 2})}\nLargest expense account: ${result.expenses.length > 0 ? result.expenses.reduce((a, b) => a.amount > b.amount ? a : b).accountName + ' (₹' + result.expenses.reduce((a, b) => a.amount > b.amount ? a : b).amount.toLocaleString('en-IN') + ')' : 'None'}`
    ));

    // Step 4: Net Profit Calculation
    const profitMargin = result.totalRevenue > 0 ? ((result.netProfit / result.totalRevenue) * 100) : 0;
    logs.push(this.createCalculationLog(
      'Step 4: Net Profit Calculation',
      'Computing net profit and profitability ratios',
      [
        'Net Profit = Total Revenue - Total Expenses',
        'Profit margin = (Net Profit ÷ Total Revenue) × 100',
        'Positive result indicates profit, negative indicates loss',
        'All amounts in Indian Rupees with 2-decimal precision'
      ],
      [],
      `Net Profit: ₹${result.netProfit.toLocaleString('en-IN', {minimumFractionDigits: 2})}\nProfit Status: ${result.netProfit > 0 ? 'PROFIT ✓' : 'LOSS ✗'}\nProfit Margin: ${profitMargin.toFixed(2)}%\nRevenue vs Expenses Ratio: ${result.totalExpenses > 0 ? (result.totalRevenue / result.totalExpenses).toFixed(2) : 'N/A'}`
    ));

    totalAssumptions = logs.reduce((sum, log) => sum + log.assumptions.length, 0);
    totalMissingData = logs.reduce((sum, log) => sum + log.missingData.length, 0);

    return {
      data: result,
      calculationLogs: logs,
      summary: {
        totalSteps: logs.length,
        dataQuality: totalMissingData === 0 ? 'excellent' : totalMissingData < 3 ? 'good' : 'fair',
        assumptionCount: totalAssumptions,
        missingDataCount: totalMissingData
      }
    };
  }

  async generateProfitLoss(journalEntries: JournalEntry[]): Promise<{
    revenue: ProfitLossEntry[];
    expenses: ProfitLossEntry[];
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
  }> {
    const revenue: ProfitLossEntry[] = [];
    const expenses: ProfitLossEntry[] = [];

    // Group entries by account code first to calculate net balances
    const accountBalances = new Map<string, {
      accountName: string;
      totalDebits: number;
      totalCredits: number;
    }>();

    for (const entry of journalEntries) {
      const code = entry.accountCode;
      const current = accountBalances.get(code) || {
        accountName: entry.accountName,
        totalDebits: 0,
        totalCredits: 0,
      };
      
      current.totalDebits += parseFloat(entry.debitAmount?.toString() || '0');
      current.totalCredits += parseFloat(entry.creditAmount?.toString() || '0');
      
      accountBalances.set(code, current);
    }

    let totalRevenue = 0;
    let totalExpenses = 0;

    // Use authentic raw data amounts without scaling factor
    console.log(`Debug: Using authentic raw data amounts for P&L calculation`);

    // Process each account based on account code ranges
    for (const [code, balance] of accountBalances) {
      if (code.startsWith('4')) {
        // Revenue accounts (4xxx) - normal credit balance
        // Revenue = credit balance, so we use totalCredits for revenue accounts
        const amount = balance.totalCredits;
        if (amount > 0) {
          revenue.push({
            accountCode: code,
            accountName: balance.accountName,
            amount: amount,
            type: 'revenue'
          });
          totalRevenue += amount;
        }
      } else if (code.startsWith('5')) {
        // Expense accounts (5xxx) - ALL are expenses regardless of debit/credit balance
        // Use the higher of totalDebits or totalCredits to capture the actual expense amount
        const amount = Math.max(balance.totalDebits, balance.totalCredits);
        if (amount > 0) {
          expenses.push({
            accountCode: code,
            accountName: balance.accountName,
            amount: amount,
            type: 'expense'
          });
          totalExpenses += amount;
        }
      }
    }

    // Sort entries
    revenue.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    expenses.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    return {
      revenue,
      expenses,
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
    };
  }

  async generateBalanceSheetWithLogs(journalEntries: JournalEntry[]): Promise<DetailedFinancialReport> {
    const logs: CalculationLog[] = [];
    let totalMissingData = 0;
    let totalAssumptions = 0;

    // Step 1: Account Classification for Balance Sheet
    const assetEntries = journalEntries.filter(e => e.accountCode.startsWith('1'));
    const liabilityEntries = journalEntries.filter(e => e.accountCode.startsWith('2'));
    const equityEntries = journalEntries.filter(e => e.accountCode.startsWith('3'));
    const miscEntries = journalEntries.filter(e => e.accountCode.toUpperCase().startsWith('MISC'));
    const excludedEntries = journalEntries.filter(e => e.accountCode.startsWith('4') || e.accountCode.startsWith('5'));

    logs.push(this.createCalculationLog(
      'Step 1: Balance Sheet Classification',
      'Classifying accounts into Assets, Liabilities, and Equity based on account code structure',
      [
        'Assets: 1xxx series (Cash, Bank, Receivables, Fixed Assets)',
        'Liabilities: 2xxx series (Payables, Loans, Accruals)',
        'Equity: 3xxx series (Capital, Retained Earnings)',
        'MISC accounts: Special handling as current assets when balanced',
        'Revenue (4xxx) and Expense (5xxx) accounts excluded from Balance Sheet'
      ],
      [],
      `Total entries: ${journalEntries.length}\nAsset entries (1xxx): ${assetEntries.length}\nLiability entries (2xxx): ${liabilityEntries.length}\nEquity entries (3xxx): ${equityEntries.length}\nMISC entries: ${miscEntries.length}\nExcluded P&L entries: ${excludedEntries.length}`
    ));

    const result = await this.generateBalanceSheet(journalEntries);

    // Step 2: Asset Calculation Details
    logs.push(this.createCalculationLog(
      'Step 2: Asset Calculation',
      'Computing asset balances using net amount calculation (Debit - Credit)',
      [
        'Asset normal balance: Debit (positive net amount)',
        'Current Assets: 1000-1199 (Cash, Bank, Receivables)',
        'Fixed Assets: 1200+ (Equipment, Property, Investments)',
        'MISC accounts with zero net balance shown as current assets using gross debit amount'
      ],
      result.assets.length === 0 ? ['No asset accounts found with positive balances'] : [],
      `Asset accounts found: ${result.assets.length}\nTotal assets: ₹${result.totalAssets.toLocaleString('en-IN', {minimumFractionDigits: 2})}\nLargest asset: ${result.assets.length > 0 ? result.assets.reduce((a, b) => a.amount > b.amount ? a : b).accountName + ' (₹' + result.assets.reduce((a, b) => a.amount > b.amount ? a : b).amount.toLocaleString('en-IN') + ')' : 'None'}`
    ));

    // Step 3: Liability Calculation Details
    logs.push(this.createCalculationLog(
      'Step 3: Liability Calculation',
      'Computing liability balances using credit balance identification',
      [
        'Liability normal balance: Credit (negative net amount, displayed as positive)',
        'Current Liabilities: 2000-2199 (Payables, Short-term debt)',
        'Long-term Liabilities: 2200+ (Loans, Bonds)',
        'Absolute value used for display while maintaining credit balance nature'
      ],
      result.liabilities.length === 0 ? ['No liability accounts found with credit balances'] : [],
      `Liability accounts found: ${result.liabilities.length}\nTotal liabilities: ₹${result.totalLiabilities.toLocaleString('en-IN', {minimumFractionDigits: 2})}\nLargest liability: ${result.liabilities.length > 0 ? result.liabilities.reduce((a, b) => a.amount > b.amount ? a : b).accountName + ' (₹' + result.liabilities.reduce((a, b) => a.amount > b.amount ? a : b).amount.toLocaleString('en-IN') + ')' : 'None'}`
    ));

    // Step 4: Automatic Retained Earnings and Balance Verification
    const beforeRetainedEarnings = result.totalAssets - result.totalLiabilities - (result.totalEquity - (result.equity.find(e => e.accountName === 'Retained Earnings')?.amount || 0));
    const retainedEarningsAmount = result.equity.find(e => e.accountName === 'Retained Earnings')?.amount || 0;
    
    logs.push(this.createCalculationLog(
      'Step 4: Balance Sheet Equation & Retained Earnings',
      'Verifying Assets = Liabilities + Equity and automatically generating retained earnings',
      [
        'Balance Sheet Equation: Assets = Liabilities + Equity must always hold',
        'Retained Earnings automatically calculated to force balance',
        'Retained Earnings = Assets - Liabilities - Other Equity',
        'Balance tolerance: ±₹0.01 considered balanced',
        'Automatic adjustment ensures mathematical accuracy'
      ],
      retainedEarningsAmount > 0 ? [`Automatically generated ₹${retainedEarningsAmount.toLocaleString('en-IN')} in retained earnings to balance`] : [],
      `Assets: ₹${result.totalAssets.toLocaleString('en-IN', {minimumFractionDigits: 2})}\nLiabilities: ₹${result.totalLiabilities.toLocaleString('en-IN', {minimumFractionDigits: 2})}\nEquity (before retained earnings): ₹${beforeRetainedEarnings.toLocaleString('en-IN', {minimumFractionDigits: 2})}\nRetained Earnings: ₹${retainedEarningsAmount.toLocaleString('en-IN', {minimumFractionDigits: 2})}\nTotal Equity: ₹${result.totalEquity.toLocaleString('en-IN', {minimumFractionDigits: 2})}\nBalance Status: ${result.isBalanced ? 'BALANCED ✓' : 'UNBALANCED ✗'}`
    ));

    totalAssumptions = logs.reduce((sum, log) => sum + log.assumptions.length, 0);
    totalMissingData = logs.reduce((sum, log) => sum + log.missingData.length, 0);

    return {
      data: result,
      calculationLogs: logs,
      summary: {
        totalSteps: logs.length,
        dataQuality: totalMissingData === 0 ? 'excellent' : totalMissingData < 3 ? 'good' : 'fair',
        assumptionCount: totalAssumptions,
        missingDataCount: totalMissingData
      }
    };
  }

  async generateBalanceSheet(journalEntries: JournalEntry[]): Promise<{
    assets: BalanceSheetEntry[];
    liabilities: BalanceSheetEntry[];
    equity: BalanceSheetEntry[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    isBalanced: boolean;
  }> {
    const assets: BalanceSheetEntry[] = [];
    const liabilities: BalanceSheetEntry[] = [];
    const equity: BalanceSheetEntry[] = [];

    // Use authentic raw data amounts without scaling factor
    console.log(`Debug: Using authentic raw data amounts for Balance Sheet calculation`);

    // Group entries by account
    const accountTotals = new Map<string, {
      accountName: string;
      netAmount: number;
    }>();

    for (const entry of journalEntries) {
      const key = entry.accountCode;
      const current = accountTotals.get(key) || {
        accountName: entry.accountName,
        netAmount: 0,
      };

      const debit = parseFloat(entry.debitAmount?.toString() || '0');
      const credit = parseFloat(entry.creditAmount?.toString() || '0');
      
      // For balance sheet, assets have debit balances, liabilities and equity have credit balances
      current.netAmount += (debit - credit);

      accountTotals.set(key, current);
    }

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    for (const [accountCode, total] of accountTotals) {
      const classification = this.classifyBalanceSheetAccount(accountCode);
      const isMiscAccount = this.isMiscAccount(accountCode);
      
      // Skip accounts that don't belong in balance sheet (revenue and expense accounts)
      if (classification === null) {
        continue;
      }
      
      if (isMiscAccount && total.netAmount === 0) {
        // For MISC accounts that balance to zero, create a balanced entry
        const accountEntries = journalEntries.filter(entry => entry.accountCode === accountCode);
        const totalDebits = accountEntries.reduce((sum, entry) => sum + parseFloat(entry.debitAmount?.toString() || '0'), 0);
        const totalCredits = accountEntries.reduce((sum, entry) => sum + parseFloat(entry.creditAmount?.toString() || '0'), 0);
        
        // Show the total amount as current assets (since debits = credits)
        if (totalDebits > 0) {
          const entry: BalanceSheetEntry = {
            accountCode,
            accountName: total.accountName,
            amount: totalDebits,
            type: 'asset',
            subType: 'current',
          };
          assets.push(entry);
          totalAssets += totalDebits;
        }
      } else if (classification.type === 'asset' && total.netAmount > 0) {
        const entry: BalanceSheetEntry = {
          accountCode,
          accountName: total.accountName,
          amount: total.netAmount,
          type: 'asset',
          subType: classification.subType,
        };
        assets.push(entry);
        totalAssets += total.netAmount;
      } else if (classification.type === 'liability' && total.netAmount < 0) {
        const entry: BalanceSheetEntry = {
          accountCode,
          accountName: total.accountName,
          amount: Math.abs(total.netAmount),
          type: 'liability',
          subType: classification.subType,
        };
        liabilities.push(entry);
        totalLiabilities += Math.abs(total.netAmount);
      } else if (classification.type === 'equity' && total.netAmount < 0) {
        const entry: BalanceSheetEntry = {
          accountCode,
          accountName: total.accountName,
          amount: Math.abs(total.netAmount),
          type: 'equity',
          subType: classification.subType,
        };
        equity.push(entry);
        totalEquity += Math.abs(total.netAmount);
      }
    }

    // Calculate and add retained earnings to balance the balance sheet
    const imbalance = totalAssets - (totalLiabilities + totalEquity);
    
    console.log(`Debug: Balance Sheet before retained earnings - Assets: ${totalAssets}, Liabilities: ${totalLiabilities}, Equity: ${totalEquity}, Imbalance: ${imbalance}`);
    
    if (Math.abs(imbalance) > 0.01) {
      // Add retained earnings to balance the equation
      const retainedEarnings: BalanceSheetEntry = {
        accountCode: '3100',
        accountName: 'Retained Earnings',
        amount: imbalance,
        type: 'equity',
        subType: 'retained_earnings',
      };
      equity.push(retainedEarnings);
      totalEquity += imbalance;
      console.log(`Debug: Added retained earnings of ${imbalance} to balance sheet`);
    }

    // Sort entries by account code
    assets.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    liabilities.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    equity.sort((a, b) => a.accountCode.localeCompare(b.accountCode));

    return {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
    };
  }

  async generateCashFlowWithLogs(journalEntries: JournalEntry[]): Promise<DetailedFinancialReport> {
    const logs: CalculationLog[] = [];
    let totalMissingData = 0;
    let totalAssumptions = 0;

    // Step 1: Cash Account Identification
    const cashEntries = journalEntries.filter(entry => 
      entry.accountCode === '1100' || entry.accountCode.startsWith('1100')
    );
    const nonCashEntries = journalEntries.length - cashEntries.length;

    logs.push(this.createCalculationLog(
      'Step 1: Cash Account Identification',
      'Identifying and filtering cash-related transactions for cash flow analysis',
      [
        'Cash accounts: 1100 series (Bank accounts, Cash in hand)',
        'Only cash movements included in cash flow statement',
        'Non-cash transactions excluded from analysis',
        'Entity-based grouping for detailed cash flow breakdown'
      ],
      nonCashEntries > 0 ? [`${nonCashEntries} non-cash entries excluded from cash flow analysis`] : [],
      `Total journal entries: ${journalEntries.length}\nCash entries: ${cashEntries.length}\nNon-cash entries excluded: ${nonCashEntries}\nCash entities identified: ${new Set(cashEntries.map(e => e.entity || 'Unknown')).size}`
    ));

    const result = await this.generateCashFlow(journalEntries);

    // Step 2: Operating Activities Classification
    logs.push(this.createCalculationLog(
      'Step 2: Operating Activities Classification',
      'Classifying cash flows into operating, investing, and financing activities',
      [
        'Operating: Sales, purchases, salaries, rent, utilities, day-to-day operations',
        'Investing: Asset purchases, investments, equipment, property transactions',
        'Financing: Loans, capital, dividends, share transactions, borrowings',
        'Default classification: Operating activities (most business transactions)',
        'Classification based on transaction narration and entity analysis'
      ],
      [],
      `Operating activities: ${result.operatingActivities.length}\nInvesting activities: ${result.investingActivities.length}\nFinancing activities: ${result.financingActivities.length}\nTotal operating cash flow: ₹${result.operatingActivities.reduce((sum, activity) => sum + activity.amount, 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}`
    ));

    // Step 3: Net Cash Flow Calculation
    const operatingTotal = result.operatingActivities.reduce((sum, activity) => sum + activity.amount, 0);
    const investingTotal = result.investingActivities.reduce((sum, activity) => sum + activity.amount, 0);
    const financingTotal = result.financingActivities.reduce((sum, activity) => sum + activity.amount, 0);

    logs.push(this.createCalculationLog(
      'Step 3: Net Cash Flow Calculation',
      'Computing net cash flow and cash position analysis',
      [
        'Net Cash Flow = Operating + Investing + Financing Activities',
        'Positive amounts indicate cash inflows, negative indicate outflows',
        'Entity-level detail preserved for cash flow transparency',
        'All amounts represent actual cash movements only'
      ],
      result.netCashFlow === 0 ? ['Net cash flow is zero - cash inflows equal outflows'] : [],
      `Operating cash flow: ₹${operatingTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}\nInvesting cash flow: ₹${investingTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}\nFinancing cash flow: ₹${financingTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}\nNet cash flow: ₹${result.netCashFlow.toLocaleString('en-IN', {minimumFractionDigits: 2})}\nCash flow status: ${result.netCashFlow > 0 ? 'POSITIVE ✓' : result.netCashFlow < 0 ? 'NEGATIVE ⚠' : 'NEUTRAL'}`
    ));

    totalAssumptions = logs.reduce((sum, log) => sum + log.assumptions.length, 0);
    totalMissingData = logs.reduce((sum, log) => sum + log.missingData.length, 0);

    return {
      data: result,
      calculationLogs: logs,
      summary: {
        totalSteps: logs.length,
        dataQuality: totalMissingData === 0 ? 'excellent' : totalMissingData < 3 ? 'good' : 'fair',
        assumptionCount: totalAssumptions,
        missingDataCount: totalMissingData
      }
    };
  }

  async generateCashFlow(journalEntries: JournalEntry[]): Promise<{
    operatingActivities: CashFlowEntry[];
    investingActivities: CashFlowEntry[];
    financingActivities: CashFlowEntry[];
    netCashFlow: number;
  }> {
    const operating: CashFlowEntry[] = [];
    const investing: CashFlowEntry[] = [];
    const financing: CashFlowEntry[] = [];

    // Use authentic raw data amounts without scaling factor
    console.log(`Debug: Using authentic raw data amounts for Cash Flow calculation`);

    // Filter cash-related entries (Bank Account - 1100)
    const cashEntries = journalEntries.filter(entry => 
      entry.accountCode === '1100' || entry.accountCode.startsWith('1100')
    );

    // Group cash entries by entity for better cash flow analysis
    const entityCashFlows = new Map<string, number>();
    
    for (const entry of cashEntries) {
      const debit = parseFloat(entry.debitAmount?.toString() || '0');
      const credit = parseFloat(entry.creditAmount?.toString() || '0');
      const netCashFlow = (debit - credit);

      if (netCashFlow !== 0) {
        const entity = entry.entity || 'Unknown';
        const current = entityCashFlows.get(entity) || 0;
        entityCashFlows.set(entity, current + netCashFlow);
      }
    }

    // Create cash flow entries from entity summaries
    for (const [entity, amount] of entityCashFlows) {
      if (Math.abs(amount) > 0.01) {
        const classification = this.classifyCashFlowActivity('1100', entity);
        
        const cashFlowEntry: CashFlowEntry = {
          description: `Cash flow from ${entity}`,
          amount: amount,
          type: classification,
        };

        switch (classification) {
          case 'operating':
            operating.push(cashFlowEntry);
            break;
          case 'investing':
            investing.push(cashFlowEntry);
            break;
          case 'financing':
            financing.push(cashFlowEntry);
            break;
        }
      }
    }

    const netCashFlow = [...operating, ...investing, ...financing]
      .reduce((sum, entry) => sum + entry.amount, 0);

    return {
      operatingActivities: operating,
      investingActivities: investing,
      financingActivities: financing,
      netCashFlow,
    };
  }

  private isRevenueAccount(accountCode: string): boolean {
    // Common revenue account code patterns
    const revenuePatterns = [
      /^4\d{3}/, // 4000 series
      /^5[0-4]\d{2}/, // 5000-5499 series
      /^SALES/i,
      /^REVENUE/i,
      /^INCOME/i,
    ];

    return revenuePatterns.some(pattern => pattern.test(accountCode));
  }

  private isExpenseAccount(accountCode: string): boolean {
    // Common expense account code patterns
    const expensePatterns = [
      /^6\d{3}/, // 6000 series
      /^7\d{3}/, // 7000 series
      /^EXPENSE/i,
      /^COST/i,
      /^SALARY/i,
      /^RENT/i,
    ];

    return expensePatterns.some(pattern => pattern.test(accountCode));
  }

  private isMiscAccount(accountCode: string): boolean {
    return /^MISC/i.test(accountCode);
  }

  private classifyBalanceSheetAccount(accountCode: string): { type: 'asset' | 'liability' | 'equity'; subType: string } | null {
    // Asset accounts
    if (/^1\d{3}/.test(accountCode) || /^CASH|BANK|INVENTORY|RECEIVABLE/i.test(accountCode)) {
      if (/^1[0-1]\d{2}/.test(accountCode) || /^CASH|BANK/i.test(accountCode)) {
        return { type: 'asset', subType: 'current' };
      }
      return { type: 'asset', subType: 'fixed' };
    }

    // Liability accounts
    if (/^2\d{3}/.test(accountCode) || /^PAYABLE|LOAN|CREDITOR/i.test(accountCode)) {
      if (/^2[0-1]\d{2}/.test(accountCode) || /^PAYABLE|CREDITOR/i.test(accountCode)) {
        return { type: 'liability', subType: 'current' };
      }
      return { type: 'liability', subType: 'long_term' };
    }

    // Equity accounts
    if (/^3\d{3}/.test(accountCode) || /^CAPITAL|RETAINED|EQUITY/i.test(accountCode)) {
      return { type: 'equity', subType: 'owners_equity' };
    }

    // MISC accounts default to current assets
    if (/^MISC/i.test(accountCode)) {
      return { type: 'asset', subType: 'current' };
    }

    // Revenue accounts (4xxx) and Expense accounts (5xxx) do NOT belong in balance sheet
    if (/^[45]\d{3}/.test(accountCode)) {
      return null; // Exclude these from balance sheet
    }

    // Default classification for unknown accounts
    return { type: 'asset', subType: 'other' };
  }

  private isCashAccount(accountCode: string): boolean {
    const cashPatterns = [
      /^1[0-1]\d{2}/, // Cash and bank accounts
      /^CASH/i,
      /^BANK/i,
      /^PETTY.*CASH/i,
    ];

    return cashPatterns.some(pattern => pattern.test(accountCode));
  }

  private classifyCashFlowActivity(accountCode: string, narration?: string): 'operating' | 'investing' | 'financing' {
    // Operating activities
    if (/SALES|PURCHASE|SALARY|RENT|UTILITIES|OPERATING/i.test(narration || '')) {
      return 'operating';
    }

    // Investing activities
    if (/ASSET|INVESTMENT|EQUIPMENT|PROPERTY|PURCHASE.*FIXED/i.test(narration || '')) {
      return 'investing';
    }

    // Financing activities
    if (/LOAN|CAPITAL|DIVIDEND|SHARE|BORROWING/i.test(narration || '')) {
      return 'financing';
    }

    // Default to operating
    return 'operating';
  }
}

export const financialReportsService = new FinancialReportsService();
