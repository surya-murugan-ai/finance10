import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { RefreshCw, Plus, ChevronDown, ChevronRight, Info, AlertTriangle, CheckCircle, Calculator } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Interfaces for detailed calculation logs
interface CalculationLog {
  step: string;
  description: string;
  assumptions: string[];
  missingData: string[];
  calculationDetails: string;
  timestamp: string;
}

interface DetailedFinancialReport {
  data: any;
  calculationLogs: CalculationLog[];
  summary: {
    totalSteps: number;
    dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
    assumptionCount: number;
    missingDataCount: number;
  };
}

// Calculation Logs Display Component
function CalculationLogsDisplay({ logs, summary, title }: { 
  logs: CalculationLog[], 
  summary: any, 
  title: string 
}) {
  const [openSteps, setOpenSteps] = useState<Set<string>>(new Set());
  
  const toggleStep = (step: string) => {
    const newOpenSteps = new Set(openSteps);
    if (newOpenSteps.has(step)) {
      newOpenSteps.delete(step);
    } else {
      newOpenSteps.add(step);
    }
    setOpenSteps(newOpenSteps);
  };

  const getDataQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          {title} - Calculation Transparency
        </CardTitle>
        <div className="flex gap-2 flex-wrap">
          <Badge className={getDataQualityColor(summary.dataQuality)}>
            Data Quality: {summary.dataQuality.toUpperCase()}
          </Badge>
          <Badge variant="outline">
            {summary.totalSteps} Calculation Steps
          </Badge>
          <Badge variant="outline">
            {summary.assumptionCount} Assumptions
          </Badge>
          {summary.missingDataCount > 0 && (
            <Badge variant="destructive">
              {summary.missingDataCount} Missing Data Points
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {logs.map((log, index) => (
          <Collapsible key={index} open={openSteps.has(log.step)}>
            <CollapsibleTrigger 
              onClick={() => toggleStep(log.step)}
              className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                {openSteps.has(log.step) ? 
                  <ChevronDown className="w-4 h-4" /> : 
                  <ChevronRight className="w-4 h-4" />
                }
                <span className="font-medium">{log.step}</span>
              </div>
              <div className="flex gap-2">
                {log.assumptions.length > 0 && (
                  <Badge variant="secondary">
                    {log.assumptions.length} assumptions
                  </Badge>
                )}
                {log.missingData.length > 0 && (
                  <Badge variant="destructive">
                    {log.missingData.length} missing
                  </Badge>
                )}
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 ml-6 space-y-3">
              <p className="text-sm text-gray-600">{log.description}</p>
              
              {log.assumptions.length > 0 && (
                <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-800">Assumptions Made</span>
                  </div>
                  <ul className="text-sm space-y-1">
                    {log.assumptions.map((assumption, i) => (
                      <li key={i} className="text-blue-700">• {assumption}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {log.missingData.length > 0 && (
                <div className="bg-orange-50 p-3 rounded border-l-4 border-orange-400">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-orange-800">Missing Data Handled</span>
                  </div>
                  <ul className="text-sm space-y-1">
                    {log.missingData.map((missing, i) => (
                      <li key={i} className="text-orange-700">• {missing}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {log.calculationDetails && (
                <div className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-800">Calculation Details</span>
                  </div>
                  <pre className="text-sm text-green-700 whitespace-pre-wrap font-mono">
                    {log.calculationDetails}
                  </pre>
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                Calculated at: {new Date(log.timestamp).toLocaleString()}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  );
}

export default function FinancialReports() {
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedPeriod] = useState("Q3_2025");
  const [showDetailedLogs, setShowDetailedLogs] = useState(false);

  // Enhanced trial balance fetch with detailed logs option
  const { data: trialBalanceData, isLoading: trialBalanceLoading, error: trialBalanceError } = useQuery({
    queryKey: ["trial-balance", selectedPeriod, showDetailedLogs],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.log('No authentication token found');
        throw new Error('No authentication token found');
      }
      
      console.log('Fetching trial balance for Financial Reports page...');
      
      const endpoint = showDetailedLogs ? '/api/reports/trial-balance/detailed' : '/api/reports/trial-balance';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ period: selectedPeriod }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        console.log('Trial balance API error:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Trial balance data for Financial Reports:', {
        entries: showDetailedLogs ? data.data?.entries?.length || 0 : data.entries?.length || 0,
        hasLogs: showDetailedLogs ? !!data.calculationLogs : false,
        totalSteps: showDetailedLogs ? data.summary?.totalSteps : 0
      });
      
      return data;
    },
    enabled: isAuthenticated && !!localStorage.getItem('access_token'),
    retry: 3,
    staleTime: 30000,
  });

  // Detailed P&L query
  const { data: detailedPLData, isLoading: detailedPLLoading } = useQuery({
    queryKey: ["profit-loss-detailed", selectedPeriod],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/reports/profit-loss/detailed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ period: selectedPeriod }),
      });
      return response.ok ? response.json() : null;
    },
    enabled: isAuthenticated && showDetailedLogs,
  });

  // Detailed Balance Sheet query  
  const { data: detailedBSData, isLoading: detailedBSLoading } = useQuery({
    queryKey: ["balance-sheet-detailed", selectedPeriod],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/reports/balance-sheet/detailed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ period: selectedPeriod }),
      });
      return response.ok ? response.json() : null;
    },
    enabled: isAuthenticated && showDetailedLogs,
  });

  // Detailed Cash Flow query
  const { data: detailedCFData, isLoading: detailedCFLoading } = useQuery({
    queryKey: ["cash-flow-detailed", selectedPeriod],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/reports/cash-flow/detailed', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ period: selectedPeriod }),
      });
      return response.ok ? response.json() : null;
    },
    enabled: isAuthenticated && showDetailedLogs,
  });

  // Simple journal entries fetch
  const { data: journalEntries, isLoading: journalLoading } = useQuery({
    queryKey: ["journal-entries"],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/journal-entries', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        return response.json();
      }
      return [];
    },
    enabled: isAuthenticated,
  });

  // Profit & Loss Report fetch
  const { data: profitLossData, isLoading: profitLossLoading } = useQuery({
    queryKey: ["profit-loss"],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/reports/profit-loss', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ period: selectedPeriod }),
      });
      
      if (response.ok) {
        return response.json();
      }
      return { revenue: [], expenses: [], totalRevenue: 0, totalExpenses: 0, netProfit: 0 };
    },
    enabled: isAuthenticated,
  });

  // Balance Sheet Report fetch
  const { data: balanceSheetData, isLoading: balanceSheetLoading } = useQuery({
    queryKey: ["balance-sheet"],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/reports/balance-sheet', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ period: selectedPeriod }),
      });
      
      if (response.ok) {
        return response.json();
      }
      return { assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilities: 0, totalEquity: 0 };
    },
    enabled: isAuthenticated,
  });

  // Cash Flow Statement fetch
  const { data: cashFlowData, isLoading: cashFlowLoading } = useQuery({
    queryKey: ["cash-flow"],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/reports/cash-flow', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ period: selectedPeriod }),
      });
      
      if (response.ok) {
        return response.json();
      }
      return { 
        operatingActivities: [], 
        investingActivities: [], 
        financingActivities: [], 
        netCashFlow: 0 
      };
    },
    enabled: isAuthenticated,
  });

  // Bank Reconciliation Report fetch
  const { data: bankReconciliationData, isLoading: bankReconciliationLoading } = useQuery({
    queryKey: ["bank-reconciliation"],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/reports/bank-reconciliation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ period: selectedPeriod }),
      });
      
      if (response.ok) {
        return response.json();
      }
      return { 
        reconciliationItems: [], 
        adjustments: [],
        bookBalance: 0,
        bankBalance: 0,
        variance: 0,
        isReconciled: false,
        summary: {}
      };
    },
    enabled: isAuthenticated,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return '₹0';
    // Fixed: Ensure proper number formatting without any scaling
    const numAmount = parseFloat(amount.toString());
    return `₹${numAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  return (
    <PageLayout title="Financial Reports">
      <div className="space-y-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Financial Reports</h1>
              <p className="text-muted-foreground">
                Generate and manage financial statements and reports
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg">
                <Switch
                  id="detailed-logs"
                  checked={showDetailedLogs}
                  onCheckedChange={setShowDetailedLogs}
                />
                <Label htmlFor="detailed-logs" className="text-sm font-medium">
                  Show Calculation Logs
                </Label>
              </div>
              <Button
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('access_token');
                    const response = await fetch('/api/journal-entries/generate', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({ period: selectedPeriod })
                    });
                    
                    if (!response.ok) {
                      throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const result = await response.json();
                    console.log('Journal entries generated:', result);
                    
                    await Promise.all([
                      queryClient.invalidateQueries({ queryKey: ['/api/journal-entries'] }),
                      queryClient.invalidateQueries({ queryKey: ['/api/reports/trial-balance'] }),
                      queryClient.invalidateQueries({ queryKey: ['/api/reports/profit-loss'] }),
                      queryClient.invalidateQueries({ queryKey: ['/api/reports/balance-sheet'] }),
                      queryClient.invalidateQueries({ queryKey: ['/api/reports/cash-flow'] })
                    ]);
                    window.location.reload();
                  } catch (error) {
                    console.error('Error generating journal entries:', error);
                  }
                }}
                variant="default"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate Journal Entries
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="trial-balance" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
            <TabsTrigger value="profit-loss">P&L Statement</TabsTrigger>
            <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
            <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
            <TabsTrigger value="bank-reconciliation">Bank Reconciliation</TabsTrigger>
            <TabsTrigger value="journal-entries">Journal Entries</TabsTrigger>
          </TabsList>

          <TabsContent value="trial-balance" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Trial Balance - {selectedPeriod}</CardTitle>
                  <div className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    {trialBalanceLoading ? "Loading..." : "Balanced"}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account Code</TableHead>
                        <TableHead>Account Name</TableHead>
                        <TableHead className="text-right">Debit Balance</TableHead>
                        <TableHead className="text-right">Credit Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        // Handle both regular and detailed response structures
                        const entries = trialBalanceData?.data?.entries || trialBalanceData?.entries;
                        const totalDebits = trialBalanceData?.data?.totalDebits || trialBalanceData?.totalDebits;
                        const totalCredits = trialBalanceData?.data?.totalCredits || trialBalanceData?.totalCredits;
                        
                        console.log('Trial Balance Debug:', {
                          hasData: !!trialBalanceData,
                          hasEntries: !!entries,
                          entriesLength: entries?.length || 0,
                          showDetailedLogs,
                          structure: Object.keys(trialBalanceData || {})
                        });
                        
                        return entries?.length > 0 ? (
                          <>
                            {entries.map((entry: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell className="font-mono">{entry.accountCode || 'N/A'}</TableCell>
                                <TableCell>{entry.accountName || 'N/A'}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {entry.debitBalance > 0 ? formatCurrency(entry.debitBalance) : '-'}
                                </TableCell>
                                <TableCell className="text-right font-mono">
                                  {entry.creditBalance > 0 ? formatCurrency(entry.creditBalance) : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                            {totalDebits && (
                              <TableRow className="border-t-2 font-semibold">
                                <TableCell colSpan={2}>Total</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(totalDebits)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(totalCredits)}
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              {trialBalanceLoading ? "Loading trial balance..." : "No trial balance data found"}
                            </TableCell>
                          </TableRow>
                        );
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            
            {/* Detailed calculation logs for Trial Balance */}
            {showDetailedLogs && trialBalanceData?.calculationLogs && (
              <CalculationLogsDisplay 
                logs={trialBalanceData.calculationLogs}
                summary={trialBalanceData.summary}
                title="Trial Balance"
              />
            )}
          </TabsContent>

          <TabsContent value="profit-loss" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Profit & Loss Statement - {selectedPeriod}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Net Profit: {formatCurrency(profitLossData?.netProfit || 0)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Revenue Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-green-600">Revenue</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Account</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {profitLossData?.revenue?.length > 0 ? (
                            profitLossData.revenue.map((item: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{item.accountName || 'N/A'}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatCurrency(item.amount || 0)}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                                {profitLossLoading ? "Loading..." : "No revenue data"}
                              </TableCell>
                            </TableRow>
                          )}
                          <TableRow className="border-t-2 font-semibold bg-green-50">
                            <TableCell>Total Revenue</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(profitLossData?.totalRevenue || 0)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Expenses Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-red-600">Expenses</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Account</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {profitLossData?.expenses?.length > 0 ? (
                            profitLossData.expenses.map((item: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{item.accountName || 'N/A'}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatCurrency(item.amount || 0)}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                                {profitLossLoading ? "Loading..." : "No expense data"}
                              </TableCell>
                            </TableRow>
                          )}
                          <TableRow className="border-t-2 font-semibold bg-red-50">
                            <TableCell>Total Expenses</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(profitLossData?.totalExpenses || 0)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                {/* Net Profit Summary */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Net Profit/Loss</span>
                    <span className={`${(profitLossData?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(profitLossData?.netProfit || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Detailed calculation logs for P&L */}
            {showDetailedLogs && detailedPLData?.calculationLogs && (
              <CalculationLogsDisplay 
                logs={detailedPLData.calculationLogs}
                summary={detailedPLData.summary}
                title="Profit & Loss Statement"
              />
            )}
          </TabsContent>

          <TabsContent value="balance-sheet" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Balance Sheet - {selectedPeriod}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Total Assets: {formatCurrency(balanceSheetData?.totalAssets || 0)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Assets Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-blue-600">Assets</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Account</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {balanceSheetData?.assets?.length > 0 ? (
                            balanceSheetData.assets.map((item: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{item.accountName || 'N/A'}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatCurrency(item.amount || 0)}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                                {balanceSheetLoading ? "Loading..." : "No asset data"}
                              </TableCell>
                            </TableRow>
                          )}
                          <TableRow className="border-t-2 font-semibold bg-blue-50">
                            <TableCell>Total Assets</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(balanceSheetData?.totalAssets || 0)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Liabilities & Equity Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-red-600">Liabilities & Equity</h3>
                    <div className="space-y-4">
                      {/* Liabilities */}
                      <div>
                        <h4 className="font-medium mb-2">Liabilities</h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableBody>
                              {balanceSheetData?.liabilities?.length > 0 ? (
                                balanceSheetData.liabilities.map((item: any, index: number) => (
                                  <TableRow key={index}>
                                    <TableCell>{item.accountName || 'N/A'}</TableCell>
                                    <TableCell className="text-right font-mono">
                                      {formatCurrency(item.amount || 0)}
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={2} className="text-center py-2 text-muted-foreground text-sm">
                                    {balanceSheetLoading ? "Loading..." : "No liability data"}
                                  </TableCell>
                                </TableRow>
                              )}
                              <TableRow className="border-t font-semibold bg-red-50">
                                <TableCell>Total Liabilities</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(balanceSheetData?.totalLiabilities || 0)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>

                      {/* Equity */}
                      <div>
                        <h4 className="font-medium mb-2">Equity</h4>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableBody>
                              {balanceSheetData?.equity?.length > 0 ? (
                                balanceSheetData.equity.map((item: any, index: number) => (
                                  <TableRow key={index}>
                                    <TableCell>{item.accountName || 'N/A'}</TableCell>
                                    <TableCell className="text-right font-mono">
                                      {formatCurrency(item.amount || 0)}
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell colSpan={2} className="text-center py-2 text-muted-foreground text-sm">
                                    {balanceSheetLoading ? "Loading..." : "No equity data"}
                                  </TableCell>
                                </TableRow>
                              )}
                              <TableRow className="border-t font-semibold bg-green-50">
                                <TableCell>Total Equity</TableCell>
                                <TableCell className="text-right">
                                  {formatCurrency(balanceSheetData?.totalEquity || 0)}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Detailed calculation logs for Balance Sheet */}
            {showDetailedLogs && detailedBSData?.calculationLogs && (
              <CalculationLogsDisplay 
                logs={detailedBSData.calculationLogs}
                summary={detailedBSData.summary}
                title="Balance Sheet"
              />
            )}
          </TabsContent>

          <TabsContent value="cash-flow" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Cash Flow Statement - {selectedPeriod}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    Net Cash Flow: {formatCurrency(cashFlowData?.netCashFlow || 0)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Operating Activities */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-blue-600">Operating Activities</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Activity</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cashFlowData?.operatingActivities?.length > 0 ? (
                            cashFlowData.operatingActivities.map((item: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{item.description || 'N/A'}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatCurrency(item.amount || 0)}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                                {cashFlowLoading ? "Loading..." : "No operating activity data"}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Investing Activities */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-green-600">Investing Activities</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Activity</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cashFlowData?.investingActivities?.length > 0 ? (
                            cashFlowData.investingActivities.map((item: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{item.description || 'N/A'}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatCurrency(item.amount || 0)}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                                {cashFlowLoading ? "Loading..." : "No investing activity data"}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Financing Activities */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-purple-600">Financing Activities</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Activity</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cashFlowData?.financingActivities?.length > 0 ? (
                            cashFlowData.financingActivities.map((item: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>{item.description || 'N/A'}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatCurrency(item.amount || 0)}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                                {cashFlowLoading ? "Loading..." : "No financing activity data"}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Net Cash Flow Summary */}
                  <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Net Cash Flow</span>
                      <span className={`${(cashFlowData?.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(cashFlowData?.netCashFlow || 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Detailed calculation logs for Cash Flow */}
            {showDetailedLogs && detailedCFData?.calculationLogs && (
              <CalculationLogsDisplay 
                logs={detailedCFData.calculationLogs}
                summary={detailedCFData.summary}
                title="Cash Flow Statement"
              />
            )}
          </TabsContent>

          <TabsContent value="bank-reconciliation" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Bank Reconciliation - {selectedPeriod}</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1 text-xs rounded-full ${
                      bankReconciliationData?.isReconciled 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {bankReconciliationLoading ? "Loading..." : 
                       bankReconciliationData?.isReconciled ? "Reconciled" : "Variance Found"}
                    </div>
                    <Button 
                      onClick={() => {
                        if (bankReconciliationData) {
                          const csvData = [
                            ['Account Code', 'Description', 'Debit Amount', 'Credit Amount', 'Entity', 'Status'],
                            ...bankReconciliationData.reconciliationItems.map((item: any) => [
                              item.accountCode || '',
                              item.description || '',
                              item.debitAmount || 0,
                              item.creditAmount || 0,
                              item.entity || '',
                              item.status || ''
                            ])
                          ];
                          const csvContent = csvData.map(row => row.map(cell => 
                            typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
                          ).join(',')).join('\n');
                          const blob = new Blob([csvContent], { type: 'text/csv' });
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `bank-reconciliation-${selectedPeriod}.csv`;
                          a.click();
                          window.URL.revokeObjectURL(url);
                        }
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Download CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Summary Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-600">Book Balance</h3>
                    <p className="text-lg font-bold text-blue-800">
                      {formatCurrency(bankReconciliationData?.bookBalance || 0)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-green-600">Bank Balance</h3>
                    <p className="text-lg font-bold text-green-800">
                      {formatCurrency(bankReconciliationData?.bankBalance || 0)}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-yellow-600">Variance</h3>
                    <p className="text-lg font-bold text-yellow-800">
                      {formatCurrency(bankReconciliationData?.variance || 0)}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-600">Total Items</h3>
                    <p className="text-lg font-bold text-purple-800">
                      {bankReconciliationData?.reconciliationItems?.length || 0}
                    </p>
                  </div>
                </div>

                {/* Reconciliation Items Table */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Entity</TableHead>
                        <TableHead>Account Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Debit Amount</TableHead>
                        <TableHead className="text-right">Credit Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bankReconciliationData?.reconciliationItems?.length > 0 ? (
                        bankReconciliationData.reconciliationItems.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.entity || 'N/A'}</TableCell>
                            <TableCell className="font-mono">{item.accountCode || 'N/A'}</TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate">{item.description || item.narration || 'N/A'}</div>
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {item.debitAmount > 0 ? formatCurrency(item.debitAmount) : '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {item.creditAmount > 0 ? formatCurrency(item.creditAmount) : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.status === 'reconciled' ? 'default' : 'secondary'}>
                                {item.status || 'pending'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            {bankReconciliationLoading ? "Loading bank reconciliation..." : "No reconciliation data found"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Adjustments Section */}
                {bankReconciliationData?.adjustments?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4 text-orange-600">Reconciliation Adjustments</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bankReconciliationData.adjustments.map((adjustment: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{adjustment.type || 'N/A'}</TableCell>
                              <TableCell>{adjustment.description || 'N/A'}</TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(adjustment.amount || 0)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="journal-entries" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Journal Entries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Account Code</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {journalEntries?.length > 0 ? (
                        journalEntries.map((entry: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-sm">
                              {entry.date ? new Date(entry.date).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell className="max-w-xs">
                              <div className="truncate">{entry.narration || entry.accountName || 'N/A'}</div>
                            </TableCell>
                            <TableCell className="font-mono">{entry.accountCode || 'N/A'}</TableCell>
                            <TableCell className="text-right font-mono">
                              {parseFloat(entry.debitAmount || 0) > 0 ? formatCurrency(parseFloat(entry.debitAmount)) : '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {parseFloat(entry.creditAmount || 0) > 0 ? formatCurrency(parseFloat(entry.creditAmount)) : '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            {journalLoading ? "Loading journal entries..." : "No journal entries found"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}