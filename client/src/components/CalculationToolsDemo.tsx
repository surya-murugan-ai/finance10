import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, CheckCircle, AlertCircle, TrendingUp, Percent, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CalculationResult {
  result: number;
  formula: string;
  precision: number;
  currency?: string;
}

interface CalculationResponse {
  success: boolean;
  result?: CalculationResult | any;
  error?: string;
  explanation?: string;
}

export function CalculationToolsDemo() {
  const [operation, setOperation] = useState('');
  const [param1, setParam1] = useState('');
  const [param2, setParam2] = useState('');
  const [result, setResult] = useState<CalculationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableTools, setAvailableTools] = useState<string[]>([]);
  const { toast } = useToast();

  const operations = [
    { value: 'add', label: 'Addition', icon: '➕', params: 2 },
    { value: 'subtract', label: 'Subtraction', icon: '➖', params: 2 },
    { value: 'multiply', label: 'Multiplication', icon: '✖️', params: 2 },
    { value: 'divide', label: 'Division', icon: '➗', params: 2 },
    { value: 'percentage', label: 'Percentage', icon: '%', params: 2 },
    { value: 'gross_profit_margin', label: 'Gross Profit Margin', icon: '📊', params: 2 },
    { value: 'net_profit_margin', label: 'Net Profit Margin', icon: '📈', params: 2 },
    { value: 'gst_calculation', label: 'GST Calculation', icon: '🏛️', params: 2 },
    { value: 'tds_calculation', label: 'TDS Calculation', icon: '💰', params: 2 }
  ];

  const executeCalculation = async () => {
    if (!operation || !param1 || (!param2 && operations.find(op => op.value === operation)?.params === 2)) {
      toast({
        title: "Missing Parameters",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const parameters = [parseFloat(param1)];
      if (param2) parameters.push(parseFloat(param2));

      const response = await fetch('/api/calculations/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          operation,
          parameters,
          context: { timestamp: new Date().toISOString() }
        })
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast({
          title: "Calculation Complete",
          description: data.explanation || "Calculation executed successfully"
        });
      } else {
        toast({
          title: "Calculation Failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Calculation error:', error);
      setResult({
        success: false,
        error: 'Network error occurred'
      });
      toast({
        title: "Network Error",
        description: "Failed to connect to calculation service",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTools = async () => {
    try {
      const response = await fetch('/api/calculations/tools', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAvailableTools(data.tools);
      }
    } catch (error) {
      console.error('Error loading tools:', error);
    }
  };

  React.useEffect(() => {
    loadAvailableTools();
  }, []);

  const formatResult = (result: any) => {
    if (result?.result?.result !== undefined) {
      return result.result.result.toLocaleString('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    return 'N/A';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            LLM Calculation Tools Demo
          </CardTitle>
          <CardDescription>
            Demonstrates precise calculation tools for LLM integration, ensuring accuracy over direct LLM computations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="operation">Calculation Operation</Label>
              <Select value={operation} onValueChange={setOperation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent>
                  {operations.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      <span className="flex items-center gap-2">
                        <span>{op.icon}</span>
                        {op.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="param1">First Parameter</Label>
              <Input
                id="param1"
                type="number"
                value={param1}
                onChange={(e) => setParam1(e.target.value)}
                placeholder="Enter first value"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="param2">Second Parameter</Label>
              <Input
                id="param2"
                type="number"
                value={param2}
                onChange={(e) => setParam2(e.target.value)}
                placeholder="Enter second value"
                disabled={operations.find(op => op.value === operation)?.params === 1}
              />
            </div>
          </div>

          <Button 
            onClick={executeCalculation} 
            disabled={loading || !operation}
            className="w-full"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Calculating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Execute Calculation
              </div>
            )}
          </Button>

          {result && (
            <Card className={`mt-4 ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  Calculation Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.success ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-white">
                        <DollarSign className="h-3 w-3 mr-1" />
                        Result: {formatResult(result)}
                      </Badge>
                    </div>
                    
                    {result.result?.formula && (
                      <div className="bg-white p-3 rounded-md border">
                        <Label className="text-sm font-medium">Formula:</Label>
                        <code className="block mt-1 text-sm text-gray-700 font-mono">
                          {result.result.formula}
                        </code>
                      </div>
                    )}

                    {result.explanation && (
                      <Alert>
                        <TrendingUp className="h-4 w-4" />
                        <AlertDescription>
                          {result.explanation}
                        </AlertDescription>
                      </Alert>
                    )}

                    {result.result?.baseAmount && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label>Base Amount:</Label>
                          <div className="font-mono">₹{result.result.baseAmount.toLocaleString('en-IN')}</div>
                        </div>
                        {result.result.gstAmount && (
                          <div>
                            <Label>GST Amount:</Label>
                            <div className="font-mono">₹{result.result.gstAmount.toLocaleString('en-IN')}</div>
                          </div>
                        )}
                        {result.result.totalAmount && (
                          <div>
                            <Label>Total Amount:</Label>
                            <div className="font-mono font-bold">₹{result.result.totalAmount.toLocaleString('en-IN')}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Error: {result.error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {availableTools.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Calculation Tools</CardTitle>
            <CardDescription>
              Complete list of calculation tools available for LLM integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {availableTools.map((tool, index) => (
                <Badge key={index} variant="outline" className="justify-start p-2">
                  <Percent className="h-3 w-3 mr-2" />
                  <code className="text-xs">{tool}</code>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}