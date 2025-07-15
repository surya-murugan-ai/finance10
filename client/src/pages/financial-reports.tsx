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
import { FileText, Download, RefreshCw, TrendingUp, Calendar, BarChart3, Trash2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
    queryFn: async () => {
      const response = await apiRequest(`/api/financial-statements?period=${selectedPeriod}`, {
        method: 'GET',
      });
      return response;
    },
    retry: false,
  });

  const { data: journalEntries, isLoading: journalEntriesLoading, refetch: refetchJournalEntries } = useQuery({
    queryKey: ["/api/journal-entries"],
    queryFn: async () => {
      const response = await apiRequest(`/api/journal-entries`, {
        method: 'GET',
      });
      return response;
    },
    retry: false,
  });

  const generateReportMutation = useMutation({
    mutationFn: async (reportType: string) => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Use direct fetch to avoid apiRequest Authorization header issues
      const response = await fetch(`/api/reports/${reportType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          period: selectedPeriod,
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
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

  const deleteReportMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Use direct fetch to avoid apiRequest Authorization header issues
      const response = await fetch(`/api/financial-statements/${id}`, {
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
    },
    onSuccess: () => {
      toast({
        title: "Report Deleted",
        description: "Financial report deleted successfully",
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
        title: "Deletion Failed",
        description: error.message || "Failed to delete report",
        variant: "destructive",
      });
    },
  });

  const generateJournalEntriesMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Use direct fetch to avoid apiRequest Authorization header issues
      const response = await fetch('/api/reports/generate-journal-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      const title = data.totalEntries > 0 ? "Journal Entries Generated" : "Journal Entries Already Exist";
      const description = data.totalEntries > 0 
        ? `Generated ${data.totalEntries} journal entries from ${data.documentsProcessed} documents`
        : data.skippedDocuments > 0 
          ? `${data.skippedDocuments} documents already have journal entries. No new entries created.`
          : "No documents found to process";
      
      toast({
        title,
        description,
        variant: data.totalEntries > 0 ? "default" : "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
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
        description: error.message || "Failed to generate journal entries",
        variant: "destructive",
      });
    },
  });

  const deleteJournalEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Use direct fetch to avoid apiRequest Authorization header issues
      const response = await fetch(`/api/journal-entries/${id}`, {
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
    },
    onSuccess: () => {
      toast({
        title: "Journal Entry Deleted",
        description: "Journal entry deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
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

  // Calculate real trial balance from journal entries
  const calculateTrialBalance = () => {
    if (!journalEntries || journalEntries.length === 0) {
      return { totalDebits: 0, totalCredits: 0, isBalanced: true };
    }
    
    const totalDebits = journalEntries.reduce((sum, entry) => sum + entry.debitAmount, 0);
    const totalCredits = journalEntries.reduce((sum, entry) => sum + entry.creditAmount, 0);
    
    return {
      totalDebits,
      totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01, // Allow for small rounding differences
    };
  };

  const trialBalance = calculateTrialBalance();



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
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Journal Entries
                </Button>
                <Button
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/financial-statements"] });
                    refetchJournalEntries();
                  }}
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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="reports-management">Reports Management</TabsTrigger>
              <TabsTrigger value="journal-entries">Journal Entries</TabsTrigger>
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
                        <span className="font-semibold">{formatCurrency(trialBalance.totalDebits)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Credits</span>
                        <span className="font-semibold">{formatCurrency(trialBalance.totalCredits)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm font-medium">Balance</span>
                        <span className="font-semibold text-secondary">
                          {formatCurrency(trialBalance.totalDebits - trialBalance.totalCredits)}
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
                    {(() => {
                      const plStatement = statements?.find(s => s.statementType === 'profit_loss');
                      const plData = plStatement?.data || { totalRevenue: 0, totalExpenses: 0, netProfit: 0 };
                      
                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Revenue</span>
                            <span className="font-semibold">{formatCurrency(plData.totalRevenue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Expenses</span>
                            <span className="font-semibold">{formatCurrency(plData.totalExpenses)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-sm font-medium">Net Profit</span>
                            <span className="font-semibold text-secondary">
                              {formatCurrency(plData.netProfit)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
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
                    {(() => {
                      const bsStatement = statements?.find(s => s.statementType === 'balance_sheet');
                      const bsData = bsStatement?.data || { totalAssets: 0, totalLiabilities: 0, totalEquity: 0 };
                      
                      return (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Assets</span>
                            <span className="font-semibold">{formatCurrency(bsData.totalAssets)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Liabilities</span>
                            <span className="font-semibold">{formatCurrency(bsData.totalLiabilities)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-sm font-medium">Total Equity</span>
                            <span className="font-semibold text-secondary">
                              {formatCurrency(bsData.totalEquity)}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
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

            <TabsContent value="reports-management" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Generated Reports</CardTitle>
                    <Badge variant="outline">
                      {statements ? statements.length : 0} reports
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {statementsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : statements && statements.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Generated At</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {statements.map((statement) => (
                            <TableRow key={statement.id}>
                              <TableCell className="font-medium">
                                {getStatementTitle(statement.statementType)}
                              </TableCell>
                              <TableCell>{statement.period}</TableCell>
                              <TableCell>{new Date(statement.generatedAt).toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant={statement.isValid ? "default" : "destructive"}>
                                  {statement.isValid ? "Valid" : "Invalid"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      toast({
                                        title: "Report View",
                                        description: `Opening ${getStatementTitle(statement.statementType)} report`,
                                      });
                                    }}
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => deleteReportMutation.mutate(statement.id)}
                                    disabled={deleteReportMutation.isPending}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">No financial reports found</p>
                      <p className="text-sm text-muted-foreground">
                        Generate reports from the Overview tab to get started
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {deleteReportMutation.isPending && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Deleting report... Please wait.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="journal-entries" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Journal Entries - {selectedPeriod}</CardTitle>
                    <Badge variant="outline">
                      {journalEntries ? journalEntries.length : 0} entries
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {journalEntriesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : journalEntries && journalEntries.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Journal ID</TableHead>
                            <TableHead>Account Code</TableHead>
                            <TableHead>Account Name</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                            <TableHead>Narration</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {journalEntries.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                              <TableCell className="font-mono">{entry.journalId}</TableCell>
                              <TableCell className="font-mono">{entry.accountCode}</TableCell>
                              <TableCell>{entry.accountName}</TableCell>
                              <TableCell className="text-right font-mono">
                                {entry.debitAmount > 0 ? formatCurrency(entry.debitAmount) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {entry.creditAmount > 0 ? formatCurrency(entry.creditAmount) : '-'}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {entry.narration}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteJournalEntryMutation.mutate(entry.id)}
                                  disabled={deleteJournalEntryMutation.isPending}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium">No journal entries found</p>
                      <p className="text-sm text-muted-foreground">
                        Upload documents to automatically generate journal entries
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trial-balance" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Trial Balance - {selectedPeriod}</CardTitle>
                    <Badge className={trialBalance.isBalanced ? "badge-compliant" : "badge-non-compliant"}>
                      {trialBalance.isBalanced ? "Balanced" : "Unbalanced"}
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
                        {journalEntries && journalEntries.length > 0 ? (
                          journalEntries.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="font-mono">{entry.accountCode}</TableCell>
                              <TableCell>{entry.accountName}</TableCell>
                              <TableCell className="text-right font-mono">
                                {entry.debitAmount > 0 ? formatCurrency(entry.debitAmount) : '-'}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {entry.creditAmount > 0 ? formatCurrency(entry.creditAmount) : '-'}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No journal entries found
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow className="border-t-2 font-semibold">
                          <TableCell colSpan={2}>Total</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(trialBalance.totalDebits)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(trialBalance.totalCredits)}
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
                  <div className="flex items-center justify-between">
                    <CardTitle>Profit & Loss Statement - {selectedPeriod}</CardTitle>
                    <Button
                      onClick={() => generateReportMutation.mutate('profit-loss')}
                      disabled={generateReportMutation.isPending}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Generate Report
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const profitLossStatement = statements?.find(s => s.statementType === 'profit_loss');
                    if (!profitLossStatement) {
                      return (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-lg font-medium">No P&L statement found</p>
                          <p className="text-sm text-muted-foreground">
                            Click "Generate Report" to create a profit & loss statement
                          </p>
                        </div>
                      );
                    }

                    const plData = profitLossStatement.data;
                    return (
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
                                {plData.revenue && plData.revenue.length > 0 ? (
                                  plData.revenue.map((item, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-mono">{item.accountCode}</TableCell>
                                      <TableCell>{item.accountName}</TableCell>
                                      <TableCell className="text-right font-mono">
                                        {formatCurrency(item.amount)}
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                      No revenue entries found
                                    </TableCell>
                                  </TableRow>
                                )}
                                <TableRow className="border-t font-semibold">
                                  <TableCell colSpan={2}>Total Revenue</TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(plData.totalRevenue || 0)}
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
                                {plData.expenses && plData.expenses.length > 0 ? (
                                  plData.expenses.map((item, index) => (
                                    <TableRow key={index}>
                                      <TableCell className="font-mono">{item.accountCode}</TableCell>
                                      <TableCell>{item.accountName}</TableCell>
                                      <TableCell className="text-right font-mono">
                                        {formatCurrency(item.amount)}
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                      No expense entries found
                                    </TableCell>
                                  </TableRow>
                                )}
                                <TableRow className="border-t font-semibold">
                                  <TableCell colSpan={2}>Total Expenses</TableCell>
                                  <TableCell className="text-right">
                                    {formatCurrency(plData.totalExpenses || 0)}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </div>

                        <div className="border-t-2 pt-4">
                          <div className="flex justify-between items-center text-lg font-bold">
                            <span>Net Profit</span>
                            <span className={plData.netProfit >= 0 ? "text-green-600" : "text-red-600"}>
                              {formatCurrency(plData.netProfit || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="balance-sheet" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Balance Sheet - {selectedPeriod}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => generateReportMutation.mutate('balance-sheet')}
                        disabled={generateReportMutation.isPending}
                        variant="outline"
                        size="sm"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Generate Report
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const balanceSheetStatement = statements?.find(s => s.statementType === 'balance_sheet');
                    if (!balanceSheetStatement) {
                      return (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-lg font-medium">No balance sheet found</p>
                          <p className="text-sm text-muted-foreground">
                            Click "Generate Report" to create a balance sheet
                          </p>
                        </div>
                      );
                    }

                    const bsData = balanceSheetStatement.data;
                    const isBalanced = Math.abs(bsData.totalAssets - (bsData.totalLiabilities + bsData.totalEquity)) < 0.01;
                    
                    return (
                      <div className="space-y-4">
                        <div className="flex justify-center">
                          <Badge className={isBalanced ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {isBalanced ? "Balanced" : "Unbalanced"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div>
                            <h3 className="text-lg font-semibold mb-3">Assets</h3>
                            <div className="space-y-3">
                              {bsData.assets && bsData.assets.length > 0 ? (
                                bsData.assets.map((asset, index) => (
                                  <div key={index} className="flex justify-between py-2 border-b">
                                    <div>
                                      <p className="font-medium">{asset.accountName}</p>
                                      <p className="text-xs text-muted-foreground">{asset.accountCode}</p>
                                      <p className="text-xs text-muted-foreground capitalize">{asset.subType}</p>
                                    </div>
                                    <p className="font-mono">{formatCurrency(asset.amount)}</p>
                                  </div>
                                ))
                              ) : (
                                <div className="flex justify-center py-8 text-muted-foreground">
                                  No asset entries found
                                </div>
                              )}
                              <div className="flex justify-between py-2 border-t-2 font-semibold">
                                <span>Total Assets</span>
                                <span>{formatCurrency(bsData.totalAssets || 0)}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-semibold mb-3">Liabilities & Equity</h3>
                            <div className="space-y-3">
                              <div>
                                <h4 className="font-medium text-muted-foreground mb-2">Liabilities</h4>
                                {bsData.liabilities && bsData.liabilities.length > 0 ? (
                                  bsData.liabilities.map((liability, index) => (
                                    <div key={index} className="flex justify-between py-2 border-b">
                                      <div>
                                        <p className="font-medium">{liability.accountName}</p>
                                        <p className="text-xs text-muted-foreground">{liability.accountCode}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{liability.subType}</p>
                                      </div>
                                      <p className="font-mono">{formatCurrency(liability.amount)}</p>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex justify-center py-4 text-muted-foreground">
                                    No liability entries found
                                  </div>
                                )}
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-muted-foreground mb-2">Equity</h4>
                                {bsData.equity && bsData.equity.length > 0 ? (
                                  bsData.equity.map((equity, index) => (
                                    <div key={index} className="flex justify-between py-2 border-b">
                                      <div>
                                        <p className="font-medium">{equity.accountName}</p>
                                        <p className="text-xs text-muted-foreground">{equity.accountCode}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{equity.subType}</p>
                                      </div>
                                      <p className="font-mono">{formatCurrency(equity.amount)}</p>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex justify-center py-4 text-muted-foreground">
                                    No equity entries found
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex justify-between py-2 border-t-2 font-semibold">
                                <span>Total Liabilities & Equity</span>
                                <span>{formatCurrency((bsData.totalLiabilities || 0) + (bsData.totalEquity || 0))}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>
    </PageLayout>
  );
}
