/**
 * ETLDashboard.tsx
 * 
 * Dashboard component for ETL Management
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Clock, AlertTriangle, Play, Pause, RefreshCw } from 'lucide-react';

const ETLDashboard: React.FC = () => {
  // Mock data for demonstration
  const jobStatistics = {
    total: 12,
    running: 2,
    completed: 8,
    failed: 1,
    scheduled: 1
  };

  const recentJobs = [
    { id: 1, name: 'Daily Property Import', status: 'completed', lastRun: '2025-04-04T08:00:00', duration: '00:05:32', records: 1250 },
    { id: 2, name: 'Weekly Market Analysis', status: 'running', lastRun: '2025-04-04T09:15:00', duration: '00:12:45', records: 782 },
    { id: 3, name: 'Property Value Update', status: 'failed', lastRun: '2025-04-03T22:30:00', duration: '00:01:15', records: 0 },
    { id: 4, name: 'Neighborhood Data Sync', status: 'completed', lastRun: '2025-04-03T18:45:00', duration: '00:08:20', records: 456 },
    { id: 5, name: 'Census Data Import', status: 'completed', lastRun: '2025-04-02T14:20:00', duration: '00:15:40', records: 2350 }
  ];

  const alerts = [
    { id: 1, type: 'error', message: 'Property Value Update job failed: Database connection error', timestamp: '2025-04-03T22:31:15' },
    { id: 2, type: 'warning', message: 'Weekly Market Analysis taking longer than usual', timestamp: '2025-04-04T09:25:00' },
    { id: 3, type: 'info', message: 'Census Data Import completed with 12 validation warnings', timestamp: '2025-04-02T14:36:10' }
  ];

  // Status badge color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'scheduled': return 'bg-amber-500';
      default: return 'bg-gray-500';
    }
  };

  // Status icon mapping
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'running': return <Play className="h-4 w-4 text-blue-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-amber-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{jobStatistics.total}</div>
            <p className="text-muted-foreground text-sm mt-1">Active ETL Jobs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Running</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{jobStatistics.running}</div>
            <p className="text-muted-foreground text-sm mt-1">Currently Running Jobs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{jobStatistics.completed}</div>
            <p className="text-muted-foreground text-sm mt-1">Successfully Completed Jobs</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{jobStatistics.failed}</div>
            <p className="text-muted-foreground text-sm mt-1">Failed Jobs (Last 24h)</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Jobs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Jobs</CardTitle>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <CardDescription>Recent ETL job executions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobs.map(job => (
                <div key={job.id} className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center">
                    {getStatusIcon(job.status)}
                    <div className="ml-2">
                      <div className="font-medium">{job.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Last run: {new Date(job.lastRun).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      className={`${getStatusColor(job.status)} text-white`}
                    >
                      {job.status}
                    </Badge>
                    <div className="text-sm mt-1">{job.duration} • {job.records.toLocaleString()} records</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="ml-auto">View All Jobs</Button>
          </CardFooter>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Alerts & Notifications</CardTitle>
            <CardDescription>Recent system alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts.map(alert => (
                <div key={alert.id} className="flex items-start space-x-2 border-b pb-3">
                  {alert.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />}
                  {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />}
                  {alert.type === 'info' && <AlertTriangle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />}
                  <div>
                    <div className="font-medium text-sm">{alert.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="ml-auto">View All Alerts</Button>
          </CardFooter>
        </Card>
      </div>

      {/* Jobs Overview */}
      <Card>
        <CardHeader>
          <CardTitle>ETL Jobs Overview</CardTitle>
          <CardDescription>Job statuses and execution metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Job Completion Rate */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Job Completion Rate</span>
                <span className="text-sm font-medium">
                  {Math.round((jobStatistics.completed / (jobStatistics.completed + jobStatistics.failed)) * 100)}%
                </span>
              </div>
              <Progress value={(jobStatistics.completed / (jobStatistics.completed + jobStatistics.failed)) * 100} className="h-2" />
            </div>
            
            {/* System Load */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">System Load</span>
                <span className="text-sm font-medium">
                  {Math.round((jobStatistics.running / jobStatistics.total) * 100)}%
                </span>
              </div>
              <Progress value={(jobStatistics.running / jobStatistics.total) * 100} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ETLDashboard;