import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";

interface FinancialReport {
  id: string;
  statementType: string;
  status: 'updated' | 'processing' | 'queued';
  data: any;
}

export default function FinancialReportsSection() {
  const currentYear = new Date().getFullYear().toString();
  
  const { data: reports, isLoading } = useQuery<FinancialReport[]>({
    queryKey: ['/api/financial-statements'],
    retry: false,
  });

  const { data: trialBalance, isLoading: trialBalanceLoading } = useQuery({
    queryKey: ['/api/reports/trial-balance', currentYear],
    queryFn: async () => {
      const response = await apiRequest('/api/reports/trial-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: currentYear }),
      });
      return response;
    },
    retry: false,
  });

  const getReportTitle = (type: string) => {
    switch (type) {
      case 'trial_balance': return 'Trial Balance';
      case 'profit_loss': return 'P&L Statement';
      case 'balance_sheet': return 'Balance Sheet';
      default: return type;
    }
  };

  const getReportData = (report: FinancialReport) => {
    if (report.statementType === 'trial_balance') {
      // ALWAYS use real trial balance data if available, ignore financial statements data
      if (trialBalance && !trialBalanceLoading && trialBalance.totalDebits !== undefined) {
        const debits = trialBalance.totalDebits;
        const credits = trialBalance.totalCredits;
        console.log('Using live trial balance data:', { debits, credits, type: typeof debits });
        
        return {
          totalDebits: debits,
          totalCredits: credits,
          balance: '₹0',
        };
      }
      
      // Fallback to financial statements data only if live data is not available
      if (report.data?.totalDebits !== undefined) {
        console.log('Using financial statements data:', report.data);
        return {
          totalDebits: Number(report.data.totalDebits) || 0,
          totalCredits: Number(report.data.totalCredits) || 0,
          balance: '₹0',
        };
      }
      
      // Loading state
      return {
        totalDebits: 0,
        totalCredits: 0,
        balance: '₹0',
      };
    } else if (report.statementType === 'profit_loss') {
      return {
        revenue: Number(report.data?.totalRevenue) || 0,
        expenses: Number(report.data?.totalExpenses) || 0,
        netProfit: Number(report.data?.netProfit) || 0,
      };
    } else if (report.statementType === 'balance_sheet') {
      return {
        totalAssets: Number(report.data?.totalAssets) || 0,
        totalLiabilities: Number(report.data?.totalLiabilities) || 0,
        equity: Number(report.data?.totalEquity) || 0,
      };
    }
    return {};
  };

  if (isLoading) {
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
                <div className="flex justify-between border-t pt-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <Skeleton className="h-10 w-full mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const mockReports = [
    {
      id: '1',
      statementType: 'trial_balance',
      status: 'updated' as const,
      data: { totalDebits: 0, totalCredits: 0, isBalanced: true }
    },
    {
      id: '2',
      statementType: 'profit_loss',
      status: 'processing' as const,
      data: { totalRevenue: 0, totalExpenses: 0, netProfit: 0 }
    },
    {
      id: '3',
      statementType: 'balance_sheet',
      status: 'queued' as const,
      data: { totalAssets: 0, totalLiabilities: 0, totalEquity: 0 }
    }
  ];

  // Add default status to reports if missing and filter to unique types
  const reportsToShow = reports ? (() => {
    const uniqueTypes = new Set();
    return reports
      .filter(report => {
        if (uniqueTypes.has(report.statementType)) {
          return false;
        }
        uniqueTypes.add(report.statementType);
        return true;
      })
      .map(report => ({
        ...report,
        status: report.status || 'updated' // Default to 'updated' if status is missing
      }));
  })() : mockReports;
  
  // Debug the trial balance report specifically
  const trialBalanceReport = reportsToShow.find(r => r.statementType === 'trial_balance');
  console.log('Trial balance report:', trialBalanceReport);
  console.log('Trial balance loading:', trialBalanceLoading);
  console.log('Trial balance data:', trialBalance);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {reportsToShow.map((report) => {
        const reportData = getReportData(report);
        
        // Debug for trial balance specifically
        if (report.statementType === 'trial_balance') {
          console.log('Rendering trial balance with data:', reportData);
          console.log('Report ID:', report.id);
          console.log('Component render timestamp:', Date.now());
        }
        
        return (
          <Card key={report.id} className="report-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-foreground">
                  {getReportTitle(report.statementType)}
                </CardTitle>
                <Badge className={`report-status-badge ${report.status}`}>
                  {report.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {report.statementType === 'trial_balance' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Debits</span>
                      <span className="text-sm font-semibold">
${report.statementType === 'trial_balance' && trialBalance && !trialBalanceLoading ? 
                          `₹${trialBalance.totalDebits.toLocaleString()}` : 
                          `₹${(reportData.totalDebits || 0).toLocaleString()}`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Credits</span>
                      <span className="text-sm font-semibold">
${report.statementType === 'trial_balance' && trialBalance && !trialBalanceLoading ? 
                          `₹${trialBalance.totalCredits.toLocaleString()}` : 
                          `₹${(reportData.totalCredits || 0).toLocaleString()}`
                        }
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium text-foreground">Balance</span>
                      <span className="text-sm font-semibold text-secondary">₹0</span>
                    </div>
                  </>
                )}
                
                {report.statementType === 'profit_loss' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Revenue</span>
                      <span className="text-sm font-semibold">₹{reportData.revenue?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Expenses</span>
                      <span className="text-sm font-semibold">₹{reportData.expenses?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium text-foreground">Net Profit</span>
                      <span className="text-sm font-semibold text-secondary">₹{reportData.netProfit?.toLocaleString()}</span>
                    </div>
                  </>
                )}
                
                {report.statementType === 'balance_sheet' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Assets</span>
                      <span className="text-sm font-semibold">₹{reportData.totalAssets?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Liabilities</span>
                      <span className="text-sm font-semibold">₹{reportData.totalLiabilities?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium text-foreground">Equity</span>
                      <span className="text-sm font-semibold text-secondary">₹{reportData.equity?.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
              
              <Button 
                className="w-full mt-4"
                disabled={report.status !== 'updated'}
                variant={report.status === 'updated' ? 'default' : 'secondary'}
              >
                {report.status === 'updated' ? (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    {report.status === 'processing' ? 'Generating...' : 'Pending'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
