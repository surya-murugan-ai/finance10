import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { IntelligentDataExtractor } from '@/components/IntelligentDataExtractor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, Upload, Database } from "lucide-react";

export default function IntelligentExtractionTest() {
  const [documentId, setDocumentId] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [showExtractor, setShowExtractor] = useState(false);
  const [extractionResults, setExtractionResults] = useState<any>(null);

  const handleTestExtraction = () => {
    if (!documentId.trim()) {
      alert('Please enter a document ID');
      return;
    }
    setShowExtractor(true);
  };

  const handleExtractionComplete = (data: any) => {
    setExtractionResults(data);
    console.log('Extraction completed:', data);
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">AI Data Extraction Test</h1>
            <p className="text-gray-600">Test the intelligent data extraction system</p>
          </div>
          <Brain className="h-8 w-8 text-blue-600" />
        </div>

        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Test Configuration
            </CardTitle>
            <CardDescription>
              Configure the test parameters for intelligent data extraction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="documentId">Document ID</Label>
              <Input
                id="documentId"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="Enter document ID to test extraction"
              />
            </div>
            
            <div>
              <Label htmlFor="documentName">Document Name (Optional)</Label>
              <Input
                id="documentName"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="Enter document name for display"
              />
            </div>

            <Button 
              onClick={handleTestExtraction}
              disabled={!documentId.trim()}
              className="w-full"
            >
              Start AI Extraction Test
            </Button>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">AI Model:</span>
                <span className="ml-2">Anthropic Claude 4.0 Sonnet</span>
              </div>
              <div>
                <span className="font-medium">Database:</span>
                <span className="ml-2">PostgreSQL (standardized_transactions)</span>
              </div>
              <div>
                <span className="font-medium">Extraction Engine:</span>
                <span className="ml-2">IntelligentDataExtractor</span>
              </div>
              <div>
                <span className="font-medium">Supported Formats:</span>
                <span className="ml-2">Excel (.xlsx), CSV</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Architecture Information */}
        <Alert>
          <Brain className="h-4 w-4" />
          <AlertDescription>
            <strong>AI-Powered Architecture:</strong> The system uses Anthropic Claude to analyze Excel structure, 
            identify column mappings, classify document types, and extract data into standardized transaction format. 
            This enables agents to operate on consistent data structures regardless of original Excel format.
          </AlertDescription>
        </Alert>

        {/* Extraction Component */}
        {showExtractor && (
          <IntelligentDataExtractor
            documentId={documentId}
            documentName={documentName || `Document ${documentId}`}
            onExtractionComplete={handleExtractionComplete}
          />
        )}

        {/* Results Summary */}
        {extractionResults && (
          <Card>
            <CardHeader>
              <CardTitle>Extraction Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Document Type:</span>
                  <div>{extractionResults.analysis?.documentType}</div>
                </div>
                <div>
                  <span className="font-medium">Confidence:</span>
                  <div>{extractionResults.analysis?.confidence}%</div>
                </div>
                <div>
                  <span className="font-medium">Transactions:</span>
                  <div>{extractionResults.totalProcessed}</div>
                </div>
                <div>
                  <span className="font-medium">Company:</span>
                  <div>{extractionResults.analysis?.companyName}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature List */}
        <Card>
          <CardHeader>
            <CardTitle>AI Extraction Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Document Analysis</h4>
                <ul className="text-sm space-y-1">
                  <li>• Automatic document type classification</li>
                  <li>• Header row and data structure detection</li>
                  <li>• Company name and period identification</li>
                  <li>• Confidence scoring and validation</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Data Processing</h4>
                <ul className="text-sm space-y-1">
                  <li>• Intelligent column mapping</li>
                  <li>• Standardized transaction format</li>
                  <li>• Amount parsing and validation</li>
                  <li>• Database storage and retrieval</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </PageLayout>
  );
}