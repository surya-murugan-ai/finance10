import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Brain, FileText, Database, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExcelAnalysis {
  documentType: string;
  confidence: number;
  structure: {
    headerRow: number;
    dataStartRow: number;
    totalRows: number;
    totalColumns: number;
    columnHeaders: string[];
  };
  columnMapping: {
    [key: string]: string | null;
  };
  companyName: string;
  period: string;
  summary: string;
}

interface StandardizedTransaction {
  id: string;
  transactionDate: string;
  company: string;
  particulars: string;
  voucherType: string;
  voucherNumber: string;
  debitAmount: number;
  creditAmount: number;
  netAmount: number;
  taxAmount?: number;
  category: string;
  aiConfidence: number;
}

interface IntelligentDataExtractorProps {
  documentId: string;
  documentName: string;
  onExtractionComplete?: (data: any) => void;
}

export const IntelligentDataExtractor: React.FC<IntelligentDataExtractorProps> = ({
  documentId,
  documentName,
  onExtractionComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<ExcelAnalysis | null>(null);
  const [transactions, setTransactions] = useState<StandardizedTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleExtraction = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/extract-intelligent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ documentId })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.analysis);
        setTransactions(data.transactions);
        
        toast({
          title: "AI Extraction Successful",
          description: `Processed ${data.totalProcessed} transactions with ${data.analysis.confidence}% confidence`,
        });

        if (onExtractionComplete) {
          onExtractionComplete(data);
        }
      } else {
        throw new Error(data.error || 'Extraction failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Extraction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'bg-green-100 text-green-800';
    if (confidence >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      sales: 'bg-blue-100 text-blue-800',
      purchase: 'bg-purple-100 text-purple-800',
      payment: 'bg-red-100 text-red-800',
      receipt: 'bg-green-100 text-green-800',
      journal: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Data Extraction
          </CardTitle>
          <CardDescription>
            Use advanced AI to automatically understand and extract data from any Excel format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Document: {documentName}</p>
              <p className="text-xs text-gray-500">ID: {documentId}</p>
            </div>
            <Button
              onClick={handleExtraction}
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  Extract with AI
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              AI Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium">Document Type</p>
                <Badge variant="outline">{analysis.documentType}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium">AI Confidence</p>
                <Badge className={getConfidenceColor(analysis.confidence)}>
                  {analysis.confidence}%
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Company</p>
                <p className="text-sm">{analysis.companyName}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Period</p>
                <p className="text-sm">{analysis.period}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Structure Analysis</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>Header Row: {analysis.structure.headerRow + 1}</div>
                <div>Data Start: {analysis.structure.dataStartRow + 1}</div>
                <div>Total Rows: {analysis.structure.totalRows}</div>
                <div>Columns: {analysis.structure.totalColumns}</div>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Column Mapping</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {Object.entries(analysis.columnMapping).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key}:</span>
                    <span className="font-mono">{value || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Summary</p>
              <p className="text-sm text-gray-600">{analysis.summary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extracted Transactions */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Standardized Transactions
            </CardTitle>
            <CardDescription>
              {transactions.length} transactions extracted and normalized
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Particulars</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead className="text-center">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 10).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">
                        {formatDate(transaction.transactionDate)}
                      </TableCell>
                      <TableCell className="max-w-32 truncate">
                        {transaction.company}
                      </TableCell>
                      <TableCell className="max-w-48 truncate">
                        {transaction.particulars}
                      </TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(transaction.category)}>
                          {transaction.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {transaction.debitAmount > 0 ? formatCurrency(transaction.debitAmount) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {transaction.creditAmount > 0 ? formatCurrency(transaction.creditAmount) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(transaction.netAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={getConfidenceColor(transaction.aiConfidence)}>
                          {transaction.aiConfidence}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {transactions.length > 10 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Showing 10 of {transactions.length} transactions
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {analysis && transactions.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Successfully processed {transactions.length} transactions using AI-powered extraction. 
            Data has been standardized and stored in the database for agent processing.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};