import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrialBalanceCard() {
  const { data: trialBalance, isLoading } = useQuery({
    queryKey: ['/api/reports/trial-balance'],
    queryFn: async () => {
      const response = await fetch('/api/reports/trial-balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ period: '2025' }),
      });
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card className="report-card">
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
    );
  }

  console.log('TrialBalanceCard - Direct data:', trialBalance);

  return (
    <Card className="report-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">
            Trial Balance
          </CardTitle>
          <Badge className="report-status-badge updated">updated</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Debits</span>
            <span className="text-sm font-semibold">
              ₹{trialBalance?.totalDebits?.toLocaleString() || '0'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Credits</span>
            <span className="text-sm font-semibold">
              ₹{trialBalance?.totalCredits?.toLocaleString() || '0'}
            </span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-sm font-medium text-foreground">Balance</span>
            <span className="text-sm font-semibold text-secondary">₹0</span>
          </div>
        </div>
        <Button 
          size="sm" 
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
        >
          Generate Report
        </Button>
      </CardContent>
    </Card>
  );
}