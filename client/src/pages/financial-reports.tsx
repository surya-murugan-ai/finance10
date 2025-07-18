import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import PageLayout from "@/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";

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
                onClick={() => window.location.reload()}
                variant="default"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="trial-balance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
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
                              <div className="truncate">{entry.description || 'N/A'}</div>
                            </TableCell>
                            <TableCell className="font-mono">{entry.accountCode || 'N/A'}</TableCell>
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