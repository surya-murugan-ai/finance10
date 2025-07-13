import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import PageLayout from "@/components/layout/PageLayout";
import FileDropzone from "@/components/file-upload/file-dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download, Trash2, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Document } from "@shared/schema";

export default function DocumentUpload() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: documents, isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    retry: false,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="badge-compliant">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-accent/10 text-accent">Processing</Badge>;
      case 'failed':
        return <Badge className="badge-non-compliant">Failed</Badge>;
      default:
        return <Badge className="badge-pending">Uploaded</Badge>;
    }
  };

  const getDocumentTypeDisplay = (type: string) => {
    switch (type) {
      case 'journal': return 'Journal';
      case 'gst': return 'GST Returns';
      case 'tds': return 'TDS Certificate';
      case 'trial_balance': return 'Trial Balance';
      case 'fixed_asset_register': return 'Fixed Asset Register';
      case 'purchase_register': return 'Purchase Register';
      case 'sales_register': return 'Sales Register';
      case 'bank_statement': return 'Bank Statement';
      default: return 'Other';
    }
  };

  return (
    <PageLayout title="Document Upload">
      <div className="space-y-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Document Upload</h1>
            <p className="text-muted-foreground">
              Upload and manage your financial documents for processing
            </p>
          </div>

          {/* Upload Section */}
          <div className="mb-8">
            <FileDropzone />
          </div>

          {/* Documents List */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="loading-spinner h-8 w-8" />
                </div>
              ) : !documents || documents.length === 0 ? (
                <div className="empty-state">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No documents uploaded yet</p>
                  <p className="text-sm text-gray-400">Upload your first document to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="table-header">Document</TableHead>
                        <TableHead className="table-header">Type</TableHead>
                        <TableHead className="table-header">Status</TableHead>
                        <TableHead className="table-header">Size</TableHead>
                        <TableHead className="table-header">Uploaded</TableHead>
                        <TableHead className="table-header">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="table-cell">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{doc.originalName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="table-cell">
                            {doc.documentType ? getDocumentTypeDisplay(doc.documentType) : 'Unknown'}
                          </TableCell>
                          <TableCell className="table-cell">
                            {getStatusBadge(doc.status)}
                          </TableCell>
                          <TableCell className="table-cell">
                            {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                          </TableCell>
                          <TableCell className="table-cell">
                            {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="table-cell">
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
      </div>
    </PageLayout>
  );
}
