/**
 * Calculation Tools for LLM Integration
 * Provides accurate, predictable mathematical operations for financial calculations
 */

export interface CalculationResult {
  result: number;
  formula: string;
  precision: number;
  currency?: string;
}

export interface FinancialMetrics {
  grossProfit: number;
  netProfit: number;
  grossMargin: number;
  netMargin: number;
  roi: number;
  debtToEquity?: number;
}

export class CalculationTools {
  private precision: number = 2;
  private currency: string = 'INR';

  constructor(precision: number = 2, currency: string = 'INR') {
    this.precision = precision;
    this.currency = currency;
  }

  /**
   * Basic arithmetic operations
   */
  add(a: number, b: number): CalculationResult {
    const result = this.round(a + b);
    return {
      result,
      formula: `${a} + ${b} = ${result}`,
      precision: this.precision,
      currency: this.currency
    };
  }

  subtract(a: number, b: number): CalculationResult {
    const result = this.round(a - b);
    return {
      result,
      formula: `${a} - ${b} = ${result}`,
      precision: this.precision,
      currency: this.currency
    };
  }

  multiply(a: number, b: number): CalculationResult {
    const result = this.round(a * b);
    return {
      result,
      formula: `${a} × ${b} = ${result}`,
      precision: this.precision,
      currency: this.currency
    };
  }

  divide(a: number, b: number): CalculationResult {
    if (b === 0) {
      throw new Error('Division by zero is not allowed');
    }
    const result = this.round(a / b);
    return {
      result,
      formula: `${a} ÷ ${b} = ${result}`,
      precision: this.precision,
      currency: this.currency
    };
  }

  /**
   * Percentage calculations
   */
  percentage(value: number, total: number): CalculationResult {
    if (total === 0) {
      throw new Error('Total cannot be zero for percentage calculation');
    }
    const result = this.round((value / total) * 100);
    return {
      result,
      formula: `(${value} ÷ ${total}) × 100 = ${result}%`,
      precision: this.precision
    };
  }

  percentageIncrease(oldValue: number, newValue: number): CalculationResult {
    if (oldValue === 0) {
      throw new Error('Old value cannot be zero for percentage increase calculation');
    }
    const result = this.round(((newValue - oldValue) / oldValue) * 100);
    return {
      result,
      formula: `((${newValue} - ${oldValue}) ÷ ${oldValue}) × 100 = ${result}%`,
      precision: this.precision
    };
  }

  /**
   * Financial ratio calculations
   */
  grossProfitMargin(revenue: number, cogs: number): CalculationResult {
    if (revenue === 0) {
      throw new Error('Revenue cannot be zero for gross profit margin calculation');
    }
    const grossProfit = revenue - cogs;
    const result = this.round((grossProfit / revenue) * 100);
    return {
      result,
      formula: `((${revenue} - ${cogs}) ÷ ${revenue}) × 100 = ${result}%`,
      precision: this.precision
    };
  }

  netProfitMargin(netIncome: number, revenue: number): CalculationResult {
    if (revenue === 0) {
      throw new Error('Revenue cannot be zero for net profit margin calculation');
    }
    const result = this.round((netIncome / revenue) * 100);
    return {
      result,
      formula: `(${netIncome} ÷ ${revenue}) × 100 = ${result}%`,
      precision: this.precision
    };
  }

  debtToEquityRatio(totalDebt: number, totalEquity: number): CalculationResult {
    if (totalEquity === 0) {
      throw new Error('Total equity cannot be zero for debt-to-equity ratio calculation');
    }
    const result = this.round(totalDebt / totalEquity);
    return {
      result,
      formula: `${totalDebt} ÷ ${totalEquity} = ${result}`,
      precision: this.precision
    };
  }

  returnOnInvestment(gain: number, cost: number): CalculationResult {
    if (cost === 0) {
      throw new Error('Cost cannot be zero for ROI calculation');
    }
    const result = this.round(((gain - cost) / cost) * 100);
    return {
      result,
      formula: `((${gain} - ${cost}) ÷ ${cost}) × 100 = ${result}%`,
      precision: this.precision
    };
  }

  /**
   * Tax calculations
   */
  gstCalculation(amount: number, gstRate: number): {
    baseAmount: number;
    gstAmount: number;
    totalAmount: number;
    formula: string;
  } {
    const gstAmount = this.round((amount * gstRate) / 100);
    const totalAmount = this.round(amount + gstAmount);
    
    return {
      baseAmount: amount,
      gstAmount,
      totalAmount,
      formula: `Base: ₹${amount}, GST (${gstRate}%): ₹${gstAmount}, Total: ₹${totalAmount}`
    };
  }

  tdsCalculation(amount: number, tdsRate: number): {
    grossAmount: number;
    tdsAmount: number;
    netAmount: number;
    formula: string;
  } {
    const tdsAmount = this.round((amount * tdsRate) / 100);
    const netAmount = this.round(amount - tdsAmount);
    
    return {
      grossAmount: amount,
      tdsAmount,
      netAmount,
      formula: `Gross: ₹${amount}, TDS (${tdsRate}%): ₹${tdsAmount}, Net: ₹${netAmount}`
    };
  }

  /**
   * Aggregation functions
   */
  sum(values: number[]): CalculationResult {
    const result = this.round(values.reduce((acc, val) => acc + val, 0));
    return {
      result,
      formula: `${values.join(' + ')} = ${result}`,
      precision: this.precision,
      currency: this.currency
    };
  }

  average(values: number[]): CalculationResult {
    if (values.length === 0) {
      throw new Error('Cannot calculate average of empty array');
    }
    const sum = values.reduce((acc, val) => acc + val, 0);
    const result = this.round(sum / values.length);
    return {
      result,
      formula: `(${values.join(' + ')}) ÷ ${values.length} = ${result}`,
      precision: this.precision,
      currency: this.currency
    };
  }

  variance(values: number[]): CalculationResult {
    if (values.length === 0) {
      throw new Error('Cannot calculate variance of empty array');
    }
    const avg = values.reduce((acc, val) => acc + val, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
    const result = this.round(variance);
    return {
      result,
      formula: `Variance of [${values.join(', ')}] = ${result}`,
      precision: this.precision
    };
  }

  /**
   * Financial statement calculations
   */
  calculateFinancialMetrics(
    revenue: number,
    cogs: number,
    totalExpenses: number,
    investment: number
  ): FinancialMetrics {
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - totalExpenses;
    const grossMargin = revenue > 0 ? this.round((grossProfit / revenue) * 100) : 0;
    const netMargin = revenue > 0 ? this.round((netProfit / revenue) * 100) : 0;
    const roi = investment > 0 ? this.round((netProfit / investment) * 100) : 0;

    return {
      grossProfit: this.round(grossProfit),
      netProfit: this.round(netProfit),
      grossMargin,
      netMargin,
      roi
    };
  }

  /**
   * Trial balance validation
   */
  validateTrialBalance(debits: number[], credits: number[]): {
    totalDebits: number;
    totalCredits: number;
    difference: number;
    isBalanced: boolean;
    formula: string;
  } {
    const totalDebits = this.round(debits.reduce((acc, val) => acc + val, 0));
    const totalCredits = this.round(credits.reduce((acc, val) => acc + val, 0));
    const difference = this.round(totalDebits - totalCredits);
    const isBalanced = Math.abs(difference) < 0.01; // Allow for minor rounding differences

    return {
      totalDebits,
      totalCredits,
      difference,
      isBalanced,
      formula: `Debits: ₹${totalDebits}, Credits: ₹${totalCredits}, Difference: ₹${difference}`
    };
  }

  /**
   * Compound calculations
   */
  compoundInterest(
    principal: number,
    rate: number,
    time: number,
    compoundingFrequency: number = 1
  ): CalculationResult {
    const result = this.round(
      principal * Math.pow(1 + rate / (100 * compoundingFrequency), compoundingFrequency * time)
    );
    return {
      result,
      formula: `P(1 + r/n)^(nt) where P=${principal}, r=${rate}%, t=${time}, n=${compoundingFrequency}`,
      precision: this.precision,
      currency: this.currency
    };
  }

  /**
   * Utility functions
   */
  private round(value: number): number {
    return Math.round(value * Math.pow(10, this.precision)) / Math.pow(10, this.precision);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: this.precision,
      maximumFractionDigits: this.precision
    }).format(amount);
  }

  /**
   * Convert tools to LLM-friendly format
   */
  getAvailableTools(): string[] {
    return [
      'add(a, b) - Addition',
      'subtract(a, b) - Subtraction', 
      'multiply(a, b) - Multiplication',
      'divide(a, b) - Division',
      'percentage(value, total) - Calculate percentage',
      'percentageIncrease(oldValue, newValue) - Calculate percentage increase',
      'grossProfitMargin(revenue, cogs) - Calculate gross profit margin',
      'netProfitMargin(netIncome, revenue) - Calculate net profit margin',
      'debtToEquityRatio(totalDebt, totalEquity) - Calculate debt-to-equity ratio',
      'returnOnInvestment(gain, cost) - Calculate ROI',
      'gstCalculation(amount, gstRate) - Calculate GST',
      'tdsCalculation(amount, tdsRate) - Calculate TDS',
      'sum(values[]) - Sum array of numbers',
      'average(values[]) - Calculate average',
      'variance(values[]) - Calculate variance',
      'validateTrialBalance(debits[], credits[]) - Validate trial balance',
      'compoundInterest(principal, rate, time, frequency) - Calculate compound interest'
    ];
  }

  /**
   * Financial Statement Calculators
   */
  currentRatio(currentAssets: number, currentLiabilities: number): CalculationResult & {
    interpretation: string;
    riskLevel: string;
  } {
    if (currentLiabilities === 0) {
      throw new Error('Current liabilities cannot be zero for current ratio calculation');
    }
    const result = this.round(currentAssets / currentLiabilities);
    
    let interpretation: string;
    let riskLevel: string;
    
    if (result >= 2) {
      interpretation = 'Excellent liquidity position';
      riskLevel = 'Low';
    } else if (result >= 1.5) {
      interpretation = 'Good liquidity position';
      riskLevel = 'Low';
    } else if (result >= 1) {
      interpretation = 'Adequate liquidity position';
      riskLevel = 'Medium';
    } else {
      interpretation = 'Poor liquidity position';
      riskLevel = 'High';
    }
    
    return {
      result,
      formula: `Current Assets ÷ Current Liabilities = ₹${currentAssets.toLocaleString('en-IN')} ÷ ₹${currentLiabilities.toLocaleString('en-IN')} = ${result}`,
      precision: this.precision,
      interpretation,
      riskLevel
    };
  }

  quickRatio(quickAssets: number, currentLiabilities: number): CalculationResult & {
    interpretation: string;
    riskLevel: string;
  } {
    if (currentLiabilities === 0) {
      throw new Error('Current liabilities cannot be zero for quick ratio calculation');
    }
    const result = this.round(quickAssets / currentLiabilities);
    
    let interpretation: string;
    let riskLevel: string;
    
    if (result >= 1) {
      interpretation = 'Strong liquidity - can cover short-term obligations';
      riskLevel = 'Low';
    } else if (result >= 0.8) {
      interpretation = 'Acceptable liquidity position';
      riskLevel = 'Medium';
    } else {
      interpretation = 'Weak liquidity - may struggle with short-term obligations';
      riskLevel = 'High';
    }
    
    return {
      result,
      formula: `Quick Assets ÷ Current Liabilities = ₹${quickAssets.toLocaleString('en-IN')} ÷ ₹${currentLiabilities.toLocaleString('en-IN')} = ${result}`,
      precision: this.precision,
      interpretation,
      riskLevel
    };
  }

  returnOnEquity(netIncome: number, shareholderEquity: number): CalculationResult & {
    interpretation: string;
    performance: string;
  } {
    if (shareholderEquity === 0) {
      throw new Error('Shareholder equity cannot be zero for ROE calculation');
    }
    const result = this.round((netIncome / shareholderEquity) * 100);
    
    let interpretation: string;
    let performance: string;
    
    if (result >= 20) {
      interpretation = 'Exceptional profitability and efficiency';
      performance = 'Excellent';
    } else if (result >= 15) {
      interpretation = 'Strong profitability performance';
      performance = 'Good';
    } else if (result >= 10) {
      interpretation = 'Average profitability performance';
      performance = 'Average';
    } else {
      interpretation = 'Below average profitability';
      performance = 'Poor';
    }
    
    return {
      result,
      formula: `(Net Income ÷ Shareholder Equity) × 100 = (₹${netIncome.toLocaleString('en-IN')} ÷ ₹${shareholderEquity.toLocaleString('en-IN')}) × 100 = ${result}%`,
      precision: this.precision,
      interpretation,
      performance
    };
  }

  /**
   * Journal Entry and Bookkeeping Tools
   */
  createJournalEntry(description: string, entries: Array<{account: string, debit: number, credit: number}>): {
    entryId: string;
    date: string;
    description: string;
    entries: Array<{account: string, debit: number, credit: number}>;
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
    formula: string;
    status: string;
  } {
    const totalDebits = this.round(entries.reduce((sum, entry) => sum + entry.debit, 0));
    const totalCredits = this.round(entries.reduce((sum, entry) => sum + entry.credit, 0));
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;
    
    return {
      entryId: `JE-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      description,
      entries,
      totalDebits,
      totalCredits,
      isBalanced,
      formula: `Total Debits = ₹${totalDebits.toLocaleString('en-IN')}, Total Credits = ₹${totalCredits.toLocaleString('en-IN')}`,
      status: isBalanced ? 'Valid' : `Unbalanced by ₹${Math.abs(totalDebits - totalCredits).toLocaleString('en-IN')}`
    };
  }

  validateJournalEntries(entries: Array<{account: string, debit: number, credit: number}>): {
    totalDebits: number;
    totalCredits: number;
    difference: number;
    isBalanced: boolean;
    entryCount: number;
    formula: string;
    status: string;
    errors: string[];
  } {
    const totalDebits = this.round(entries.reduce((sum, entry) => sum + entry.debit, 0));
    const totalCredits = this.round(entries.reduce((sum, entry) => sum + entry.credit, 0));
    const difference = this.round(totalDebits - totalCredits);
    const isBalanced = Math.abs(difference) < 0.01;
    
    const errors: string[] = [];
    if (!isBalanced) {
      errors.push(`Journal entries are unbalanced by ₹${Math.abs(difference).toLocaleString('en-IN')}`);
    }
    
    entries.forEach((entry, index) => {
      if (!entry.account || entry.account.trim() === '') {
        errors.push(`Entry ${index + 1}: Account name is required`);
      }
      if (entry.debit < 0 || entry.credit < 0) {
        errors.push(`Entry ${index + 1}: Negative amounts are not allowed`);
      }
      if (entry.debit > 0 && entry.credit > 0) {
        errors.push(`Entry ${index + 1}: Cannot have both debit and credit amounts`);
      }
      if (entry.debit === 0 && entry.credit === 0) {
        errors.push(`Entry ${index + 1}: Must have either debit or credit amount`);
      }
    });
    
    return {
      totalDebits,
      totalCredits,
      difference,
      isBalanced,
      entryCount: entries.length,
      formula: `∑Debits = ₹${totalDebits.toLocaleString('en-IN')}, ∑Credits = ₹${totalCredits.toLocaleString('en-IN')}`,
      status: isBalanced && errors.length === 0 ? 'Valid' : 'Invalid',
      errors
    };
  }

  /**
   * Trial Balance Calculators
   */
  generateTrialBalance(accounts: Array<{code: string, name: string, debit: number, credit: number}>): {
    accounts: Array<{
      code: string;
      name: string;
      debit: number;
      credit: number;
      balance: number;
      balanceType: string;
    }>;
    totals: {
      totalDebits: number;
      totalCredits: number;
      difference: number;
      isBalanced: boolean;
    };
    formula: string;
    status: string;
    accountCount: number;
  } {
    const processedAccounts = accounts.map(acc => {
      const balance = this.round(acc.debit - acc.credit);
      return {
        ...acc,
        balance: Math.abs(balance),
        balanceType: balance >= 0 ? 'Debit' : 'Credit'
      };
    });
    
    const totalDebits = this.round(accounts.reduce((sum, acc) => sum + acc.debit, 0));
    const totalCredits = this.round(accounts.reduce((sum, acc) => sum + acc.credit, 0));
    const difference = this.round(totalDebits - totalCredits);
    const isBalanced = Math.abs(difference) < 0.01;
    
    return {
      accounts: processedAccounts,
      totals: {
        totalDebits,
        totalCredits,
        difference,
        isBalanced
      },
      formula: `∑Debits = ₹${totalDebits.toLocaleString('en-IN')}, ∑Credits = ₹${totalCredits.toLocaleString('en-IN')}`,
      status: isBalanced ? 'Balanced' : `Unbalanced by ₹${Math.abs(difference).toLocaleString('en-IN')}`,
      accountCount: accounts.length
    };
  }

  calculateAccountBalance(transactions: Array<{date: string, debit: number, credit: number, description: string}>): {
    transactions: Array<{
      date: string;
      debit: number;
      credit: number;
      description: string;
      runningBalance: number;
      balanceType: string;
    }>;
    summary: {
      finalBalance: number;
      balanceType: string;
      totalDebits: number;
      totalCredits: number;
      transactionCount: number;
    };
    formula: string;
  } {
    let runningBalance = 0;
    const processedTransactions = transactions.map(txn => {
      runningBalance = this.round(runningBalance + txn.debit - txn.credit);
      return {
        ...txn,
        runningBalance: Math.abs(runningBalance),
        balanceType: runningBalance >= 0 ? 'Debit' : 'Credit'
      };
    });
    
    const totalDebits = this.round(transactions.reduce((sum, txn) => sum + txn.debit, 0));
    const totalCredits = this.round(transactions.reduce((sum, txn) => sum + txn.credit, 0));
    const finalBalance = this.round(totalDebits - totalCredits);
    
    return {
      transactions: processedTransactions,
      summary: {
        finalBalance: Math.abs(finalBalance),
        balanceType: finalBalance >= 0 ? 'Debit' : 'Credit',
        totalDebits,
        totalCredits,
        transactionCount: transactions.length
      },
      formula: `Final Balance = ∑Debits - ∑Credits = ₹${totalDebits.toLocaleString('en-IN')} - ₹${totalCredits.toLocaleString('en-IN')} = ₹${Math.abs(finalBalance).toLocaleString('en-IN')} ${finalBalance >= 0 ? 'Dr' : 'Cr'}`
    };
  }

  /**
   * Advanced Financial Analysis
   */
  workingCapital(currentAssets: number, currentLiabilities: number): CalculationResult & {
    interpretation: string;
    adequacy: string;
  } {
    const result = this.round(currentAssets - currentLiabilities);
    
    let interpretation: string;
    let adequacy: string;
    
    if (result > 0) {
      const ratio = currentAssets / currentLiabilities;
      if (ratio >= 2) {
        interpretation = 'Excellent working capital position';
        adequacy = 'Highly Adequate';
      } else if (ratio >= 1.5) {
        interpretation = 'Good working capital position';
        adequacy = 'Adequate';
      } else {
        interpretation = 'Minimal working capital position';
        adequacy = 'Barely Adequate';
      }
    } else {
      interpretation = 'Negative working capital - potential liquidity issues';
      adequacy = 'Inadequate';
    }
    
    return {
      result: Math.abs(result),
      formula: `Current Assets - Current Liabilities = ₹${currentAssets.toLocaleString('en-IN')} - ₹${currentLiabilities.toLocaleString('en-IN')} = ₹${Math.abs(result).toLocaleString('en-IN')}`,
      precision: this.precision,
      currency: this.currency,
      interpretation,
      adequacy
    };
  }
}

// Export singleton instance
export const calculationTools = new CalculationTools();