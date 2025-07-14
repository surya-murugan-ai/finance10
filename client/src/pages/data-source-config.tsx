import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Globe, 
  FolderOpen, 
  Cloud, 
  Settings,
  Plus,
  Edit,
  Trash2,
  TestTube,
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  Download,
  Upload,
  RefreshCw,
  FileText,
  Building,
  Shield,
  Workflow,
  Brain,
  LineChart
} from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';

interface DataSource {
  id: string;
  name: string;
  type: string;
  description: string;
  is_active: boolean;
  is_default: boolean;
  status: string;
  last_tested: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  config: Record<string, any>;
  metadata: Record<string, any>;
}

interface ERPConnector {
  id: string;
  name: string;
  type: 'tally' | 'sap' | 'zoho' | 'oracle' | 'manual';
  config: {
    baseUrl?: string;
    apiKey?: string;
    username?: string;
    password?: string;
    database?: string;
    port?: number;
    ssl?: boolean;
    timeout?: number;
  };
  status: 'active' | 'inactive' | 'error';
  last_sync: string | null;
  data_formats: string[];
}

interface DataFormatTemplate {
  id: string;
  name: string;
  type: 'sales' | 'purchase' | 'gst' | 'tds' | 'payroll' | 'bank_statement' | 'journal';
  format: 'excel' | 'csv' | 'json' | 'xml';
  columns: {
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    required: boolean;
    validation?: string;
  }[];
  sample_data: Record<string, any>[];
  upload_guide: string;
}

interface MasterData {
  id: string;
  type: 'gl_codes' | 'tds_sections' | 'vendors' | 'cost_centers' | 'customers' | 'products';
  data: Record<string, any>[];
  last_updated: string;
  source: string;
}

interface Stats {
  total: number;
  connected: number;
  disconnected: number;
  errors: number;
  active: number;
}

export default function DataSourceConfig() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('data-sources');
  
  // Data Sources
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [dataSourceStats, setDataSourceStats] = useState<Stats>({
    total: 0, connected: 0, disconnected: 0, errors: 0, active: 0
  });
  
  // ERP Connectors
  const [erpConnectors, setERPConnectors] = useState<ERPConnector[]>([]);
  const [erpStats, setERPStats] = useState<Stats>({
    total: 0, connected: 0, disconnected: 0, errors: 0, active: 0
  });
  
  // Data Format Templates
  const [dataFormats, setDataFormats] = useState<DataFormatTemplate[]>([]);
  const [selectedFormatType, setSelectedFormatType] = useState<string>('all');
  
  // Master Data
  const [masterData, setMasterData] = useState<MasterData[]>([]);
  const [selectedMasterType, setSelectedMasterType] = useState<string>('all');
  
  // Testing states
  const [testingConnections, setTestingConnections] = useState<Set<string>>(new Set());
  const [syncingERP, setSyncingERP] = useState<Set<string>>(new Set());
  
  // AI Learning
  const [aiLearningStatus, setAILearningStatus] = useState<{
    initialized: boolean;
    samplesProcessed: number;
    lastUpdate: string | null;
  }>({
    initialized: false,
    samplesProcessed: 0,
    lastUpdate: null
  });

  useEffect(() => {
    if (user) {
      loadDataSources();
      loadERPConnectors();
      loadDataFormats();
      loadMasterData();
      loadStats();
    }
  }, [user]);

  const loadDataSources = async () => {
    try {
      const response = await apiRequest('/api/data-sources');
      setDataSources(response);
    } catch (error) {
      console.error('Error loading data sources:', error);
      toast({
        title: "Error",
        description: "Failed to load data sources",
        variant: "destructive"
      });
    }
  };

  const loadERPConnectors = async () => {
    try {
      const response = await apiRequest('/api/erp-connectors');
      setERPConnectors(response);
    } catch (error) {
      console.error('Error loading ERP connectors:', error);
      toast({
        title: "Error",
        description: "Failed to load ERP connectors",
        variant: "destructive"
      });
    }
  };

  const loadDataFormats = async () => {
    try {
      const url = selectedFormatType === 'all' ? '/api/data-formats' : `/api/data-formats?type=${selectedFormatType}`;
      const response = await apiRequest(url);
      setDataFormats(response);
    } catch (error) {
      console.error('Error loading data formats:', error);
      toast({
        title: "Error",
        description: "Failed to load data formats",
        variant: "destructive"
      });
    }
  };

  const loadMasterData = async () => {
    try {
      const url = selectedMasterType === 'all' ? '/api/master-data' : `/api/master-data?type=${selectedMasterType}`;
      const response = await apiRequest(url);
      setMasterData(Array.isArray(response) ? response : [response].filter(Boolean));
    } catch (error) {
      console.error('Error loading master data:', error);
      toast({
        title: "Error",
        description: "Failed to load master data",
        variant: "destructive"
      });
    }
  };

  const loadStats = async () => {
    try {
      const [dsStats, erpStats] = await Promise.all([
        apiRequest('/api/data-sources/stats'),
        apiRequest('/api/erp-connectors/stats')
      ]);
      setDataSourceStats(dsStats);
      setERPStats(erpStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const testConnection = async (sourceId: string) => {
    setTestingConnections(prev => new Set(prev).add(sourceId));
    try {
      const result = await apiRequest(`/api/data-sources/${sourceId}/test`, {
        method: 'POST'
      });
      
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: `Connected in ${result.duration}ms`
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.message,
          variant: "destructive"
        });
      }
      
      loadDataSources();
      loadStats();
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: "Test Failed",
        description: "Unable to test connection",
        variant: "destructive"
      });
    } finally {
      setTestingConnections(prev => {
        const newSet = new Set(prev);
        newSet.delete(sourceId);
        return newSet;
      });
    }
  };

  const syncERPData = async (connectorId: string) => {
    setSyncingERP(prev => new Set(prev).add(connectorId));
    try {
      const result = await apiRequest(`/api/erp-connectors/${connectorId}/sync`, {
        method: 'POST'
      });
      
      if (result.success) {
        toast({
          title: "Sync Successful",
          description: `Processed ${result.recordsProcessed} records`
        });
      } else {
        toast({
          title: "Sync Failed",
          description: result.message,
          variant: "destructive"
        });
      }
      
      loadERPConnectors();
      loadStats();
    } catch (error) {
      console.error('Error syncing ERP data:', error);
      toast({
        title: "Sync Failed",
        description: "Unable to sync ERP data",
        variant: "destructive"
      });
    } finally {
      setSyncingERP(prev => {
        const newSet = new Set(prev);
        newSet.delete(connectorId);
        return newSet;
      });
    }
  };

  const initializeAILearning = async () => {
    setLoading(true);
    try {
      const result = await apiRequest('/api/ai-learning/initialize', {
        method: 'POST'
      });
      
      if (result.success) {
        setAILearningStatus({
          initialized: true,
          samplesProcessed: result.samplesProcessed,
          lastUpdate: new Date().toISOString()
        });
        toast({
          title: "AI Learning Initialized",
          description: `Processed ${result.samplesProcessed} samples`
        });
      } else {
        toast({
          title: "Initialization Failed",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error initializing AI learning:', error);
      toast({
        title: "Initialization Failed",
        description: "Unable to initialize AI learning",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected':
      case 'inactive':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'testing':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <Database className="w-4 h-4" />;
      case 'api':
        return <Globe className="w-4 h-4" />;
      case 'file_system':
        return <FolderOpen className="w-4 h-4" />;
      case 'cloud_storage':
        return <Cloud className="w-4 h-4" />;
      case 'erp_system':
        return <Building className="w-4 h-4" />;
      case 'gst_portal':
      case 'mca_portal':
        return <Shield className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const renderDataSourcesTab = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Sources</p>
                <p className="text-2xl font-bold">{dataSourceStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Connected</p>
                <p className="text-2xl font-bold">{dataSourceStats.connected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Disconnected</p>
                <p className="text-2xl font-bold">{dataSourceStats.disconnected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">Errors</p>
                <p className="text-2xl font-bold">{dataSourceStats.errors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-2xl font-bold">{dataSourceStats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Sources List */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Data Sources</h3>
        <Button onClick={loadDataSources}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dataSources.map((source) => (
          <Card key={source.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(source.type)}
                  <CardTitle className="text-sm">{source.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(source.status)}
                  <Badge variant={source.is_active ? "default" : "secondary"}>
                    {source.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 mb-3">{source.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Type:</span>
                  <span className="font-medium">{source.type}</span>
                </div>
                
                {source.last_tested && (
                  <div className="flex justify-between text-xs">
                    <span>Last Tested:</span>
                    <span className="font-medium">
                      {new Date(source.last_tested).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                {source.error_message && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {source.error_message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testConnection(source.id)}
                  disabled={testingConnections.has(source.id)}
                >
                  {testingConnections.has(source.id) ? (
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <TestTube className="w-3 h-3 mr-1" />
                  )}
                  Test
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  disabled
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderERPConnectorsTab = () => (
    <div className="space-y-6">
      {/* ERP Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Connectors</p>
                <p className="text-2xl font-bold">{erpStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-2xl font-bold">{erpStats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Inactive</p>
                <p className="text-2xl font-bold">{erpStats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-medium">Errors</p>
                <p className="text-2xl font-bold">{erpStats.errors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ERP Connectors List */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">ERP Connectors</h3>
        <Button onClick={loadERPConnectors}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {erpConnectors.map((connector) => (
          <Card key={connector.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4" />
                  <CardTitle className="text-sm">{connector.name}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(connector.status)}
                  <Badge variant={connector.status === 'active' ? "default" : "secondary"}>
                    {connector.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Type:</span>
                  <span className="font-medium capitalize">{connector.type}</span>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span>Data Formats:</span>
                  <span className="font-medium">{connector.data_formats.join(', ')}</span>
                </div>
                
                {connector.last_sync && (
                  <div className="flex justify-between text-xs">
                    <span>Last Sync:</span>
                    <span className="font-medium">
                      {new Date(connector.last_sync).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => syncERPData(connector.id)}
                  disabled={syncingERP.has(connector.id) || connector.status !== 'active'}
                >
                  {syncingERP.has(connector.id) ? (
                    <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3 mr-1" />
                  )}
                  Sync
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  disabled
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderDataFormatsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Data Format Templates</h3>
        <div className="flex items-center space-x-2">
          <Select value={selectedFormatType} onValueChange={setSelectedFormatType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="purchase">Purchase</SelectItem>
              <SelectItem value="gst">GST</SelectItem>
              <SelectItem value="tds">TDS</SelectItem>
              <SelectItem value="payroll">Payroll</SelectItem>
              <SelectItem value="bank_statement">Bank Statement</SelectItem>
              <SelectItem value="journal">Journal</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadDataFormats}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dataFormats.map((format) => (
          <Card key={format.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <CardTitle className="text-sm">{format.name}</CardTitle>
                </div>
                <Badge variant="outline">{format.format.toUpperCase()}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Type:</span>
                  <span className="font-medium capitalize">{format.type}</span>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span>Columns:</span>
                  <span className="font-medium">{format.columns.length}</span>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span>Required Fields:</span>
                  <span className="font-medium">
                    {format.columns.filter(c => c.required).length}
                  </span>
                </div>
              </div>
              
              <div className="mt-3">
                <p className="text-xs text-gray-600">{format.upload_guide}</p>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button size="sm" variant="outline" disabled>
                  <Download className="w-3 h-3 mr-1" />
                  Download Template
                </Button>
                
                <Button size="sm" variant="outline" disabled>
                  <FileText className="w-3 h-3 mr-1" />
                  View Sample
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderMasterDataTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Master Data</h3>
        <div className="flex items-center space-x-2">
          <Select value={selectedMasterType} onValueChange={setSelectedMasterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="gl_codes">GL Codes</SelectItem>
              <SelectItem value="tds_sections">TDS Sections</SelectItem>
              <SelectItem value="vendors">Vendors</SelectItem>
              <SelectItem value="cost_centers">Cost Centers</SelectItem>
              <SelectItem value="customers">Customers</SelectItem>
              <SelectItem value="products">Products</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadMasterData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {masterData.map((data) => (
          <Card key={data.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4" />
                  <CardTitle className="text-sm capitalize">{data.type.replace('_', ' ')}</CardTitle>
                </div>
                <Badge variant="outline">{data.data.length} records</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Last Updated:</span>
                  <span className="font-medium">
                    {new Date(data.last_updated).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span>Source:</span>
                  <span className="font-medium capitalize">{data.source.replace('_', ' ')}</span>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button size="sm" variant="outline" disabled>
                  <FileText className="w-3 h-3 mr-1" />
                  View Data
                </Button>
                
                <Button size="sm" variant="outline" disabled>
                  <Upload className="w-3 h-3 mr-1" />
                  Update
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAILearningTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>AI Learning System</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">AI Learning Status</p>
                <p className="text-xs text-gray-600">
                  {aiLearningStatus.initialized 
                    ? `Initialized with ${aiLearningStatus.samplesProcessed} samples`
                    : 'Not initialized'
                  }
                </p>
              </div>
              <Badge variant={aiLearningStatus.initialized ? "default" : "secondary"}>
                {aiLearningStatus.initialized ? "Active" : "Inactive"}
              </Badge>
            </div>
            
            {aiLearningStatus.initialized && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Samples Processed:</span>
                  <span className="font-medium">{aiLearningStatus.samplesProcessed}</span>
                </div>
                
                {aiLearningStatus.lastUpdate && (
                  <div className="flex justify-between text-xs">
                    <span>Last Update:</span>
                    <span className="font-medium">
                      {new Date(aiLearningStatus.lastUpdate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            <Button
              onClick={initializeAILearning}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              {aiLearningStatus.initialized ? 'Reinitialize AI Learning' : 'Initialize AI Learning'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <LineChart className="w-5 h-5" />
            <span>Learning Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Data Template Learning</span>
                <span>85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Pattern Recognition</span>
                <span>72%</span>
              </div>
              <Progress value={72} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Anomaly Detection</span>
                <span>91%</span>
              </div>
              <Progress value={91} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Classification Accuracy</span>
                <span>88%</span>
              </div>
              <Progress value={88} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (!user) {
    return <div>Please log in to access data source configuration.</div>;
  }

  return (
    <PageLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Data Source Configuration</h1>
          <p className="text-gray-600">
            Manage your data sources, ERP connectors, and AI learning systems
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="data-sources">Data Sources</TabsTrigger>
            <TabsTrigger value="erp-connectors">ERP Connectors</TabsTrigger>
            <TabsTrigger value="data-formats">Data Formats</TabsTrigger>
            <TabsTrigger value="master-data">Master Data</TabsTrigger>
            <TabsTrigger value="ai-learning">AI Learning</TabsTrigger>
          </TabsList>

          <TabsContent value="data-sources">
            {renderDataSourcesTab()}
          </TabsContent>

          <TabsContent value="erp-connectors">
            {renderERPConnectorsTab()}
          </TabsContent>

          <TabsContent value="data-formats">
            {renderDataFormatsTab()}
          </TabsContent>

          <TabsContent value="master-data">
            {renderMasterDataTab()}
          </TabsContent>

          <TabsContent value="ai-learning">
            {renderAILearningTab()}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}