import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Download, RefreshCw, TrendingUp, Calendar, BarChart3, Trash2, AlertCircle, Grid, List } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { FinancialStatement } from "@shared/schema";

// Safe data access helpers
const safeNumber = (value: any): number => {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string' && !isNaN(parseFloat(value))) return parseFloat(value);
  return 0;
};

const safeString = (value: any): string => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
};

const safeBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
};

const safeArray = (value: any): any[] => {
  return Array.isArray(value) ? value : [];
};

export default function FinancialReports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPeriod, setSelectedPeriod] = useState("Q3_2025");
  const [displayFormat, setDisplayFormat] = useState<'detailed' | 'compact'>('detailed');
  const [viewReportModal, setViewReportModal] = useState<{
    isOpen: boolean;
    statement: FinancialStatement | null;
  }>({
    isOpen: false,
    statement: null,
  });

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

  // Safe API calls with error handling
  const { data: statements, isLoading: statementsLoading } = useQuery<FinancialStatement[]>({
    queryKey: ["/api/financial-statements", selectedPeriod],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await fetch(`/api/financial-statements?period=${selectedPeriod}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching statements:', error);
        return [];
      }
    },
    retry: false,
  });

  const { data: journalEntries, isLoading: journalEntriesLoading, refetch: refetchJournalEntries } = useQuery({
    queryKey: ["/api/journal-entries"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await fetch(`/api/journal-entries`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching journal entries:', error);
        return [];
      }
    },
    retry: false,
  });

  // Safe trial balance data fetching
  const { data: trialBalanceData, isLoading: trialBalanceLoading } = useQuery({
    queryKey: ["/api/reports/trial-balance", selectedPeriod],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await fetch(`/api/reports/trial-balance`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ period: selectedPeriod }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching trial balance:', error);
        return { entries: [], totalDebits: 0, totalCredits: 0, isBalanced: false };
      }
    },
    retry: false,
  });

  // Safe P&L data fetching
  const { data: plData, isLoading: plLoading } = useQuery({
    queryKey: ["/api/reports/profit-loss", selectedPeriod],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await fetch(`/api/reports/profit-loss`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ period: selectedPeriod }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching P&L:', error);
        return { revenue: [], expenses: [], totalRevenue: 0, totalExpenses: 0, netProfit: 0 };
      }
    },
    retry: false,
  });

  // Safe Balance Sheet data fetching
  const { data: balanceSheetData, isLoading: balanceSheetLoading } = useQuery({
    queryKey: ["/api/reports/balance-sheet", selectedPeriod],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await fetch(`/api/reports/balance-sheet`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ period: selectedPeriod }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error fetching balance sheet:', error);
        return { assets: [], liabilities: [], equity: [], totalAssets: 0, totalLiabilities: 0, totalEquity: 0 };
      }
    },
    retry: false,
  });

  // Safe mutations with error handling
  const generateJournalEntriesMutation = useMutation({
    mutationFn: async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await fetch('/api/reports/generate-journal-entries', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error generating journal entries:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Journal entries generated successfully",
      });
      refetchJournalEntries();
      queryClient.invalidateQueries({ queryKey: ["/api/reports/trial-balance"] });
    },
    onError: (error: any) => {
      console.error('Journal entries generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate journal entries",
        variant: "destructive",
      });
    },
  });

  const deleteJournalEntryMutation = useMutation({
    mutationFn: async (journalEntryId: string) => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        const response = await fetch(`/api/journal-entries/${journalEntryId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error('Error deleting journal entry:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Journal entry deleted successfully",
      });
      refetchJournalEntries();
      queryClient.invalidateQueries({ queryKey: ["/api/reports/trial-balance"] });
    },
    onError: (error: any) => {
      console.error('Journal entry deletion error:', error);
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete journal entry",
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
      default: return safeString(type);
    }
  };

  const formatCurrency = (amount: any) => {
    try {
      const num = safeNumber(amount);
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(num);
    } catch (error) {
      console.error('Currency formatting error:', error);
      return '₹0';
    }
  };

  const formatCurrencyCompact = (amount: any) => {
    try {
      const num = safeNumber(amount);
      return new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 0,
      }).format(num);
    } catch (error) {
      console.error('Currency compact formatting error:', error);
      return '0';
    }
  };

  // Safe data extraction with fallbacks
  const safeTrialBalance = {
    entries: safeArray(trialBalanceData?.entries),
    totalDebits: safeNumber(trialBalanceData?.totalDebits),
    totalCredits: safeNumber(trialBalanceData?.totalCredits),
    isBalanced: safeBoolean(trialBalanceData?.isBalanced),
  };

  const safePLData = {
    revenue: safeArray(plData?.revenue),
    expenses: safeArray(plData?.expenses),
    totalRevenue: safeNumber(plData?.totalRevenue),
    totalExpenses: safeNumber(plData?.totalExpenses),
    netProfit: safeNumber(plData?.netProfit),
  };

  const safeBalanceSheet = {
    assets: safeArray(balanceSheetData?.assets),
    liabilities: safeArray(balanceSheetData?.liabilities),
    equity: safeArray(balanceSheetData?.equity),
    totalAssets: safeNumber(balanceSheetData?.totalAssets),
    totalLiabilities: safeNumber(balanceSheetData?.totalLiabilities),
    totalEquity: safeNumber(balanceSheetData?.totalEquity),
  };

  const safeJournalEntries = safeArray(journalEntries);
  const safeStatements = safeArray(statements);

  // Render compact P&L format
  const renderCompactPLFormat = (plData: any) => {
    const allAccounts = [
      ...safeArray(plData?.revenue).map((item: any) => ({
        ...item,
        section: 'Revenue',
        isTotal: false,
        accountCode: safeString(item?.accountCode),
        accountName: safeString(item?.accountName),
        amount: safeNumber(item?.amount),
      })),
      {
        accountCode: '',
        accountName: 'Total Revenue',
        amount: safeNumber(plData?.totalRevenue),
        section: 'Revenue',
        isTotal: true
      },
      ...safeArray(plData?.expenses).map((item: any) => ({
        ...item,
        section: 'Expenses',
        isTotal: false,
        accountCode: safeString(item?.accountCode),
        accountName: safeString(item?.accountName),
        amount: safeNumber(item?.amount),
      })),
      {
        accountCode: '',
        accountName: 'Total Expenses',
        amount: safeNumber(plData?.totalExpenses),
        section: 'Expenses',
        isTotal: true
      },
      {
        accountCode: '',
        accountName: 'Net Profit',
        amount: safeNumber(plData?.netProfit),
        section: 'Net Result',
        isTotal: true
      }
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Profit & Loss Summary</h4>
          <div className="flex items-center space-x-2">
            <Button
              variant={displayFormat === 'detailed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDisplayFormat('detailed')}
            >
              <List className="w-4 h-4 mr-1" />
              Detailed
            </Button>
            <Button
              variant={displayFormat === 'compact' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDisplayFormat('compact')}
            >
              <Grid className="w-4 h-4 mr-1" />
              Compact
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allAccounts.map((account, index) => (
                <TableRow key={`${account.accountCode}-${index}`} className={account.isTotal ? 'border-t-2 bg-muted/50' : ''}>
                  <TableCell className={account.isTotal ? 'font-semibold' : ''}>
                    {account.accountCode && (
                      <span className="font-mono text-sm text-muted-foreground mr-2">
                        {account.accountCode}
                      </span>
                    )}
                    {account.accountName}
                  </TableCell>
                  <TableCell className={`text-right font-mono ${account.isTotal ? 'font-semibold' : ''} ${
                    account.section === 'Net Result' 
                      ? account.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      : ''
                  }`}>
                    {formatCurrencyCompact(account.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
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
                  onClick={() => generateJournalEntriesMutation.mutate()}
                  disabled={generateJournalEntriesMutation.isPending}
                  variant="default"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {generateJournalEntriesMutation.isPending ? "Generating..." : "Generate Journal Entries"}
                </Button>
              </div>
            </div>
          </div>

        <Tabs defaultValue="trial-balance" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
            <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
            <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
            <TabsTrigger value="journal-entries">Journal Entries</TabsTrigger>
          </TabsList>

          <TabsContent value="trial-balance" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Trial Balance - {selectedPeriod}</CardTitle>
                  <Badge variant={trialBalanceLoading ? "outline" : (safeTrialBalance.isBalanced ? "default" : "destructive")}>
                    {trialBalanceLoading ? "Loading..." : (safeTrialBalance.isBalanced ? "Balanced" : "Unbalanced")}
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
                      {safeTrialBalance.entries.length > 0 ? (
                        safeTrialBalance.entries.map((entry, index) => (
                          <TableRow key={`${safeString(entry?.accountCode)}-${index}`}>
                            <TableCell className="font-mono">{safeString(entry?.accountCode)}</TableCell>
                            <TableCell>{safeString(entry?.accountName)}</TableCell>
                            <TableCell className="text-right font-mono">
                              {safeNumber(entry?.debitBalance) > 0 ? formatCurrency(entry?.debitBalance) : '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {safeNumber(entry?.creditBalance) > 0 ? formatCurrency(entry?.creditBalance) : '-'}
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
                      <TableRow className="border-t-2 font-semibold">
                        <TableCell colSpan={2}>Total</TableCell>
                        <TableCell className="text-right">
                          {trialBalanceLoading ? "Loading..." : formatCurrency(safeTrialBalance.totalDebits)}
                        </TableCell>
                        <TableCell className="text-right">
                          {trialBalanceLoading ? "Loading..." : formatCurrency(safeTrialBalance.totalCredits)}
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
                {plLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  renderCompactPLFormat(plData)
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance-sheet" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Balance Sheet - {selectedPeriod}</CardTitle>
              </CardHeader>
              <CardContent>
                {balanceSheetLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-4">Assets</h4>
                        <div className="space-y-2">
                          {safeBalanceSheet.assets.map((asset, index) => (
                            <div key={`asset-${index}`} className="flex justify-between">
                              <span className="text-sm">{safeString(asset?.accountName)}</span>
                              <span className="text-sm font-mono">{formatCurrency(asset?.amount)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between font-semibold border-t pt-2">
                            <span>Total Assets</span>
                            <span className="font-mono">{formatCurrency(safeBalanceSheet.totalAssets)}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-4">Liabilities & Equity</h4>
                        <div className="space-y-2">
                          {safeBalanceSheet.liabilities.map((liability, index) => (
                            <div key={`liability-${index}`} className="flex justify-between">
                              <span className="text-sm">{safeString(liability?.accountName)}</span>
                              <span className="text-sm font-mono">{formatCurrency(liability?.amount)}</span>
                            </div>
                          ))}
                          {safeBalanceSheet.equity.map((equity, index) => (
                            <div key={`equity-${index}`} className="flex justify-between">
                              <span className="text-sm">{safeString(equity?.accountName)}</span>
                              <span className="text-sm font-mono">{formatCurrency(equity?.amount)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between font-semibold border-t pt-2">
                            <span>Total Liabilities & Equity</span>
                            <span className="font-mono">{formatCurrency(safeBalanceSheet.totalLiabilities + safeBalanceSheet.totalEquity)}</span>
                          </div>
                        </div>
                      </div>
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
                {journalEntriesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Account Code</TableHead>
                          <TableHead className="text-right">Debit</TableHead>
                          <TableHead className="text-right">Credit</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {safeJournalEntries.length > 0 ? (
                          safeJournalEntries.map((entry, index) => (
                            <TableRow key={`journal-${index}`}>
                              <TableCell className="font-mono text-sm">
                                {entry?.date ? new Date(entry.date).toLocaleDateString() : 'N/A'}
                              </TableCell>
                              <TableCell className="max-w-xs">
                                <div className="truncate">{safeString(entry?.description)}</div>
                              </TableCell>
                              <TableCell className="font-mono">{safeString(entry?.accountCode)}</TableCell>
                              <TableCell className="text-right font-mono">
                                {safeNumber(entry?.debitAmount) > 0 ? formatCurrency(entry?.debitAmount) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {safeNumber(entry?.creditAmount) > 0 ? formatCurrency(entry?.creditAmount) : '-'}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (entry?.id) {
                                      deleteJournalEntryMutation.mutate(entry.id);
                                    }
                                  }}
                                  disabled={deleteJournalEntryMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No journal entries found
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}