import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { AlertCircle, Database, Code, Settings, Calendar, Activity, Calculator, Play, Pause, RefreshCw, Brain } from 'lucide-react';
import ETLDataSourceManager from '@/components/automation/ETLDataSourceManager';
import ETLTransformationEditor from '@/components/automation/ETLTransformationEditor';
import ETLOptimizationPanel from '@/components/automation/ETLOptimizationPanel';

export default function ETLPage() {
  const [activeTab, setActiveTab] = useState<string>('sources');
  const [isJobRunning, setIsJobRunning] = useState<boolean>(false);
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);
  
  const handleStartJob = () => {
    setIsJobRunning(true);
    setLastRunTime(new Date().toLocaleString());
    
    // Simulate job completion after 5 seconds
    setTimeout(() => {
      setIsJobRunning(false);
    }, 5000);
  };
  
  const handleStopJob = () => {
    setIsJobRunning(false);
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <PageHeader 
        heading="ETL Manager" 
        subheading="Connect, transform, and optimize data sources for geospatial analysis" 
      />
      
      <div className="grid grid-cols-12 gap-6">
        {/* ETL Status Dashboard */}
        <Card className="col-span-12">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">ETL System Status</CardTitle>
            <CardDescription>
              Current status of ETL jobs and data processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-lg flex items-center">
                    <Database className="h-5 w-5 mr-2 text-blue-500" />
                    Data Sources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">4</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Connected sources
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                    <div>
                      <div className="font-medium">Property DB</div>
                      <div className="text-green-600">Connected</div>
                    </div>
                    <div>
                      <div className="font-medium">GIS API</div>
                      <div className="text-green-600">Connected</div>
                    </div>
                    <div>
                      <div className="font-medium">Demographics</div>
                      <div className="text-green-600">Connected</div>
                    </div>
                    <div>
                      <div className="font-medium">Results Cache</div>
                      <div className="text-green-600">Connected</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-lg flex items-center">
                    <Code className="h-5 w-5 mr-2 text-purple-500" />
                    Transformations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">8</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Active transformations
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                    <div>
                      <div className="font-medium">Data Cleaning</div>
                      <div className="text-green-600">2 Active</div>
                    </div>
                    <div>
                      <div className="font-medium">Analysis Prep</div>
                      <div className="text-gray-500">4 Active</div>
                    </div>
                    <div>
                      <div className="font-medium">Reporting</div>
                      <div className="text-gray-500">1 Active</div>
                    </div>
                    <div>
                      <div className="font-medium">Integration</div>
                      <div className="text-gray-500">1 Active</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-green-500" />
                    Scheduled Jobs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {isJobRunning ? (
                      <div className="flex items-center">
                        <span>1</span>
                        <div className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                          <Activity className="h-3 w-3 mr-1 animate-pulse" />
                          Running
                        </div>
                      </div>
                    ) : (
                      <span>3</span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {isJobRunning ? 'Job in progress' : 'Scheduled jobs'}
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between items-center">
                      <Button
                        variant={isJobRunning ? "destructive" : "default"}
                        size="sm"
                        onClick={isJobRunning ? handleStopJob : handleStartJob}
                        className="w-full"
                      >
                        {isJobRunning ? (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            Stop Job
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Run Job
                          </>
                        )}
                      </Button>
                    </div>
                    {lastRunTime && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Last run: {lastRunTime}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
        
        {/* Main ETL Management Tabs */}
        <div className="col-span-12">
          <Tabs 
            defaultValue={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sources" className="flex items-center justify-center">
                <Database className="h-4 w-4 mr-2" />
                Data Sources
              </TabsTrigger>
              <TabsTrigger value="transformations" className="flex items-center justify-center">
                <Code className="h-4 w-4 mr-2" />
                Transformations
              </TabsTrigger>
              <TabsTrigger value="scheduling" className="flex items-center justify-center">
                <Calendar className="h-4 w-4 mr-2" />
                Scheduling
              </TabsTrigger>
              <TabsTrigger value="optimization" className="flex items-center justify-center">
                <Brain className="h-4 w-4 mr-2" />
                AI Optimization
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="sources">
              <ETLDataSourceManager className="mt-6" />
            </TabsContent>
            
            <TabsContent value="transformations">
              <ETLTransformationEditor className="mt-6" />
            </TabsContent>
            
            <TabsContent value="scheduling">
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    ETL Job Scheduler
                  </CardTitle>
                  <CardDescription>
                    Schedule and manage automated ETL jobs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Job Scheduler</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      The ETL Job Scheduler allows you to automate data processing tasks on a regular schedule. 
                      Define when and how often your ETL jobs should run.
                    </p>
                    <div className="flex gap-4">
                      <Button variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        View Schedule
                      </Button>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Job
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="optimization">
              <ETLOptimizationPanel className="mt-6" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}