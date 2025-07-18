import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function FinancialReports() {
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedPeriod] = useState("Q3_2025");

  // Simple trial balance fetch with minimal error handling
  const { data: trialBalanceData, isLoading: trialBalanceLoading } = useQuery({
    queryKey: ["trial-balance"],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/reports/trial-balance', {
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
      return { entries: [], totalDebits: 0, totalCredits: 0, isBalanced: false };
    },
    enabled: isAuthenticated,
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

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    if (typeof amount !== 'number') return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
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
              <Button
                onClick={async () => {
                  try {
                    await apiRequest('/api/journal-entries/generate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ period: selectedPeriod })
                    });
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
            <TabsTrigger value="profit-loss">P&L Statement</TabsTrigger>
            <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
            <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
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
                      {trialBalanceData?.entries?.length > 0 ? (
                        trialBalanceData.entries.map((entry: any, index: number) => (
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
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            {trialBalanceLoading ? "Loading trial balance..." : "No trial balance data found"}
                          </TableCell>
                        </TableRow>
                      )}
                      {trialBalanceData?.totalDebits && (
                        <TableRow className="border-t-2 font-semibold">
                          <TableCell colSpan={2}>Total</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(trialBalanceData.totalDebits)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(trialBalanceData.totalCredits)}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
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