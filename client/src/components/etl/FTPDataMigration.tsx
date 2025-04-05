import React, { useState, useEffect } from 'react';
import { ftpDataConnector, FTPConnectionConfig, FTPDirectoryItem } from '../../services/etl/FTPDataConnector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, FolderOpen, File, ArrowLeft, Download, RefreshCw, Database } from 'lucide-react';
import { apiRequest } from '../../lib/queryClient';
import { toast } from '../../hooks/use-toast';

/**
 * Component for FTP data migration
 * Allows connecting to FTP servers, browsing directories, and importing data
 */
export const FTPDataMigration: React.FC = () => {
  // Connection state
  const [config, setConfig] = useState<FTPConnectionConfig>({
    host: 'ftp.spatialest.com',
    port: 21,
    user: '',
    password: '',
    secure: false
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Directory browsing state
  const [currentPath, setCurrentPath] = useState<string>('/');
  const [isLoading, setIsLoading] = useState(false);
  const [directoryItems, setDirectoryItems] = useState<FTPDirectoryItem[]>([]);
  const [pathHistory, setPathHistory] = useState<string[]>([]);
  
  // File handling state
  const [selectedFile, setSelectedFile] = useState<FTPDirectoryItem | null>(null);
  const [fileType, setFileType] = useState<string>('csv');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  
  // Input change handlers
  const handleConfigChange = (field: keyof FTPConnectionConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };
  
  // Connect to FTP server
  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      await ftpDataConnector.connect(config);
      setIsConnected(true);
      loadCurrentDirectory();
      toast({
        title: 'Connected to FTP server',
        description: `Successfully connected to ${config.host}`,
      });
    } catch (error) {
      setConnectionError((error as Error).message || 'Failed to connect to FTP server');
      toast({
        title: 'Connection failed',
        description: (error as Error).message || 'Could not connect to FTP server',
        variant: 'destructive'
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Disconnect from FTP server
  const handleDisconnect = async () => {
    try {
      await ftpDataConnector.disconnect();
      setIsConnected(false);
      setDirectoryItems([]);
      setCurrentPath('/');
      setPathHistory([]);
      setSelectedFile(null);
      setPreviewData(null);
      toast({
        title: 'Disconnected',
        description: 'Successfully disconnected from FTP server',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Error disconnecting from server',
        variant: 'destructive'
      });
    }
  };
  
  // Load current directory
  const loadCurrentDirectory = async () => {
    setIsLoading(true);
    try {
      const items = await ftpDataConnector.listCurrentDirectory();
      setDirectoryItems(items);
      const pwd = await ftpDataConnector.getCurrentDirectory();
      setCurrentPath(pwd);
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to load directory contents',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Navigate to a directory
  const navigateToDirectory = async (item: FTPDirectoryItem) => {
    if (!item.isDirectory) return;
    
    setIsLoading(true);
    try {
      setPathHistory(prev => [...prev, currentPath]);
      await ftpDataConnector.changeDirectory(item.name);
      loadCurrentDirectory();
    } catch (error) {
      toast({
        title: 'Navigation error',
        description: (error as Error).message || `Failed to navigate to ${item.name}`,
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };
  
  // Navigate back to previous directory
  const navigateBack = async () => {
    if (pathHistory.length === 0) return;
    
    setIsLoading(true);
    try {
      const previousPath = pathHistory[pathHistory.length - 1];
      await ftpDataConnector.changeDirectory('..');
      setPathHistory(prev => prev.slice(0, -1));
      loadCurrentDirectory();
    } catch (error) {
      toast({
        title: 'Navigation error',
        description: (error as Error).message || 'Failed to navigate back',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };
  
  // Select a file for preview/import
  const selectFile = (item: FTPDirectoryItem) => {
    if (item.isDirectory) return;
    
    setSelectedFile(item === selectedFile ? null : item);
    setPreviewData(null);
  };
  
  // Preview file contents
  const previewFile = async () => {
    if (!selectedFile) return;
    
    setIsDownloading(true);
    try {
      const buffer = await ftpDataConnector.downloadFile(selectedFile.name);
      const parsedData = await ftpDataConnector.parseFileData(buffer, fileType);
      
      // Limit preview to 10 items
      setPreviewData(Array.isArray(parsedData) ? parsedData.slice(0, 10) : [parsedData]);
      
      toast({
        title: 'File preview loaded',
        description: `Preview of ${selectedFile.name} is ready`,
      });
    } catch (error) {
      toast({
        title: 'Preview error',
        description: (error as Error).message || 'Failed to preview file',
        variant: 'destructive'
      });
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Import file data to the system
  const importData = async () => {
    if (!selectedFile) return;
    
    setIsImporting(true);
    try {
      const buffer = await ftpDataConnector.downloadFile(selectedFile.name);
      const parsedData = await ftpDataConnector.parseFileData(buffer, fileType);
      
      // If it's property data, send to the property import endpoint
      const response = await apiRequest(
        'POST',
        '/api/etl/import/properties', 
        { 
          data: parsedData,
          source: `ftp://${config.host}${currentPath}${selectedFile.name}`,
          fileType
        }
      );
      
      toast({
        title: 'Import successful',
        description: `Imported ${parsedData.length} records from ${selectedFile.name}`,
      });
    } catch (error) {
      toast({
        title: 'Import error',
        description: (error as Error).message || 'Failed to import data',
        variant: 'destructive'
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Update connection status if the FTP client state changes
  useEffect(() => {
    const checkConnection = () => {
      const active = ftpDataConnector.isConnectionActive();
      if (isConnected !== active) {
        setIsConnected(active);
      }
    };
    
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, [isConnected]);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">FTP Data Migration</h2>
      <p className="text-gray-600">
        Connect to the FTP server (ftp.spatialest.com) to browse and import property data files.
      </p>
      
      {!isConnected ? (
        <div className="space-y-4 border p-4 rounded-md">
          <h3 className="text-lg font-medium">Connect to FTP Server</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="host">Host</Label>
              <Input 
                id="host" 
                value={config.host} 
                onChange={(e) => handleConfigChange('host', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="port">Port</Label>
              <Input 
                id="port" 
                type="number" 
                value={config.port} 
                onChange={(e) => handleConfigChange('port', parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="user">Username</Label>
              <Input 
                id="user" 
                value={config.user} 
                onChange={(e) => handleConfigChange('user', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={config.password} 
                onChange={(e) => handleConfigChange('password', e.target.value)}
              />
            </div>
            <div className="col-span-2 flex items-center space-x-2">
              <Checkbox 
                id="secure" 
                checked={config.secure} 
                onCheckedChange={(checked) => handleConfigChange('secure', checked)}
              />
              <Label htmlFor="secure">Use secure connection (FTPS)</Label>
            </div>
          </div>
          
          {connectionError && (
            <Alert variant="destructive">
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>{connectionError}</AlertDescription>
            </Alert>
          )}
          
          <Button 
            onClick={handleConnect} 
            disabled={isConnecting}
            className="w-full"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">
              Connected to: {config.host}
              {config.user ? ` as ${config.user}` : ''}
            </h3>
            <Button variant="outline" onClick={handleDisconnect}>
              Disconnect
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-100 p-2 rounded">
            <span>Current path: {currentPath}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={loadCurrentDirectory}
              disabled={isLoading}
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {pathHistory.length > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={navigateBack}
                disabled={isLoading}
                title="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="border rounded-md min-h-[300px] max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : directoryItems.length === 0 ? (
              <div className="flex justify-center items-center h-full text-gray-500">
                No files or directories found
              </div>
            ) : (
              <ul className="divide-y">
                {directoryItems.map((item, index) => (
                  <li 
                    key={index} 
                    className={`
                      p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer
                      ${selectedFile?.name === item.name && !item.isDirectory ? 'bg-blue-50' : ''}
                    `}
                    onClick={() => item.isDirectory ? navigateToDirectory(item) : selectFile(item)}
                  >
                    <div className="flex items-center space-x-3">
                      {item.isDirectory ? (
                        <FolderOpen className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <File className="h-5 w-5 text-blue-500" />
                      )}
                      <span>{item.name}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {!item.isDirectory && formatFileSize(item.size)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {selectedFile && !selectedFile.isDirectory && (
            <div className="border p-4 rounded-md">
              <h4 className="font-medium mb-2">Selected File: {selectedFile.name}</h4>
              <div className="flex flex-wrap gap-4 mb-4">
                <div>
                  <Label htmlFor="fileType">File Type</Label>
                  <select 
                    id="fileType"
                    className="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                  >
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                    <option value="xml">XML</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={previewFile}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Preview Data
                      </>
                    )}
                  </Button>
                  <Button 
                    onClick={importData}
                    disabled={isImporting || !previewData}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Database className="mr-2 h-4 w-4" />
                        Import Data
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {previewData && (
                <div>
                  <h5 className="font-medium mb-2">Data Preview (first 10 records)</h5>
                  <div className="border rounded overflow-x-auto">
                    {previewData.length > 0 ? (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(previewData[0]).map((key) => (
                              <th 
                                key={key}
                                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {previewData.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {Object.values(row).map((value: any, colIndex) => (
                                <td 
                                  key={colIndex}
                                  className="px-3 py-2 whitespace-nowrap text-sm text-gray-500"
                                >
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No data available for preview
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FTPDataMigration;