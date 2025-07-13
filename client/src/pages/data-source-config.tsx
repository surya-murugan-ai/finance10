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
  RefreshCw
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
}

interface DataSourceType {
  value: string;
  name: string;
  description: string;
}

interface DatabaseType {
  value: string;
  name: string;
  default_port: number;
}

interface DataSourceConfig {
  id: string;
  name: string;
  type: string;
  description: string;
  config: Record<string, any>;
  is_active: boolean;
  is_default: boolean;
  metadata: Record<string, any>;
}

export default function DataSourceConfig() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [dataSourceTypes, setDataSourceTypes] = useState<DataSourceType[]>([]);
  const [databaseTypes, setDatabaseTypes] = useState<DatabaseType[]>([]);
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [statistics, setStatistics] = useState<Record<string, any>>({});

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: '',
    description: '',
    is_active: true,
    is_default: false,
    config: {},
    metadata: {}
  });

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

  useEffect(() => {
    if (isAuthenticated) {
      fetchDataSources();
      fetchDataSourceTypes();
      fetchDatabaseTypes();
    }
  }, [isAuthenticated]);

  const fetchDataSources = async () => {
    try {
      const response = await apiRequest('/api/data-sources/');
      setDataSources(response.data_sources);
    } catch (error) {
      console.error('Error fetching data sources:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data sources",
        variant: "destructive",
      });
    }
  };

  const fetchDataSourceTypes = async () => {
    try {
      const response = await apiRequest('/api/data-sources/types/available');
      setDataSourceTypes(response.types);
    } catch (error) {
      console.error('Error fetching data source types:', error);
    }
  };

  const fetchDatabaseTypes = async () => {
    try {
      const response = await apiRequest('/api/data-sources/databases/types');
      setDatabaseTypes(response.database_types);
    } catch (error) {
      console.error('Error fetching database types:', error);
    }
  };

  const testConnection = async (sourceId: string) => {
    setLoading(true);
    try {
      const response = await apiRequest(`/api/data-sources/${sourceId}/test`, {
        method: 'POST'
      });
      
      setTestResults(prev => ({
        ...prev,
        [sourceId]: response
      }));
      
      toast({
        title: response.success ? "Connection Successful" : "Connection Failed",
        description: response.message,
        variant: response.success ? "default" : "destructive",
      });
      
      // Refresh data sources to get updated status
      fetchDataSources();
    } catch (error) {
      console.error('Error testing connection:', error);
      toast({
        title: "Error",
        description: "Failed to test connection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const connectToSource = async (sourceId: string) => {
    setLoading(true);
    try {
      const response = await apiRequest(`/api/data-sources/${sourceId}/connect`, {
        method: 'POST'
      });
      
      toast({
        title: response.success ? "Connected" : "Connection Failed",
        description: response.message,
        variant: response.success ? "default" : "destructive",
      });
      
      fetchDataSources();
    } catch (error) {
      console.error('Error connecting to source:', error);
      toast({
        title: "Error",
        description: "Failed to connect to data source",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnectFromSource = async (sourceId: string) => {
    setLoading(true);
    try {
      const response = await apiRequest(`/api/data-sources/${sourceId}/disconnect`, {
        method: 'POST'
      });
      
      toast({
        title: response.success ? "Disconnected" : "Disconnection Failed",
        description: response.message,
        variant: response.success ? "default" : "destructive",
      });
      
      fetchDataSources();
    } catch (error) {
      console.error('Error disconnecting from source:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect from data source",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatistics = async (sourceId: string) => {
    try {
      const response = await apiRequest(`/api/data-sources/${sourceId}/stats`);
      setStatistics(prev => ({
        ...prev,
        [sourceId]: response.statistics
      }));
    } catch (error) {
      console.error('Error getting statistics:', error);
    }
  };

  const createDataSource = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/data-sources/', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      toast({
        title: "Success",
        description: "Data source created successfully",
      });
      
      setIsCreateDialogOpen(false);
      resetForm();
      fetchDataSources();
    } catch (error) {
      console.error('Error creating data source:', error);
      toast({
        title: "Error",
        description: "Failed to create data source",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateDataSource = async () => {
    if (!selectedSource) return;
    
    setLoading(true);
    try {
      const response = await apiRequest(`/api/data-sources/${selectedSource.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      
      toast({
        title: "Success",
        description: "Data source updated successfully",
      });
      
      setIsEditDialogOpen(false);
      resetForm();
      fetchDataSources();
    } catch (error) {
      console.error('Error updating data source:', error);
      toast({
        title: "Error",
        description: "Failed to update data source",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteDataSource = async (sourceId: string) => {
    if (!confirm('Are you sure you want to delete this data source?')) return;
    
    setLoading(true);
    try {
      const response = await apiRequest(`/api/data-sources/${sourceId}`, {
        method: 'DELETE'
      });
      
      toast({
        title: "Success",
        description: "Data source deleted successfully",
      });
      
      fetchDataSources();
    } catch (error) {
      console.error('Error deleting data source:', error);
      toast({
        title: "Error",
        description: "Failed to delete data source",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      type: '',
      description: '',
      is_active: true,
      is_default: false,
      config: {},
      metadata: {}
    });
    setSelectedSource(null);
  };

  const openEditDialog = (source: DataSource) => {
    setSelectedSource(source);
    setFormData({
      id: source.id,
      name: source.name,
      type: source.type,
      description: source.description,
      is_active: source.is_active,
      is_default: source.is_default,
      config: {},
      metadata: {}
    });
    setIsEditDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'testing':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'testing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <Database className="h-5 w-5" />;
      case 'api':
      case 'gst_portal':
      case 'mca_portal':
        return <Globe className="h-5 w-5" />;
      case 'file_system':
        return <FolderOpen className="h-5 w-5" />;
      case 'cloud_storage':
        return <Cloud className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  const renderConfigForm = () => {
    if (!formData.type) return null;

    switch (formData.type) {
      case 'database':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="host">Host</Label>
                <Input
                  id="host"
                  placeholder="localhost"
                  value={formData.config.host || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, host: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  placeholder="5432"
                  value={formData.config.port || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, port: parseInt(e.target.value) }
                  })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="database">Database</Label>
              <Input
                id="database"
                placeholder="database_name"
                value={formData.config.database || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, database: e.target.value }
                })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="username"
                  value={formData.config.username || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, username: e.target.value }
                  })}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="password"
                  value={formData.config.password || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, password: e.target.value }
                  })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="database_type">Database Type</Label>
              <Select
                value={formData.config.database_type || ''}
                onValueChange={(value) => setFormData({
                  ...formData,
                  config: { ...formData.config, database_type: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select database type" />
                </SelectTrigger>
                <SelectContent>
                  {databaseTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'api':
      case 'gst_portal':
      case 'mca_portal':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="base_url">Base URL</Label>
              <Input
                id="base_url"
                placeholder="https://api.example.com"
                value={formData.config.base_url || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, base_url: e.target.value }
                })}
              />
            </div>
            <div>
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="password"
                placeholder="Your API key"
                value={formData.config.api_key || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, api_key: e.target.value }
                })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="auth_type">Authentication Type</Label>
                <Select
                  value={formData.config.auth_type || 'api_key'}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    config: { ...formData.config, auth_type: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="api_key">API Key</SelectItem>
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                    <SelectItem value="basic">Basic Auth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="timeout">Timeout (seconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  placeholder="30"
                  value={formData.config.timeout || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    config: { ...formData.config, timeout: parseInt(e.target.value) }
                  })}
                />
              </div>
            </div>
          </div>
        );
      case 'file_system':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="base_path">Base Path</Label>
              <Input
                id="base_path"
                placeholder="/path/to/files"
                value={formData.config.base_path || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, base_path: e.target.value }
                })}
              />
            </div>
            <div>
              <Label htmlFor="access_mode">Access Mode</Label>
              <Select
                value={formData.config.access_mode || 'read_write'}
                onValueChange={(value) => setFormData({
                  ...formData,
                  config: { ...formData.config, access_mode: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="read_only">Read Only</SelectItem>
                  <SelectItem value="read_write">Read Write</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="file_extensions">Allowed Extensions (comma-separated)</Label>
              <Input
                id="file_extensions"
                placeholder=".pdf,.xlsx,.csv"
                value={formData.config.file_extensions?.join(',') || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { 
                    ...formData.config, 
                    file_extensions: e.target.value.split(',').map(ext => ext.trim())
                  }
                })}
              />
            </div>
          </div>
        );
      default:
        return (
          <div>
            <Label htmlFor="custom_config">Configuration (JSON)</Label>
            <Textarea
              id="custom_config"
              placeholder='{"key": "value"}'
              value={JSON.stringify(formData.config, null, 2)}
              onChange={(e) => {
                try {
                  const config = JSON.parse(e.target.value);
                  setFormData({ ...formData, config });
                } catch (error) {
                  // Invalid JSON, keep as is
                }
              }}
              rows={10}
            />
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <PageLayout title="Data Source Configuration">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Data Source Configuration">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Data Source Configuration
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Configure and manage data sources for the QRT platform
            </p>
          </div>
          <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={fetchDataSources}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Data Source
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Data Source</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="id">ID</Label>
                        <Input
                          id="id"
                          placeholder="unique_id"
                          value={formData.id}
                          onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          placeholder="Data Source Name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="type">Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value, config: {} })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select data source type" />
                        </SelectTrigger>
                        <SelectContent>
                          {dataSourceTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Description of the data source"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_active"
                          checked={formData.is_active}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        />
                        <Label htmlFor="is_active">Active</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_default"
                          checked={formData.is_default}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                        />
                        <Label htmlFor="is_default">Default</Label>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3">Configuration</h4>
                      {renderConfigForm()}
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createDataSource} disabled={loading}>
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Create
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {dataSources.map((source) => (
              <Card key={source.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        {getTypeIcon(source.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{source.name}</CardTitle>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {source.type.replace('_', ' ').toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {source.is_default && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                      <Badge className={getStatusColor(source.status)}>
                        {getStatusIcon(source.status)}
                        <span className="ml-1">{source.status}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {source.description}
                  </p>
                  
                  {source.error_message && (
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {source.error_message}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Last Tested:</span>
                      <span>
                        {source.last_tested 
                          ? new Date(source.last_tested).toLocaleString()
                          : 'Never'
                        }
                      </span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => testConnection(source.id)}
                        disabled={loading}
                      >
                        <TestTube className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                      
                      {source.status === 'connected' ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => disconnectFromSource(source.id)}
                          disabled={loading}
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          Disconnect
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => connectToSource(source.id)}
                          disabled={loading}
                        >
                          <Zap className="h-4 w-4 mr-1" />
                          Connect
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => getStatistics(source.id)}
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Stats
                      </Button>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openEditDialog(source)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      
                      {!source.is_default && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteDataSource(source.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
    </PageLayout>
  );
}