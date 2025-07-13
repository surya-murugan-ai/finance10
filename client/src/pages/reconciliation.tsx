import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  GitMerge, 
  Play, 
  FileText, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Settings,
  TrendingUp,
  Calendar,
  Filter,
  Download
} from "lucide-react";

export default function ReconciliationPage() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("Q1_2025");
  const [isRunning, setIsRunning] = useState(false);
  const [currentReport, setCurrentReport] = useState<any>(null);

  // Fetch reconciliation reports
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['/api/reconciliation/reports', selectedPeriod],
    enabled: !!selectedPeriod,
  });

  // Fetch reconciliation matches
  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ['/api/reconciliation/matches', selectedPeriod],
    enabled: !!selectedPeriod,
  });

  // Fetch reconciliation rules
  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ['/api/reconciliation/rules'],
  });

  // Fetch intercompany transactions
  const { data: intercompanyTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/intercompany/transactions', selectedPeriod],
    enabled: !!selectedPeriod,
  });

  // Run reconciliation mutation
  const runReconciliation = useMutation({
    mutationFn: async (data: { period: string; entityList?: string[] }) => {
      return apiRequest('/api/reconciliation/run', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      setCurrentReport(data);
      toast({
        title: "Reconciliation Complete",
        description: `Found ${data.matches.length} matches with ${data.reconciliationRate.toFixed(1)}% reconciliation rate`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/reconciliation/reports'] });
      queryClient.invalidateQueries({ queryKey: ['/api/reconciliation/matches'] });
      setIsRunning(false);
    },
    onError: (error) => {
      toast({
        title: "Reconciliation Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsRunning(false);
    },
  });

  const handleRunReconciliation = async () => {
    setIsRunning(true);
    runReconciliation.mutate({ period: selectedPeriod });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case 'exact': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'suspected': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matched': return 'bg-green-100 text-green-800';
      case 'unmatched': return 'bg-red-100 text-red-800';
      case 'disputed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (reportsLoading || matchesLoading || rulesLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading reconciliation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Intercompany Reconciliation</h1>
          <p className="text-gray-600 mt-2">
            Advanced reconciliation algorithms for complex intercompany transactions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Q1_2025">Q1 2025</SelectItem>
              <SelectItem value="Q2_2025">Q2 2025</SelectItem>
              <SelectItem value="Q3_2025">Q3 2025</SelectItem>
              <SelectItem value="Q4_2025">Q4 2025</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleRunReconciliation}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isRunning ? 'Running...' : 'Run Reconciliation'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="intercompany">Intercompany</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Reconciliation Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {currentReport?.totalTransactions || reports?.[0]?.totalTransactions || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  For {selectedPeriod}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Matched</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {currentReport?.matchedTransactions || reports?.[0]?.matchedTransactions || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successfully reconciled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unmatched</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {currentReport?.unmatchedTransactions || reports?.[0]?.unmatchedTransactions || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requiring attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reconciliation Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {currentReport?.reconciliationRate 
                    ? `${(currentReport.reconciliationRate * 100).toFixed(1)}%`
                    : reports?.[0]?.reconciliationRate 
                    ? `${(parseFloat(reports[0].reconciliationRate) * 100).toFixed(1)}%`
                    : '0%'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall success rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Reconciliation Progress */}
          {isRunning && (
            <Card>
              <CardHeader>
                <CardTitle>Reconciliation in Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Progress value={60} className="w-full" />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Processing journal entries...</span>
                    <span>60%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Reconciliation Results */}
          {currentReport && (
            <Card>
              <CardHeader>
                <CardTitle>Latest Reconciliation Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Total Variance</p>
                      <p className="text-lg font-bold text-red-600">
                        {formatCurrency(currentReport.totalVariance)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Matches Found</p>
                      <p className="text-lg font-bold text-green-600">
                        {currentReport.matches.length}
                      </p>
                    </div>
                  </div>
                  {currentReport.recommendations.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Recommendations</p>
                      <ul className="space-y-1">
                        {currentReport.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="matches" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Matches</CardTitle>
              <p className="text-sm text-gray-600">
                Detailed view of all reconciliation matches for {selectedPeriod}
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity A</TableHead>
                      <TableHead>Entity B</TableHead>
                      <TableHead>Match Type</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Variance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matches?.map((match: any) => (
                      <TableRow key={match.id}>
                        <TableCell className="font-medium">{match.entityA}</TableCell>
                        <TableCell>{match.entityB}</TableCell>
                        <TableCell>
                          <Badge className={getMatchTypeColor(match.matchType)}>
                            {match.matchType}
                          </Badge>
                        </TableCell>
                        <TableCell>{(parseFloat(match.matchScore) * 100).toFixed(1)}%</TableCell>
                        <TableCell>
                          {match.variance > 0 ? formatCurrency(parseFloat(match.variance)) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(match.status)}>
                            {match.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(match.reconciliationDate).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intercompany" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Intercompany Transactions</CardTitle>
              <p className="text-sm text-gray-600">
                Identified intercompany transactions for {selectedPeriod}
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parent Entity</TableHead>
                      <TableHead>Child Entity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {intercompanyTransactions?.map((transaction: any) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.parentEntity}</TableCell>
                        <TableCell>{transaction.childEntity}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{transaction.transactionType}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(parseFloat(transaction.amount))}</TableCell>
                        <TableCell>
                          {new Date(transaction.transactionDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={transaction.isReconciled ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {transaction.isReconciled ? 'Reconciled' : 'Pending'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Rules</CardTitle>
              <p className="text-sm text-gray-600">
                Configure automated reconciliation rules and matching criteria
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules?.map((rule: any) => (
                  <div key={rule.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{rule.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={rule.isActive ? "default" : "secondary"}>
                          {rule.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Tolerance:</span> {rule.tolerancePercent}% / {formatCurrency(rule.toleranceAmount)}
                      </div>
                      <div>
                        <span className="font-medium">Auto Reconcile:</span> {rule.autoReconcile ? 'Yes' : 'No'}
                      </div>
                      <div>
                        <span className="font-medium">Priority:</span> {rule.priority}
                      </div>
                      <div>
                        <span className="font-medium">Account Codes:</span> {rule.accountCodes.join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reconciliation Reports</CardTitle>
              <p className="text-sm text-gray-600">
                Historical reconciliation reports and analysis
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Total Transactions</TableHead>
                      <TableHead>Matched</TableHead>
                      <TableHead>Unmatched</TableHead>
                      <TableHead>Reconciliation Rate</TableHead>
                      <TableHead>Total Variance</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports?.map((report: any) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.period}</TableCell>
                        <TableCell>{report.totalTransactions}</TableCell>
                        <TableCell className="text-green-600">{report.matchedTransactions}</TableCell>
                        <TableCell className="text-red-600">{report.unmatchedTransactions}</TableCell>
                        <TableCell>{(parseFloat(report.reconciliationRate) * 100).toFixed(1)}%</TableCell>
                        <TableCell>{formatCurrency(parseFloat(report.totalVariance))}</TableCell>
                        <TableCell>
                          {new Date(report.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}