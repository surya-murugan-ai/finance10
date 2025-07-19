/**
 * LLM Calculation Integration Service
 * Provides LLMs with access to calculation tools for accurate financial computations
 */

import { calculationTools, CalculationResult } from './calculationTools';
import Anthropic from '@anthropic-ai/sdk';

interface CalculationRequest {
  operation: string;
  parameters: any[];
  context?: string;
}

interface CalculationResponse {
  success: boolean;
  result?: CalculationResult | any;
  error?: string;
  explanation?: string;
}

export class LLMCalculationIntegration {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Execute calculation based on LLM request
   */
  async executeCalculation(request: CalculationRequest): Promise<CalculationResponse> {
    try {
      const { operation, parameters } = request;

      // Handle both array and object parameter formats
      const getParam = (index: number, name?: string) => {
        if (Array.isArray(parameters)) {
          return parameters[index];
        } else if (parameters && typeof parameters === 'object' && name && parameters[name] !== undefined) {
          return parameters[name];
        } else if (parameters && typeof parameters === 'object') {
          const keys = Object.keys(parameters);
          const key = keys[index];
          return parameters[key];
        } else {
          return undefined;
        }
      };

      switch (operation.toLowerCase()) {
        case 'add':
          const a = getParam(0, 'a');
          const b = getParam(1, 'b');
          return {
            success: true,
            result: calculationTools.add(a, b),
            explanation: `Added ${a} and ${b}`
          };

        case 'subtract':
          const subA = getParam(0, 'a');
          const subB = getParam(1, 'b');
          return {
            success: true,
            result: calculationTools.subtract(subA, subB),
            explanation: `Subtracted ${subB} from ${subA}`
          };

        case 'multiply':
          const mulA = getParam(0, 'a');
          const mulB = getParam(1, 'b');
          return {
            success: true,
            result: calculationTools.multiply(mulA, mulB),
            explanation: `Multiplied ${mulA} by ${mulB}`
          };

        case 'divide':
          const divA = getParam(0, 'a');
          const divB = getParam(1, 'b');
          return {
            success: true,
            result: calculationTools.divide(divA, divB),
            explanation: `Divided ${divA} by ${divB}`
          };

        case 'percentage':
          const pctValue = getParam(0, 'value');
          const pctTotal = getParam(1, 'total');
          return {
            success: true,
            result: calculationTools.percentage(pctValue, pctTotal),
            explanation: `Calculated ${pctValue} as percentage of ${pctTotal}`
          };

        case 'currentratio':
          const currentAssets = getParam(0, 'currentAssets');
          const currentLiabilities = getParam(1, 'currentLiabilities');
          if (currentLiabilities === 0) {
            throw new Error('Current liabilities cannot be zero for current ratio calculation');
          }
          const ratio = parseFloat((currentAssets / currentLiabilities).toFixed(2));
          return {
            success: true,
            result: {
              result: ratio,
              formula: `${currentAssets} ÷ ${currentLiabilities} = ${ratio}`,
              precision: 2,
              currency: 'INR'
            },
            explanation: `Calculated current ratio: ${currentAssets} ÷ ${currentLiabilities} = ${ratio}`
          };

        case 'validatefinancialdata':
          const data = getParam(0, 'data');
          if (!data || !data.transactions || !data.accounts) {
            return {
              success: true,
              result: {
                duplicateCount: 0,
                missingBalances: 0,
                errors: ['No valid data provided for validation'],
                warnings: [],
                summary: 'No data to validate'
              },
              explanation: 'ValidatorAgent: No data provided for validation'
            };
          }
          
          // Simulate duplicate detection
          const duplicates = data.transactions.filter((t, i, arr) => 
            arr.findIndex(x => x.date === t.date && x.amount === t.amount && x.description === t.description) !== i
          );
          
          return {
            success: true,
            result: {
              duplicateCount: duplicates.length,
              missingBalances: 0,
              errors: duplicates.length > 0 ? [`Found ${duplicates.length} duplicate transactions`] : [],
              warnings: [],
              summary: `ValidatorAgent checked ${data.transactions.length} transactions, found ${duplicates.length} duplicates`
            },
            explanation: `ValidatorAgent analyzed financial data and found ${duplicates.length} issues`
          };

        case 'identifymissingprovisions':
          const financialData = getParam(0, 'financialData');
          if (!financialData) {
            return {
              success: true,
              result: {
                provisionCount: 0,
                provisions: [],
                adjustments: [],
                summary: 'No financial data provided for provision analysis'
              },
              explanation: 'ProvisionBot: No data provided for analysis'
            };
          }
          
          const provisions = [];
          const adjustments = [];
          
          // Check for missing depreciation
          if (financialData.fixedAssets && financialData.fixedAssets.length > 0) {
            financialData.fixedAssets.forEach(asset => {
              if (asset.depreciation === 0 && asset.cost > 0) {
                const depreciationAmount = asset.cost * 0.15; // 15% depreciation rate
                provisions.push({
                  type: 'Depreciation',
                  asset: asset.name,
                  amount: depreciationAmount,
                  rate: '15%'
                });
                adjustments.push({
                  debit: { account: '5600', name: 'Depreciation Expense', amount: depreciationAmount },
                  credit: { account: '1590', name: 'Accumulated Depreciation', amount: depreciationAmount }
                });
              }
            });
          }
          
          // Check for bad debt provision
          if (financialData.receivables && financialData.receivables.length > 0) {
            const totalReceivables = financialData.receivables.reduce((sum, r) => sum + r.amount, 0);
            const badDebtAmount = totalReceivables * 0.05; // 5% bad debt provision
            provisions.push({
              type: 'Bad Debt Provision',
              baseAmount: totalReceivables,
              amount: badDebtAmount,
              rate: '5%'
            });
            adjustments.push({
              debit: { account: '5700', name: 'Bad Debt Expense', amount: badDebtAmount },
              credit: { account: '1590', name: 'Provision for Bad Debts', amount: badDebtAmount }
            });
          }
          
          return {
            success: true,
            result: {
              provisionCount: provisions.length,
              provisions: provisions,
              adjustments: adjustments,
              summary: `ProvisionBot identified ${provisions.length} missing provisions requiring total adjustment of ₹${adjustments.reduce((sum, adj) => sum + adj.debit.amount, 0).toFixed(2)}`
            },
            explanation: `ProvisionBot analyzed financial data and identified ${provisions.length} missing provisions`
          };

        case 'gross_profit_margin':
          return {
            success: true,
            result: calculationTools.grossProfitMargin(parameters[0], parameters[1]),
            explanation: `Calculated gross profit margin for revenue ₹${parameters[0]} and COGS ₹${parameters[1]}`
          };

        case 'net_profit_margin':
          return {
            success: true,
            result: calculationTools.netProfitMargin(parameters[0], parameters[1]),
            explanation: `Calculated net profit margin for net income ₹${parameters[0]} and revenue ₹${parameters[1]}`
          };

        case 'gst_calculation':
          return {
            success: true,
            result: calculationTools.gstCalculation(parameters[0], parameters[1]),
            explanation: `Calculated GST for amount ₹${parameters[0]} at ${parameters[1]}% rate`
          };

        case 'tds_calculation':
          return {
            success: true,
            result: calculationTools.tdsCalculation(parameters[0], parameters[1]),
            explanation: `Calculated TDS for amount ₹${parameters[0]} at ${parameters[1]}% rate`
          };

        case 'sum':
          return {
            success: true,
            result: calculationTools.sum(parameters[0]),
            explanation: `Calculated sum of ${parameters[0].length} values`
          };

        case 'average':
          return {
            success: true,
            result: calculationTools.average(parameters[0]),
            explanation: `Calculated average of ${parameters[0].length} values`
          };

        case 'validate_trial_balance':
          return {
            success: true,
            result: calculationTools.validateTrialBalance(parameters[0], parameters[1]),
            explanation: `Validated trial balance with ${parameters[0].length} debit entries and ${parameters[1].length} credit entries`
          };

        case 'financial_metrics':
          return {
            success: true,
            result: calculationTools.calculateFinancialMetrics(
              parameters[0], // revenue
              parameters[1], // cogs
              parameters[2], // totalExpenses
              parameters[3]  // investment
            ),
            explanation: `Calculated comprehensive financial metrics`
          };

        default:
          return {
            success: false,
            error: `Unknown calculation operation: ${operation}`
          };
      }

    } catch (error) {
      return {
        success: false,
        error: error.message || 'Calculation failed'
      };
    }
  }

  /**
   * Enhanced LLM prompt with calculation tools
   */
  async processFinancialQueryWithTools(
    query: string,
    context: any = {},
    availableData: any = {}
  ): Promise<string> {
    try {
      const toolsDescription = calculationTools.getAvailableTools().join('\n');
      
      const prompt = `
You are a financial analysis AI with access to precise calculation tools. 
Instead of performing calculations directly, you should use the available tools for accuracy.

Available Calculation Tools:
${toolsDescription}

Query: ${query}

Context: ${JSON.stringify(context, null, 2)}

Available Data: ${JSON.stringify(availableData, null, 2)}

Rules:
1. NEVER perform manual calculations
2. Always use calculation tools for any mathematical operations
3. Provide step-by-step analysis using tools
4. Explain which tools you would use and why
5. Return your response in this format:

ANALYSIS:
[Your analysis of what needs to be calculated]

CALCULATION STEPS:
[List each calculation tool you would use with parameters]

INTERPRETATION:
[Explain what the results mean in business context]

Please analyze the query and specify exactly which calculation tools should be used.
`;

      const response = await this.anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      });

      return response.content[0].text;

    } catch (error) {
      console.error('Error in LLM calculation integration:', error);
      throw new Error(`Failed to process query with calculation tools: ${error.message}`);
    }
  }

  /**
   * Execute multiple calculations in sequence
   */
  async executeCalculationSequence(requests: CalculationRequest[]): Promise<CalculationResponse[]> {
    const results: CalculationResponse[] = [];
    
    for (const request of requests) {
      const result = await this.executeCalculation(request);
      results.push(result);
      
      // If any calculation fails, stop the sequence
      if (!result.success) {
        break;
      }
    }
    
    return results;
  }

  /**
   * Validate financial data using calculation tools
   */
  async validateFinancialData(data: any): Promise<{
    isValid: boolean;
    issues: string[];
    corrections: CalculationResponse[];
  }> {
    const issues: string[] = [];
    const corrections: CalculationResponse[] = [];

    try {
      // Check for trial balance if debit/credit data exists
      if (data.debits && data.credits) {
        const balanceCheck = await this.executeCalculation({
          operation: 'validate_trial_balance',
          parameters: [data.debits, data.credits]
        });
        
        if (balanceCheck.success && !balanceCheck.result.isBalanced) {
          issues.push(`Trial balance not balanced: Difference of ₹${balanceCheck.result.difference}`);
          corrections.push(balanceCheck);
        }
      }

      // Check percentage calculations if applicable
      if (data.revenue && data.expenses) {
        const marginCheck = await this.executeCalculation({
          operation: 'net_profit_margin',
          parameters: [data.revenue - data.expenses, data.revenue]
        });
        corrections.push(marginCheck);
      }

      return {
        isValid: issues.length === 0,
        issues,
        corrections
      };

    } catch (error) {
      return {
        isValid: false,
        issues: [`Validation error: ${error.message}`],
        corrections: []
      };
    }
  }
}

// Export singleton instance
export const llmCalculationIntegration = new LLMCalculationIntegration();