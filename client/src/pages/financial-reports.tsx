import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, RefreshCw, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import type { FinancialStatement } from "@shared/schema";

export default function FinancialReports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState("Q3_2025");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: statements, isLoading: statementsLoading } = useQuery<FinancialStatement[]>({
    queryKey: ["/api/financial-statements", selectedPeriod],
    retry: false,
  });

  const generateReportMutation = useMutation({
    mutationFn: async (reportType: string) => {
      const response = await apiRequest('POST', `/api/reports/${reportType}`, {
        period: selectedPeriod,
      });
      return response.json();
    },
    onSuccess: (data, reportType) => {
      toast({
        title: "Report Generated",
        description: `${reportType} report generated successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/financial-statements"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate report",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatementTitle = (type: string) => {
    switch (type) {
      case 'trial_balance': return 'Trial Balance';
      case 'profit_loss': return 'Profit & Loss Statement';
      case 'balance_sheet': return 'Balance Sheet';
      case 'cash_flow': return 'Cash Flow Statement';
      default: return type;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const mockTrialBalance = {
    entries: [
      { accountCode: "1000", accountName: "Cash in Hand", debitBalance: 50000, creditBalance: 0 },
      { accountCode: "1001", accountName: "Bank Account", debitBalance: 500000, creditBalance: 0 },
      { accountCode: "1200", accountName: "Accounts Receivable", debitBalance: 200000, creditBalance: 0 },
      { accountCode: "2000", accountName: "Accounts Payable", debitBalance: 0, creditBalance: 150000 },
      { accountCode: "3000", accountName: "Capital Account", debitBalance: 0, creditBalance: 600000 },
    ],
    totalDebits: 750000,
    totalCredits: 750000,
    isBalanced: true,
  };

  const mockProfitLoss = {
    revenue: [
      { accountCode: "4000", accountName: "Sales Revenue", amount: 1000000, type: "revenue" },
      { accountCode: "4100", accountName: "Service Revenue", amount: 200000, type: "revenue" },
    ],
    expenses: [
      { accountCode: "6000", accountName: "Cost of Goods Sold", amount: 600000, type: "expense" },
      { accountCode: "6100", accountName: "Operating Expenses", amount: 150000, type: "expense" },
    ],
    totalRevenue: 1200000,
    totalExpenses: 750000,
    netProfit: 450000,
  };

  const mockBalanceSheet = {
    assets: [
      { accountCode: "1000", accountName: "Current Assets", amount: 800000, type: "asset", subType: "current" },
      { accountCode: "1500", accountName: "Fixed Assets", amount: 500000, type: "asset", subType: "fixed" },
    ],
    liabilities: [
      { accountCode: "2000", accountName: "Current Liabilities", amount: 200000, type: "liability", subType: "current" },
      { accountCode: "2500", accountName: "Long-term Liabilities", amount: 300000, type: "liability", subType: "long_term" },
    ],
    equity: [
      { accountCode: "3000", accountName: "Share Capital", amount: 500000, type: "equity", subType: "capital" },
      { accountCode: "3100", accountName: "Retained Earnings", amount: 300000, type: "equity", subType: "retained" },
    ],
    totalAssets: 1300000,
    totalLiabilities: 500000,
    totalEquity: 800000,
    isBalanced: true,
  };

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <TopBar />
        
        <div className="p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Financial Reports</h1>
                <p className="text-muted-foreground">
                  Generate and manage financial statements and reports
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Q1_2025">Q1 2025</SelectItem>
                    <SelectItem value="Q2_2025">Q2 2025</SelectItem>
                    <SelectItem value="Q3_2025">Q3 2025</SelectItem>
                    <SelectItem value="Q4_2025">Q4 2025</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/financial-statements"] })}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
              <TabsTrigger value="profit-loss">P&L Statement</TabsTrigger>
              <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Trial Balance</CardTitle>
                      <TrendingUp className="h-5 w-5 text-secondary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Debits</span>
                        <span className="font-semibold">{formatCurrency(mockTrialBalance.totalDebits)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Credits</span>
                        <span className="font-semibold">{formatCurrency(mockTrialBalance.totalCredits)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm font-medium">Balance</span>
                        <span className="font-semibold text-secondary">
                          {formatCurrency(mockTrialBalance.totalDebits - mockTrialBalance.totalCredits)}
                        </span>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4" 
                      onClick={() => generateReportMutation.mutate('trial-balance')}
                      disabled={generateReportMutation.isPending}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Profit & Loss</CardTitle>
                      <BarChart3 className="h-5 w-5 text-accent" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Revenue</span>
                        <span className="font-semibold">{formatCurrency(mockProfitLoss.totalRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Expenses</span>
                        <span className="font-semibold">{formatCurrency(mockProfitLoss.totalExpenses)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm font-medium">Net Profit</span>
                        <span className="font-semibold text-secondary">
                          {formatCurrency(mockProfitLoss.netProfit)}
                        </span>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4"
                      onClick={() => generateReportMutation.mutate('profit-loss')}
                      disabled={generateReportMutation.isPending}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Balance Sheet</CardTitle>
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Assets</span>
                        <span className="font-semibold">{formatCurrency(mockBalanceSheet.totalAssets)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Liabilities</span>
                        <span className="font-semibold">{formatCurrency(mockBalanceSheet.totalLiabilities)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm font-medium">Total Equity</span>
                        <span className="font-semibold text-secondary">
                          {formatCurrency(mockBalanceSheet.totalEquity)}
                        </span>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4"
                      onClick={() => generateReportMutation.mutate('balance-sheet')}
                      disabled={generateReportMutation.isPending}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trial-balance" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Trial Balance - {selectedPeriod}</CardTitle>
                    <Badge className={mockTrialBalance.isBalanced ? "badge-compliant" : "badge-non-compliant"}>
                      {mockTrialBalance.isBalanced ? "Balanced" : "Unbalanced"}
                    </Badge>
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
                        {mockTrialBalance.entries.map((entry) => (
                          <TableRow key={entry.accountCode}>
                            <TableCell className="font-mono">{entry.accountCode}</TableCell>
                            <TableCell>{entry.accountName}</TableCell>
                            <TableCell className="text-right font-mono">
                              {entry.debitBalance > 0 ? formatCurrency(entry.debitBalance) : '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {entry.creditBalance > 0 ? formatCurrency(entry.creditBalance) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="border-t-2 font-semibold">
                          <TableCell colSpan={2}>Total</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(mockTrialBalance.totalDebits)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(mockTrialBalance.totalCredits)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profit-loss" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profit & Loss Statement - {selectedPeriod}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Revenue</h3>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Account Code</TableHead>
                              <TableHead>Account Name</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mockProfitLoss.revenue.map((item) => (
                              <TableRow key={item.accountCode}>
                                <TableCell className="font-mono">{item.accountCode}</TableCell>
                                <TableCell>{item.accountName}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatCurrency(item.amount)}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="border-t font-semibold">
                              <TableCell colSpan={2}>Total Revenue</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(mockProfitLoss.totalRevenue)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Expenses</h3>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Account Code</TableHead>
                              <TableHead>Account Name</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mockProfitLoss.expenses.map((item) => (
                              <TableRow key={item.accountCode}>
                                <TableCell className="font-mono">{item.accountCode}</TableCell>
                                <TableCell>{item.accountName}</TableCell>
                                <TableCell className="text-right font-mono">
                                  {formatCurrency(item.amount)}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="border-t font-semibold">
                              <TableCell colSpan={2}>Total Expenses</TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(mockProfitLoss.totalExpenses)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <div className="border-t-2 pt-4">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Net Profit</span>
                        <span className="text-secondary">
                          {formatCurrency(mockProfitLoss.netProfit)}
                        </span>
                      </div>
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
                    <Badge className={mockBalanceSheet.isBalanced ? "badge-compliant" : "badge-non-compliant"}>
                      {mockBalanceSheet.isBalanced ? "Balanced" : "Unbalanced"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Assets</h3>
                      <div className="space-y-3">
                        {mockBalanceSheet.assets.map((asset) => (
                          <div key={asset.accountCode} className="flex justify-between py-2 border-b">
                            <div>
                              <p className="font-medium">{asset.accountName}</p>
                              <p className="text-xs text-muted-foreground">{asset.accountCode}</p>
                            </div>
                            <p className="font-mono">{formatCurrency(asset.amount)}</p>
                          </div>
                        ))}
                        <div className="flex justify-between py-2 border-t-2 font-semibold">
                          <span>Total Assets</span>
                          <span>{formatCurrency(mockBalanceSheet.totalAssets)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-3">Liabilities & Equity</h3>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-muted-foreground mb-2">Liabilities</h4>
                          {mockBalanceSheet.liabilities.map((liability) => (
                            <div key={liability.accountCode} className="flex justify-between py-2 border-b">
                              <div>
                                <p className="font-medium">{liability.accountName}</p>
                                <p className="text-xs text-muted-foreground">{liability.accountCode}</p>
                              </div>
                              <p className="font-mono">{formatCurrency(liability.amount)}</p>
                            </div>
                          ))}
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-muted-foreground mb-2">Equity</h4>
                          {mockBalanceSheet.equity.map((equity) => (
                            <div key={equity.accountCode} className="flex justify-between py-2 border-b">
                              <div>
                                <p className="font-medium">{equity.accountName}</p>
                                <p className="text-xs text-muted-foreground">{equity.accountCode}</p>
                              </div>
                              <p className="font-mono">{formatCurrency(equity.amount)}</p>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-between py-2 border-t-2 font-semibold">
                          <span>Total Liabilities & Equity</span>
                          <span>{formatCurrency(mockBalanceSheet.totalLiabilities + mockBalanceSheet.totalEquity)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
