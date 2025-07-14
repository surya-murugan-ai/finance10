import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Trash2, Eye, CheckCircle, XCircle, AlertCircle, Calendar, FileIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Document } from "@shared/schema";

interface DocumentRequirement {
  id: string;
  category: string;
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'as-needed';
  dueDate?: string;
  fileTypes: string[];
  isRequired: boolean;
  isUploaded: boolean;
  uploadedFiles: string[];
  compliance: string[];
}

export default function DocumentUpload() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

  // Define comprehensive document requirements
  const documentRequirements: DocumentRequirement[] = [
    // Primary Financial Documents
    {
      id: 'trial_balance',
      category: 'Primary Financial',
      name: 'Trial Balance',
      description: 'Complete trial balance showing all GL account balances',
      priority: 'high',
      frequency: 'monthly',
      dueDate: '2025-01-31',
      fileTypes: ['Excel', 'CSV'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Companies Act 2013', 'IndAS']
    },
    {
      id: 'journal_entries',
      category: 'Primary Financial',
      name: 'Journal Entries',
      description: 'All journal entries for the period with supporting documents',
      priority: 'high',
      frequency: 'monthly',
      dueDate: '2025-01-31',
      fileTypes: ['Excel', 'CSV', 'PDF'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Companies Act 2013', 'IndAS']
    },
    {
      id: 'fixed_asset_register',
      category: 'Primary Financial',
      name: 'Fixed Asset Register',
      description: 'Complete fixed asset register with depreciation calculations',
      priority: 'high',
      frequency: 'quarterly',
      dueDate: '2025-01-31',
      fileTypes: ['Excel', 'CSV'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Companies Act 2013', 'IndAS 16']
    },
    
    // GST Documents
    {
      id: 'gstr_2a',
      category: 'GST Compliance',
      name: 'GSTR-2A',
      description: 'GST Return for inward supplies (auto-populated)',
      priority: 'high',
      frequency: 'monthly',
      dueDate: '2025-01-20',
      fileTypes: ['Excel', 'CSV', 'JSON'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['GST Act', 'CGST Rules']
    },
    {
      id: 'gstr_3b',
      category: 'GST Compliance',
      name: 'GSTR-3B',
      description: 'Monthly GST return summary',
      priority: 'high',
      frequency: 'monthly',
      dueDate: '2025-01-20',
      fileTypes: ['Excel', 'CSV', 'JSON'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['GST Act', 'CGST Rules']
    },
    {
      id: 'purchase_register',
      category: 'GST Compliance',
      name: 'Purchase Register',
      description: 'Complete purchase register with GST details',
      priority: 'medium',
      frequency: 'monthly',
      dueDate: '2025-01-31',
      fileTypes: ['Excel', 'CSV'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['GST Act', 'Companies Act 2013']
    },
    {
      id: 'sales_register',
      category: 'GST Compliance',
      name: 'Sales Register',
      description: 'Complete sales register with GST details',
      priority: 'medium',
      frequency: 'monthly',
      dueDate: '2025-01-31',
      fileTypes: ['Excel', 'CSV'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['GST Act', 'Companies Act 2013']
    },
    
    // TDS Documents
    {
      id: 'tds_certificates',
      category: 'TDS Compliance',
      name: 'TDS Certificates',
      description: 'Form 16A and other TDS certificates',
      priority: 'high',
      frequency: 'quarterly',
      dueDate: '2025-01-31',
      fileTypes: ['PDF', 'Excel'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Income Tax Act', 'TDS Rules']
    },
    {
      id: 'form_26q',
      category: 'TDS Compliance',
      name: 'Form 26Q',
      description: 'Quarterly TDS return for non-salary payments',
      priority: 'high',
      frequency: 'quarterly',
      dueDate: '2025-01-31',
      fileTypes: ['Excel', 'CSV', 'TXT'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Income Tax Act', 'TDS Rules']
    },
    
    // Banking Documents
    {
      id: 'bank_statements',
      category: 'Banking',
      name: 'Bank Statements',
      description: 'Monthly bank statements for all accounts',
      priority: 'high',
      frequency: 'monthly',
      dueDate: '2025-01-31',
      fileTypes: ['PDF', 'Excel', 'CSV'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Companies Act 2013', 'Banking Regulation Act']
    },
    {
      id: 'bank_reconciliation',
      category: 'Banking',
      name: 'Bank Reconciliation',
      description: 'Monthly bank reconciliation statements',
      priority: 'medium',
      frequency: 'monthly',
      dueDate: '2025-01-31',
      fileTypes: ['Excel', 'CSV'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Companies Act 2013', 'IndAS']
    },
    
    // Statutory Documents
    {
      id: 'director_report',
      category: 'Statutory',
      name: 'Directors Report',
      description: 'Annual directors report and board resolutions',
      priority: 'medium',
      frequency: 'yearly',
      dueDate: '2025-03-31',
      fileTypes: ['PDF', 'Word'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Companies Act 2013', 'MCA Rules']
    },
    {
      id: 'auditor_report',
      category: 'Statutory',
      name: 'Auditor Report',
      description: 'Independent auditor report and management letter',
      priority: 'medium',
      frequency: 'yearly',
      dueDate: '2025-03-31',
      fileTypes: ['PDF'],
      isRequired: true,
      isUploaded: false,
      uploadedFiles: [],
      compliance: ['Companies Act 2013', 'Auditing Standards']
    }
  ];

  // Update document requirements based on uploaded documents
  const updatedRequirements = documentRequirements.map(req => {
    const matchingDocs = documents?.filter(doc => {
      const docType = doc.documentType?.toLowerCase();
      const reqId = req.id.toLowerCase();
      return docType === reqId || docType === reqId.replace('_', '') || 
             (docType === 'gst' && reqId.includes('gstr')) ||
             (docType === 'tds' && reqId.includes('tds')) ||
             (docType === 'journal' && reqId.includes('journal')) ||
             (docType === 'bank_statement' && reqId.includes('bank'));
    }) || [];

    return {
      ...req,
      isUploaded: matchingDocs.length > 0,
      uploadedFiles: matchingDocs.map(doc => doc.originalName)
    };
  });

  // Calculate completion statistics
  const totalRequired = updatedRequirements.filter(req => req.isRequired).length;
  const completedRequired = updatedRequirements.filter(req => req.isRequired && req.isUploaded).length;
  const completionPercentage = totalRequired > 0 ? (completedRequired / totalRequired) * 100 : 0;

  // Filter by category
  const categories = ['all', ...Array.from(new Set(updatedRequirements.map(req => req.category)))];
  const filteredRequirements = selectedCategory === 'all' 
    ? updatedRequirements 
    : updatedRequirements.filter(req => req.category === selectedCategory);

  // Get status icon
  const getStatusIcon = (requirement: DocumentRequirement) => {
    if (requirement.isUploaded) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (requirement.isRequired) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    } else {
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

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

        {/* Completion Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Document Completion Status</span>
              <Badge variant="outline">
                {completedRequired}/{totalRequired} Complete
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {completionPercentage.toFixed(1)}%
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{completedRequired} Completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>{totalRequired - completedRequired} Pending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span>{updatedRequirements.filter(req => req.priority === 'high' && !req.isUploaded).length} High Priority</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span>{updatedRequirements.filter(req => req.dueDate && new Date(req.dueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)).length} Due Soon</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="requirements" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="requirements">Document Requirements</TabsTrigger>
            <TabsTrigger value="upload">Upload Documents</TabsTrigger>
            <TabsTrigger value="uploaded">Uploaded Files</TabsTrigger>
          </TabsList>

          <TabsContent value="requirements" className="space-y-4">
            {/* Category Filter */}
            <Card>
              <CardHeader>
                <CardTitle>Filter by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category === 'all' ? 'All Categories' : category}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Document Requirements List */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedCategory === 'all' ? 'All Document Requirements' : `${selectedCategory} Requirements`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredRequirements.map((requirement) => (
                    <div key={requirement.id} className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getStatusIcon(requirement)}
                            <h3 className="font-semibold">{requirement.name}</h3>
                            {getPriorityBadge(requirement.priority)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{requirement.description}</p>
                          
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{requirement.frequency}</span>
                            </div>
                            {requirement.dueDate && (
                              <div className="flex items-center space-x-1">
                                <span>Due: {new Date(requirement.dueDate).toLocaleDateString()}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <FileIcon className="h-3 w-3" />
                              <span>{requirement.fileTypes.join(', ')}</span>
                            </div>
                          </div>

                          {requirement.isUploaded && (
                            <div className="mt-2">
                              <div className="text-xs text-green-600 mb-1">Uploaded Files:</div>
                              <div className="flex flex-wrap gap-1">
                                {requirement.uploadedFiles.map((file, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {file}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-2">
                            <div className="text-xs text-muted-foreground mb-1">Compliance:</div>
                            <div className="flex flex-wrap gap-1">
                              {requirement.compliance.map((comp, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {comp}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          {requirement.isUploaded ? (
                            <Badge className="bg-green-100 text-green-800">
                              Complete
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              Required
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Documents</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Upload your financial documents. The system will automatically classify and process them.
                </p>
              </CardHeader>
              <CardContent>
                <FileDropzone />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="uploaded" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
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
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
