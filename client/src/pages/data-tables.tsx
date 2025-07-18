import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Search, Filter, FileText, Calendar, DollarSign, Building, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ExtractedData {
  documentId: string;
  filename: string;
  documentType: string;
  extractedRows: number;
  data: any[];
  error?: string;
}

export default function DataTables() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("Q1_2025");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocType, setSelectedDocType] = useState("all");

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

  const { data: apiResponse, isLoading: dataLoading, error } = useQuery<{message: string, totalDocuments: number, extractedData: ExtractedData[]}>({
    queryKey: [`/api/extracted-data?period=${selectedPeriod}&docType=${selectedDocType}`],
  });

  console.log('Data Tables Query:', { extractedData: apiResponse, isLoading, error });
  console.log('Extracted data length:', apiResponse?.extractedData?.length || 0);
  console.log('Selected period:', selectedPeriod, 'Selected doc type:', selectedDocType);

  const extractedData = apiResponse?.extractedData || [];
  const filteredData = extractedData?.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(item.data).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedDocType === "all" || item.documentType === selectedDocType;
    
    return matchesSearch && matchesType;
  }) || [];

  const documentTypes = [
    { value: "vendor_invoice", label: "Vendor Invoices", icon: FileText, color: "bg-blue-500" },
    { value: "sales_register", label: "Sales Register", icon: DollarSign, color: "bg-green-500" },
    { value: "salary_register", label: "Salary Register", icon: Users, color: "bg-purple-500" },
    { value: "bank_statement", label: "Bank Statement", icon: Building, color: "bg-orange-500" },
    { value: "purchase_register", label: "Purchase Register", icon: Calendar, color: "bg-red-500" },
  ];

  const getDocumentTypeData = (docType: string) => {
    const filtered = filteredData.filter(item => item.documentType === docType);
    console.log(`Documents for ${docType}:`, filtered.length, filtered.map(f => f.filename));
    return filtered;
  };

  const renderGenericData = (data: any[], borderColor: string, bgColor: string) => (
    <div className="space-y-4">
      {data.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-muted-foreground">No Documents Found</h3>
              <p className="text-sm text-muted-foreground">
                No documents of this type have been uploaded yet.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        data.map((item) => (
          <Card key={item.documentId} className={`border-l-4 ${borderColor}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{item.filename}</CardTitle>
                <Badge variant="outline" className={`${bgColor} text-white`}>
                  {item.extractedRows} rows extracted
                </Badge>
              </div>
              <CardDescription>
                Document Type: {item.documentType.replace('_', ' ').toUpperCase()}
                {item.error && <span className="text-red-500 ml-2">Error: {item.error}</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Row #</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {item.data.slice(0, 15).map((row: any, idx: number) => {
                    if (typeof row === 'object' && row !== null) {
                      // Show standardized business fields in order
                      const standardFields = [
                        ['company', 'Company'],
                        ['transactionDate', 'Date'],
                        ['formattedAmount', 'Amount'],
                        ['transactionType', 'Type'],
                        ['voucher', 'Voucher'],
                        ['voucherType', 'Voucher Type'],
                        ['narration', 'Narration']
                      ];
                      
                      const displayFields = [];
                      
                      // Add standard fields first
                      standardFields.forEach(([field, label]) => {
                        if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
                          displayFields.push([field, row[field], label]);
                        }
                      });
                      
                      // Add other important fields
                      Object.entries(row).forEach(([key, value]) => {
                        if (!standardFields.some(([field]) => field === key) && 
                            value !== undefined && value !== null && value !== '' &&
                            !['rowNumber', 'date', 'particulars', 'voucherNumber', 'value', 'grossTotal'].includes(key)) {
                          displayFields.push([key, value, key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())]);
                        }
                      });
                      
                      return displayFields.slice(0, 5).map(([key, value, label], entryIdx) => (
                        <TableRow key={`${idx}-${entryIdx}`}>
                          <TableCell className="font-medium">{idx + 1}</TableCell>
                          <TableCell className="font-semibold text-blue-600">
                            {label}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {key === 'formattedAmount' ? (
                              <span className="font-semibold text-green-600">{String(value)}</span>
                            ) : key === 'transactionType' ? (
                              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                {String(value)}
                              </span>
                            ) : (
                              String(value)
                            )}
                          </TableCell>
                        </TableRow>
                      ));
                    } else {
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{idx + 1}</TableCell>
                          <TableCell className="text-muted-foreground">-</TableCell>
                          <TableCell className="font-mono text-sm">{String(row)}</TableCell>
                        </TableRow>
                      );
                    }
                  })}
                  {item.data.length > 15 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        ... and {item.data.length - 15} more rows
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );



  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="ml-64">
          <TopBar />
          <main className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Data Tables</h1>
                <p className="text-muted-foreground">View extracted data from financial documents</p>
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64">
        <TopBar />
        <main className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Data Tables</h1>
              <p className="text-muted-foreground">View extracted data from financial documents</p>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
          </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period">Period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1_2025">Q1 2025</SelectItem>
                  <SelectItem value="Q2_2025">Q2 2025</SelectItem>
                  <SelectItem value="Q3_2025">Q3 2025</SelectItem>
                  <SelectItem value="Q4_2025">Q4 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="doctype">Document Type</Label>
              <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Tables */}
      <Tabs defaultValue="vendor_invoice" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {documentTypes.map((type) => {
            const Icon = type.icon;
            const count = getDocumentTypeData(type.value).length;
            return (
              <TabsTrigger key={type.value} value={type.value} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {type.label}
                <Badge variant="secondary" className="ml-1">
                  {count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="vendor_invoice" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Vendor Invoices Data</h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {getDocumentTypeData("vendor_invoice").length} documents
            </Badge>
          </div>
          {renderGenericData(getDocumentTypeData("vendor_invoice"), "border-l-blue-500", "bg-blue-500")}
        </TabsContent>

        <TabsContent value="sales_register" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Sales Register Data</h2>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {getDocumentTypeData("sales_register").length} documents
            </Badge>
          </div>
          {renderGenericData(getDocumentTypeData("sales_register"), "border-l-green-500", "bg-green-500")}
        </TabsContent>

        <TabsContent value="salary_register" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Salary Register Data</h2>
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              {getDocumentTypeData("salary_register").length} documents
            </Badge>
          </div>
          {renderGenericData(getDocumentTypeData("salary_register"), "border-l-purple-500", "bg-purple-500")}
        </TabsContent>

        <TabsContent value="bank_statement" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Bank Statement Data</h2>
            <Badge variant="outline" className="bg-orange-50 text-orange-700">
              {getDocumentTypeData("bank_statement").length} documents
            </Badge>
          </div>
          {renderGenericData(getDocumentTypeData("bank_statement"), "border-l-orange-500", "bg-orange-500")}
        </TabsContent>

        <TabsContent value="purchase_register" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Purchase Register Data</h2>
            <Badge variant="outline" className="bg-red-50 text-red-700">
              {getDocumentTypeData("purchase_register").length} documents
            </Badge>
          </div>
          {renderGenericData(getDocumentTypeData("purchase_register"), "border-l-red-500", "bg-red-500")}
        </TabsContent>
      </Tabs>

      {filteredData.length === 0 && (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">No data found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedDocType !== "all" 
                  ? "No documents match your current filters. Try adjusting your search or filters."
                  : "No extracted data available for the selected period. Upload and process documents to see data here."
                }
              </p>
            </div>
          </div>
        </Card>
      )}
        </main>
      </div>
    </div>
  );
}