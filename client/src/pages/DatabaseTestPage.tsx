import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader2, Database, ServerCrash, Check, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SQLServerConnectionConfig, ODBCConnectionConfig } from '../services/etl/ETLTypes';

const DatabaseTestPage: React.FC = () => {
  // SQL Server state
  const [sqlConfig, setSqlConfig] = useState<SQLServerConnectionConfig>({
    server: '',
    database: '',
    username: '',
    password: '',
    port: 1433,
    encrypt: true,
    trustServerCertificate: false
  });
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT TOP 10 * FROM INFORMATION_SCHEMA.TABLES');
  
  // ODBC state
  const [odbcConfig, setOdbcConfig] = useState<ODBCConnectionConfig>({
    connectionString: '',
    username: '',
    password: ''
  });
  const [odbcQuery, setOdbcQuery] = useState<string>('SELECT TOP 10 * FROM INFORMATION_SCHEMA.TABLES');
  
  // Results and status
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [odbcResult, setOdbcResult] = useState<any>(null);
  const [sqlLoading, setSqlLoading] = useState<boolean>(false);
  const [odbcLoading, setOdbcLoading] = useState<boolean>(false);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [odbcError, setOdbcError] = useState<string | null>(null);

  // Test SQL Server connection
  const testSqlServerConnection = async () => {
    setSqlLoading(true);
    setSqlError(null);
    setSqlResult(null);
    
    try {
      const response = await fetch('/api/sqlserver/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config: sqlConfig,
          query: sqlQuery
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to execute SQL Server query');
      }
      
      const data = await response.json();
      setSqlResult(data);
    } catch (error) {
      console.error('SQL Server test error:', error);
      setSqlError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setSqlLoading(false);
    }
  };
  
  // Test ODBC connection
  const testOdbcConnection = async () => {
    setOdbcLoading(true);
    setOdbcError(null);
    setOdbcResult(null);
    
    try {
      const response = await fetch('/api/odbc/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          config: odbcConfig,
          query: odbcQuery
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Failed to execute ODBC query');
      }
      
      const data = await response.json();
      setOdbcResult(data);
    } catch (error) {
      console.error('ODBC test error:', error);
      setOdbcError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setOdbcLoading(false);
    }
  };

  // Handle SQL Server form input changes
  const handleSqlConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSqlConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'port' ? parseInt(value) || 1433 : value)
    }));
  };
  
  // Handle ODBC form input changes
  const handleOdbcConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOdbcConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Format and display results
  const formatResults = (results: any) => {
    if (!results) return null;
    
    return (
      <div className="mt-4">
        <h3 className="text-md font-semibold mb-2">Results:</h3>
        <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md">
          <p className="text-sm mb-1">Records affected: {results.rowsAffected?.join(', ') || 0}</p>
          <p className="text-sm mb-3">Record count: {results.recordset?.length || 0}</p>
          
          {results.recordset && results.recordset.length > 0 && (
            <div className="overflow-auto max-h-96">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-slate-200 dark:bg-slate-800">
                  <tr>
                    {Object.keys(results.recordset[0]).map((key) => (
                      <th key={key} className="p-2 text-left border border-slate-300 dark:border-slate-700">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.recordset.map((row: any, i: number) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-slate-950' : 'bg-slate-50 dark:bg-slate-900'}>
                      {Object.values(row).map((value: any, j: number) => (
                        <td key={j} className="p-2 border border-slate-300 dark:border-slate-700">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Database Connection Testing</h1>
      
      <Tabs defaultValue="sqlserver" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sqlserver">
            <Database className="mr-2 h-4 w-4" /> 
            SQL Server
          </TabsTrigger>
          <TabsTrigger value="odbc">
            <ServerCrash className="mr-2 h-4 w-4" /> 
            ODBC
          </TabsTrigger>
        </TabsList>
        
        {/* SQL Server Tab */}
        <TabsContent value="sqlserver">
          <Card>
            <CardHeader>
              <CardTitle>Test SQL Server Connection</CardTitle>
              <CardDescription>
                Enter your SQL Server connection details and execute a test query
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="server">Server</Label>
                    <Input 
                      id="server"
                      name="server"
                      placeholder="e.g., localhost or 192.168.1.100"
                      value={sqlConfig.server}
                      onChange={handleSqlConfigChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input 
                      id="port"
                      name="port"
                      type="number"
                      placeholder="1433"
                      value={sqlConfig.port}
                      onChange={handleSqlConfigChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="database">Database</Label>
                  <Input 
                    id="database"
                    name="database"
                    placeholder="e.g., master"
                    value={sqlConfig.database}
                    onChange={handleSqlConfigChange}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username"
                      name="username"
                      placeholder="e.g., sa"
                      value={sqlConfig.username}
                      onChange={handleSqlConfigChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter password"
                      value={sqlConfig.password}
                      onChange={handleSqlConfigChange}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-8">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="encrypt"
                      name="encrypt"
                      checked={sqlConfig.encrypt}
                      onCheckedChange={(checked) => 
                        setSqlConfig(prev => ({ ...prev, encrypt: checked }))
                      }
                    />
                    <Label htmlFor="encrypt">Encrypt</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="trustServerCertificate"
                      name="trustServerCertificate"
                      checked={sqlConfig.trustServerCertificate}
                      onCheckedChange={(checked) => 
                        setSqlConfig(prev => ({ ...prev, trustServerCertificate: checked }))
                      }
                    />
                    <Label htmlFor="trustServerCertificate">Trust Server Certificate</Label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sqlQuery">SQL Query</Label>
                  <Textarea 
                    id="sqlQuery"
                    placeholder="Enter SQL query"
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    rows={3}
                  />
                </div>
              </form>
              
              {sqlError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{sqlError}</AlertDescription>
                </Alert>
              )}
              
              {sqlResult && formatResults(sqlResult)}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={testSqlServerConnection} 
                disabled={sqlLoading || !sqlConfig.server || !sqlConfig.database}
              >
                {sqlLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Execute Query
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* ODBC Tab */}
        <TabsContent value="odbc">
          <Card>
            <CardHeader>
              <CardTitle>Test ODBC Connection</CardTitle>
              <CardDescription>
                Enter your ODBC connection details and execute a test query
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="connectionString">Connection String</Label>
                  <Input 
                    id="connectionString"
                    name="connectionString"
                    placeholder="e.g., Driver={SQL Server};Server=server_name;Database=database_name;Trusted_Connection=yes;"
                    value={odbcConfig.connectionString}
                    onChange={handleOdbcConfigChange}
                  />
                  <p className="text-xs text-slate-500">
                    Full connection string including driver, server, and authentication method
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="odbcUsername">Username (Optional)</Label>
                    <Input 
                      id="odbcUsername"
                      name="username"
                      placeholder="If not in connection string"
                      value={odbcConfig.username || ''}
                      onChange={handleOdbcConfigChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="odbcPassword">Password (Optional)</Label>
                    <Input 
                      id="odbcPassword"
                      name="password"
                      type="password"
                      placeholder="If not in connection string"
                      value={odbcConfig.password || ''}
                      onChange={handleOdbcConfigChange}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="odbcQuery">SQL Query</Label>
                  <Textarea 
                    id="odbcQuery"
                    placeholder="Enter SQL query"
                    value={odbcQuery}
                    onChange={(e) => setOdbcQuery(e.target.value)}
                    rows={3}
                  />
                </div>
              </form>
              
              {odbcError && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{odbcError}</AlertDescription>
                </Alert>
              )}
              
              {odbcResult && formatResults(odbcResult)}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={testOdbcConnection} 
                disabled={odbcLoading || !odbcConfig.connectionString}
              >
                {odbcLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <ServerCrash className="mr-2 h-4 w-4" />
                    Execute Query
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DatabaseTestPage;