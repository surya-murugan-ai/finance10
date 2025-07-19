import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import TrialBalanceCard from "./trial-balance-card";
import SimpleTrialBalance from "./simple-trial-balance";
import WorkingTrialBalance from "./working-trial-balance";

interface FinancialReport {
  id: string;
  statementType: string;
  status: 'updated' | 'processing' | 'queued';
  data: any;
}

export default function FinancialReportsSection() {
  const currentYear = new Date().getFullYear().toString();
  
  // Fetch real financial data from all endpoints
  const { data: trialBalance, isLoading: trialBalanceLoading } = useQuery({
    queryKey: ['/api/reports/trial-balance', currentYear],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch('/api/reports/trial-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ period: currentYear }),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    },
    retry: 1,
    enabled: !!localStorage.getItem('access_token'),
    refetchOnWindowFocus: false,
  });

  const { data: profitLoss, isLoading: profitLossLoading } = useQuery({
    queryKey: ['/api/reports/profit-loss', currentYear],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch('/api/reports/profit-loss', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ period: currentYear }),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    },
    retry: 1,
    enabled: !!localStorage.getItem('access_token'),
    refetchOnWindowFocus: false,
  });

  const { data: balanceSheet, isLoading: balanceSheetLoading } = useQuery({
    queryKey: ['/api/reports/balance-sheet', currentYear], 
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No authentication token found');
      
      const response = await fetch('/api/reports/balance-sheet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ period: currentYear }),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    },
    retry: 1,
    enabled: !!localStorage.getItem('access_token'),
    refetchOnWindowFocus: false,
  });

  console.log('Trial balance report:', null);
  console.log('Trial balance loading:', trialBalanceLoading);
  console.log('Trial balance data:', trialBalance);

  const getReportTitle = (type: string) => {
    switch (type) {
      case 'trial_balance': return 'Trial Balance';
      case 'profit_loss': return 'P&L Statement';
      case 'balance_sheet': return 'Balance Sheet';
      default: return type;
    }
  };

  // Helper functions to format financial data
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getTrialBalanceData = () => {
    if (trialBalance && trialBalance.totalDebits !== undefined) {
      return {
        totalDebits: trialBalance.totalDebits || 0,
        totalCredits: trialBalance.totalCredits || 0,
        balance: trialBalance.isBalanced ? '₹0' : 'Not Balanced',
      };
    }
    return {
      totalDebits: 0,
      totalCredits: 0,
      balance: '₹0',
    };
  };

  const trialBalanceData = getTrialBalanceData();

  if (trialBalanceLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="report-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Trial Balance Card */}
      <Card className="report-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{getReportTitle('trial_balance')}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {trialBalance?.isBalanced ? 'updated' : 'processing'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Debits</span>
              <span className="text-sm font-medium">
                {trialBalanceLoading ? 'Loading...' : formatCurrency(trialBalance?.totalDebits || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Credits</span>
              <span className="text-sm font-medium">
                {trialBalanceLoading ? 'Loading...' : formatCurrency(trialBalance?.totalCredits || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Balance</span>
              <span className="text-sm font-medium">
                {trialBalanceLoading ? 'Loading...' : (trialBalance?.isBalanced ? 'Balanced' : 'Not Balanced')}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-4 w-full">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </CardContent>
      </Card>

      {/* P&L Statement Card */}
      <Card className="report-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{getReportTitle('profit_loss')}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {profitLossLoading ? 'loading' : 'updated'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Revenue</span>
              <span className="text-sm font-medium">
                {profitLossLoading ? 'Loading...' : formatCurrency(
                  profitLoss?.revenue?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Expenses</span>
              <span className="text-sm font-medium">
                {profitLossLoading ? 'Loading...' : formatCurrency(
                  profitLoss?.expenses?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Net Profit</span>
              <span className="text-sm font-medium">
                {profitLossLoading ? 'Loading...' : formatCurrency(profitLoss?.netIncome || 0)}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-4 w-full">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </CardContent>
      </Card>

      {/* Balance Sheet Card */}
      <Card className="report-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{getReportTitle('balance_sheet')}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {balanceSheetLoading ? 'loading' : 'updated'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Assets</span>
              <span className="text-sm font-medium">
                {balanceSheetLoading ? 'Loading...' : formatCurrency(
                  balanceSheet?.assets?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Liabilities</span>
              <span className="text-sm font-medium">
                {balanceSheetLoading ? 'Loading...' : formatCurrency(
                  balanceSheet?.liabilities?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Equity</span>
              <span className="text-sm font-medium">
                {balanceSheetLoading ? 'Loading...' : formatCurrency(
                  balanceSheet?.equity?.reduce((sum: number, item: any) => sum + (item.amount || 0), 0) || 0
                )}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-4 w-full">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}