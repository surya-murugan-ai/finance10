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

      switch (operation.toLowerCase()) {
        case 'add':
          return {
            success: true,
            result: calculationTools.add(parameters[0], parameters[1]),
            explanation: `Added ${parameters[0]} and ${parameters[1]}`
          };

        case 'subtract':
          return {
            success: true,
            result: calculationTools.subtract(parameters[0], parameters[1]),
            explanation: `Subtracted ${parameters[1]} from ${parameters[0]}`
          };

        case 'multiply':
          return {
            success: true,
            result: calculationTools.multiply(parameters[0], parameters[1]),
            explanation: `Multiplied ${parameters[0]} by ${parameters[1]}`
          };

        case 'divide':
          return {
            success: true,
            result: calculationTools.divide(parameters[0], parameters[1]),
            explanation: `Divided ${parameters[0]} by ${parameters[1]}`
          };

        case 'percentage':
          return {
            success: true,
            result: calculationTools.percentage(parameters[0], parameters[1]),
            explanation: `Calculated ${parameters[0]} as percentage of ${parameters[1]}`
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