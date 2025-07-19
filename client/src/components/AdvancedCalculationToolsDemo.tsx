import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, TrendingUp, BookOpen, PieChart, Banknote } from 'lucide-react';

export default function AdvancedCalculationToolsDemo() {
  const [selectedOperation, setSelectedOperation] = useState('currentRatio');
  const [parameters, setParameters] = useState({});
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const operationCategories = {
    'Financial Statement Calculators': [
      { value: 'currentRatio', label: 'Current Ratio', params: ['currentAssets', 'currentLiabilities'], icon: <TrendingUp className="w-4 h-4" /> },
      { value: 'quickRatio', label: 'Quick Ratio', params: ['quickAssets', 'currentLiabilities'], icon: <TrendingUp className="w-4 h-4" /> },
      { value: 'returnOnEquity', label: 'Return on Equity', params: ['netIncome', 'shareholderEquity'], icon: <PieChart className="w-4 h-4" /> },
      { value: 'workingCapital', label: 'Working Capital', params: ['currentAssets', 'currentLiabilities'], icon: <Banknote className="w-4 h-4" /> }
    ],
    'Journal Entry & Bookkeeping': [
      { value: 'createJournalEntry', label: 'Create Journal Entry', params: ['description', 'entries'], icon: <BookOpen className="w-4 h-4" /> },
      { value: 'validateJournalEntries', label: 'Validate Journal Entries', params: ['entries'], icon: <BookOpen className="w-4 h-4" /> }
    ],
    'Trial Balance Calculators': [
      { value: 'generateTrialBalance', label: 'Generate Trial Balance', params: ['accounts'], icon: <Calculator className="w-4 h-4" /> },
      { value: 'calculateAccountBalance', label: 'Calculate Account Balance', params: ['transactions'], icon: <Calculator className="w-4 h-4" /> }
    ]
  };

  const sampleData = {
    // Financial Statement Calculators
    currentRatio: { currentAssets: 500000, currentLiabilities: 300000 },
    quickRatio: { quickAssets: 350000, currentLiabilities: 300000 },
    returnOnEquity: { netIncome: 150000, shareholderEquity: 800000 },
    workingCapital: { currentAssets: 500000, currentLiabilities: 300000 },
    
    // Journal Entry & Bookkeeping
    createJournalEntry: {
      description: 'Purchase of office equipment',
      entries: [
        { account: 'Office Equipment', debit: 50000, credit: 0 },
        { account: 'Cash', debit: 0, credit: 50000 }
      ]
    },
    validateJournalEntries: {
      entries: [
        { account: 'Cash', debit: 100000, credit: 0 },
        { account: 'Sales Revenue', debit: 0, credit: 85000 },
        { account: 'GST Payable', debit: 0, credit: 15000 }
      ]
    },
    
    // Trial Balance Calculators
    generateTrialBalance: {
      accounts: [
        { code: '1100', name: 'Cash', debit: 100000, credit: 0 },
        { code: '1200', name: 'Accounts Receivable', debit: 75000, credit: 0 },
        { code: '2100', name: 'Accounts Payable', debit: 0, credit: 50000 },
        { code: '4100', name: 'Sales Revenue', debit: 0, credit: 125000 }
      ]
    },
    calculateAccountBalance: {
      transactions: [
        { date: '2025-01-01', debit: 50000, credit: 0, description: 'Opening balance' },
        { date: '2025-01-15', debit: 25000, credit: 0, description: 'Sale invoice payment' },
        { date: '2025-01-20', debit: 0, credit: 10000, description: 'Office rent payment' }
      ]
    }
  };

  const executeCalculation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/calculations/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          operation: selectedOperation,
          parameters: parameters,
          context: { source: 'demo', timestamp: new Date().toISOString() }
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Calculation failed:', error);
      setResult({
        success: false,
        error: 'Failed to execute calculation'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSampleData = () => {
    if (sampleData[selectedOperation]) {
      setParameters(sampleData[selectedOperation]);
    }
  };

  const renderParameterInput = (param) => {
    const value = parameters[param] || '';
    
    if (param === 'entries' || param === 'accounts' || param === 'transactions') {
      return (
        <div key={param} className="space-y-2">
          <Label htmlFor={param} className="text-sm font-medium">
            {param.charAt(0).toUpperCase() + param.slice(1)}
          </Label>
          <Textarea
            id={param}
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
            onChange={(e) => {
              try {
                const parsedValue = JSON.parse(e.target.value);
                setParameters(prev => ({ ...prev, [param]: parsedValue }));
              } catch {
                setParameters(prev => ({ ...prev, [param]: e.target.value }));
              }
            }}
            placeholder={`Enter ${param} as JSON array`}
            className="min-h-[120px] font-mono text-sm"
          />
        </div>
      );
    }

    return (
      <div key={param} className="space-y-2">
        <Label htmlFor={param} className="text-sm font-medium">
          {param.charAt(0).toUpperCase() + param.slice(1).replace(/([A-Z])/g, ' $1')}
        </Label>
        <Input
          id={param}
          type={param === 'description' ? 'text' : 'number'}
          value={value}
          onChange={(e) => setParameters(prev => ({ 
            ...prev, 
            [param]: param === 'description' ? e.target.value : parseFloat(e.target.value) || 0 
          }))}
          placeholder={`Enter ${param}`}
        />
      </div>
    );
  };

  const renderResult = () => {
    if (!result) return null;

    if (!result.success) {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {result.error}</p>
          </CardContent>
        </Card>
      );
    }

    const { result: calcResult } = result;

    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Calculation Result
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {calcResult.formula && (
            <div>
              <Label className="text-sm font-medium text-green-700">Formula:</Label>
              <p className="text-sm bg-white p-2 rounded border font-mono">{calcResult.formula}</p>
            </div>
          )}
          
          {calcResult.result !== undefined && (
            <div>
              <Label className="text-sm font-medium text-green-700">Result:</Label>
              <p className="text-lg font-bold text-green-800">{calcResult.result}</p>
            </div>
          )}

          {calcResult.interpretation && (
            <div>
              <Label className="text-sm font-medium text-green-700">Interpretation:</Label>
              <p className="text-sm text-green-600">{calcResult.interpretation}</p>
            </div>
          )}

          {calcResult.status && (
            <div>
              <Label className="text-sm font-medium text-green-700">Status:</Label>
              <Badge variant={calcResult.status === 'Valid' || calcResult.status === 'Balanced' ? 'default' : 'destructive'}>
                {calcResult.status}
              </Badge>
            </div>
          )}

          {calcResult.errors && calcResult.errors.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-red-700">Errors:</Label>
              <ul className="text-sm text-red-600 list-disc list-inside">
                {calcResult.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {calcResult.accounts && (
            <div>
              <Label className="text-sm font-medium text-green-700">Account Summary:</Label>
              <div className="text-sm bg-white p-2 rounded border">
                <p>Total Accounts: {calcResult.accountCount}</p>
                <p>Total Debits: ₹{calcResult.totals?.totalDebits?.toLocaleString('en-IN')}</p>
                <p>Total Credits: ₹{calcResult.totals?.totalCredits?.toLocaleString('en-IN')}</p>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 bg-white p-2 rounded border">
            <pre>{JSON.stringify(calcResult, null, 2)}</pre>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Advanced Financial Calculation Tools</h2>
        <p className="text-gray-600">
          Comprehensive financial statement calculators, journal entry tools, and trial balance calculators
        </p>
      </div>

      <Tabs defaultValue="Financial Statement Calculators" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="Financial Statement Calculators">Financial Statements</TabsTrigger>
          <TabsTrigger value="Journal Entry & Bookkeeping">Journal & Bookkeeping</TabsTrigger>
          <TabsTrigger value="Trial Balance Calculators">Trial Balance</TabsTrigger>
        </TabsList>

        {Object.entries(operationCategories).map(([category, operations]) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {operations[0]?.icon}
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Operation</Label>
                  <Select value={selectedOperation} onValueChange={setSelectedOperation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a calculation" />
                    </SelectTrigger>
                    <SelectContent>
                      {operations.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          <div className="flex items-center gap-2">
                            {op.icon}
                            {op.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {operations.find(op => op.value === selectedOperation)?.params?.map(renderParameterInput)}
                </div>

                <div className="flex gap-2">
                  <Button onClick={executeCalculation} disabled={isLoading} className="flex-1">
                    {isLoading ? 'Calculating...' : 'Calculate'}
                  </Button>
                  <Button variant="outline" onClick={loadSampleData}>
                    Load Sample Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {renderResult()}
    </div>
  );
}