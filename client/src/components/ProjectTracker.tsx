import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Milestone, 
  CheckCircle2, 
  GitPullRequestDraft, 
  GitMerge, 
  Clock, 
  AlertCircle, 
  BarChart,
  Plus
} from 'lucide-react';

// Define our project task types
interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  category: string;
  assignee?: string;
  dueDate?: Date;
  dependencies?: string[];
  created: Date;
  updated: Date;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  progress: number;
  dueDate?: Date;
  tasks: TaskItem[];
}

interface Category {
  id: string;
  name: string;
  color: string;
}

// Sample categories
const projectCategories: Category[] = [
  { id: '1', name: 'Core ETL', color: 'blue' },
  { id: '2', name: 'UI Components', color: 'green' },
  { id: '3', name: 'Data Validation', color: 'purple' },
  { id: '4', name: 'Testing', color: 'orange' },
  { id: '5', name: 'Documentation', color: 'gray' },
  { id: '6', name: 'Error Handling', color: 'red' },
  { id: '7', name: 'Database Integration', color: 'teal' },
  { id: '8', name: 'Security', color: 'amber' },
  { id: '9', name: 'Performance', color: 'indigo' },
];

// Default initial milestones and tasks
const initialMilestones: Milestone[] = [
  {
    id: '1',
    title: 'ETL Core Components',
    description: 'Implement the core ETL pipeline components and services',
    progress: 90,
    tasks: [
      {
        id: '1-1',
        title: 'ETLPipelineManager Implementation',
        description: 'Create the manager class that orchestrates ETL operations',
        status: 'completed',
        priority: 'high',
        category: '1',
        created: new Date(2023, 3, 1),
        updated: new Date(2023, 3, 5)
      },
      {
        id: '1-2',
        title: 'DataConnector Service',
        description: 'Implement data source and destination connection handlers',
        status: 'completed',
        priority: 'high',
        category: '1',
        created: new Date(2023, 3, 2),
        updated: new Date(2023, 3, 6)
      },
      {
        id: '1-3',
        title: 'Transformation Service',
        description: 'Build data transformation capabilities (filter, map, etc.)',
        status: 'completed',
        priority: 'high',
        category: '1',
        created: new Date(2023, 3, 3),
        updated: new Date(2023, 3, 7)
      },
      {
        id: '1-4',
        title: 'Scheduler Implementation',
        description: 'Create the job scheduling system with various frequencies',
        status: 'completed',
        priority: 'medium',
        category: '1',
        created: new Date(2023, 3, 4),
        updated: new Date(2023, 3, 8)
      },
      {
        id: '1-5',
        title: 'AlertService Implementation',
        description: 'Build the notification and alerting subsystem',
        status: 'completed',
        priority: 'medium',
        category: '1',
        created: new Date(2023, 3, 5),
        updated: new Date(2023, 3, 9)
      },
      {
        id: '1-6',
        title: 'Fix Map constructor in browser environment',
        description: 'Ensure compatibility with browser JS engines for Map usage',
        status: 'in-progress',
        priority: 'high',
        category: '6',
        created: new Date(2023, 3, 15),
        updated: new Date(2023, 3, 15)
      }
    ]
  },
  {
    id: '2',
    title: 'ETL Management UI',
    description: 'Create the user interface for managing ETL processes',
    progress: 75,
    tasks: [
      {
        id: '2-1',
        title: 'ETL Dashboard Component',
        description: 'Main dashboard showing ETL status and metrics',
        status: 'completed',
        priority: 'high',
        category: '2',
        created: new Date(2023, 3, 10),
        updated: new Date(2023, 3, 12)
      },
      {
        id: '2-2',
        title: 'Job Management UI',
        description: 'Interface for creating, updating, and scheduling jobs',
        status: 'completed',
        priority: 'high',
        category: '2',
        created: new Date(2023, 3, 11),
        updated: new Date(2023, 3, 13)
      },
      {
        id: '2-3',
        title: 'Data Source Configuration UI',
        description: 'Interface for managing data sources and connections',
        status: 'in-progress',
        priority: 'medium',
        category: '2',
        created: new Date(2023, 3, 12),
        updated: new Date(2023, 3, 14)
      },
      {
        id: '2-4',
        title: 'Transformation Rule Editor',
        description: 'UI for creating and editing transformation rules',
        status: 'planned',
        priority: 'medium',
        category: '2',
        created: new Date(2023, 3, 13),
        updated: new Date(2023, 3, 13)
      }
    ]
  },
  {
    id: '3',
    title: 'Data Quality & Validation',
    description: 'Implement data quality checks and validation services',
    progress: 60,
    tasks: [
      {
        id: '3-1',
        title: 'Data Quality Service',
        description: 'Create service for analyzing and reporting data quality',
        status: 'completed',
        priority: 'high',
        category: '3',
        created: new Date(2023, 3, 14),
        updated: new Date(2023, 3, 16)
      },
      {
        id: '3-2',
        title: 'Schema Validation',
        description: 'Implement schema-based validation for data sources',
        status: 'in-progress',
        priority: 'medium',
        category: '3',
        created: new Date(2023, 3, 15),
        updated: new Date(2023, 3, 17)
      },
      {
        id: '3-3',
        title: 'Anomaly Detection',
        description: 'Add anomaly detection for identifying data issues',
        status: 'planned',
        priority: 'medium',
        category: '3',
        created: new Date(2023, 3, 16),
        updated: new Date(2023, 3, 16)
      },
      {
        id: '3-4',
        title: 'Data Quality Dashboard',
        description: 'Create UI for displaying data quality metrics',
        status: 'planned',
        priority: 'low',
        category: '2',
        created: new Date(2023, 3, 17),
        updated: new Date(2023, 3, 17)
      }
    ]
  },
  {
    id: '4',
    title: 'Testing & Production Readiness',
    description: 'Ensure the ETL system is thoroughly tested and ready for production',
    progress: 40,
    tasks: [
      {
        id: '4-1',
        title: 'Unit Tests for ETL Services',
        description: 'Complete unit tests for all ETL services',
        status: 'in-progress',
        priority: 'high',
        category: '4',
        created: new Date(2023, 3, 18),
        updated: new Date(2023, 3, 20)
      },
      {
        id: '4-2',
        title: 'Integration Tests',
        description: 'Create tests for full ETL pipeline integration',
        status: 'planned',
        priority: 'high',
        category: '4',
        created: new Date(2023, 3, 19),
        updated: new Date(2023, 3, 19)
      },
      {
        id: '4-3',
        title: 'Performance Benchmarking',
        description: 'Measure and optimize ETL performance',
        status: 'planned',
        priority: 'medium',
        category: '9',
        created: new Date(2023, 3, 20),
        updated: new Date(2023, 3, 20)
      },
      {
        id: '4-4',
        title: 'Error Handling Improvements',
        description: 'Enhance error handling and recovery mechanisms',
        status: 'planned',
        priority: 'medium',
        category: '6',
        created: new Date(2023, 3, 21),
        updated: new Date(2023, 3, 21)
      },
      {
        id: '4-5',
        title: 'Documentation',
        description: 'Complete user and developer documentation',
        status: 'planned',
        priority: 'low',
        category: '5',
        created: new Date(2023, 3, 22),
        updated: new Date(2023, 3, 22)
      }
    ]
  }
];

// Format date for display
const formatDate = (date?: Date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
};

// Status badge component
const StatusBadge: React.FC<{ status: TaskItem['status'] }> = ({ status }) => {
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
  let icon = null;
  
  switch (status) {
    case 'completed':
      variant = 'default';
      icon = <CheckCircle2 className="h-3.5 w-3.5 mr-1" />;
      break;
    case 'in-progress':
      variant = 'secondary';
      icon = <GitPullRequestDraft className="h-3.5 w-3.5 mr-1" />;
      break;
    case 'planned':
      variant = 'outline';
      icon = <Clock className="h-3.5 w-3.5 mr-1" />;
      break;
    case 'blocked':
      variant = 'destructive';
      icon = <AlertCircle className="h-3.5 w-3.5 mr-1" />;
      break;
  }
  
  return (
    <Badge variant={variant} className="flex items-center">
      {icon}
      {status.replace('-', ' ')}
    </Badge>
  );
};

// Priority badge component
const PriorityBadge: React.FC<{ priority: TaskItem['priority'] }> = ({ priority }) => {
  let className = 'text-xs';
  
  switch (priority) {
    case 'high':
      className += ' text-red-500';
      break;
    case 'medium':
      className += ' text-amber-500';
      break;
    case 'low':
      className += ' text-green-500';
      break;
  }
  
  return <span className={className}>{priority}</span>;
};

// Category badge component
const CategoryBadge: React.FC<{ categoryId: string }> = ({ categoryId }) => {
  const category = projectCategories.find(c => c.id === categoryId);
  
  if (!category) return null;
  
  // Get color class based on category color
  let colorClass = '';
  switch (category.color) {
    case 'blue':
      colorClass = 'bg-blue-100 text-blue-800';
      break;
    case 'green':
      colorClass = 'bg-green-100 text-green-800';
      break;
    case 'purple':
      colorClass = 'bg-purple-100 text-purple-800';
      break;
    case 'orange':
      colorClass = 'bg-orange-100 text-orange-800';
      break;
    case 'gray':
      colorClass = 'bg-gray-100 text-gray-800';
      break;
    case 'red':
      colorClass = 'bg-red-100 text-red-800';
      break;
    case 'teal':
      colorClass = 'bg-teal-100 text-teal-800';
      break;
    case 'amber':
      colorClass = 'bg-amber-100 text-amber-800';
      break;
    case 'indigo':
      colorClass = 'bg-indigo-100 text-indigo-800';
      break;
    default:
      colorClass = 'bg-gray-100 text-gray-800';
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {category.name}
    </span>
  );
};

export function ProjectTracker() {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterStatus, setFilterStatus] = useState<TaskItem['status'] | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isAddMilestoneModalOpen, setIsAddMilestoneModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');
  const [newTaskData, setNewTaskData] = useState<Partial<TaskItem>>({
    title: '',
    description: '',
    status: 'planned',
    priority: 'medium',
    category: '1',
  });
  const [newMilestoneData, setNewMilestoneData] = useState<Partial<Milestone>>({
    title: '',
    description: '',
  });
  
  // Calculate overall project progress
  const overallProgress = Math.round(
    milestones.reduce((sum, ms) => sum + ms.progress, 0) / milestones.length
  );
  
  // Count tasks by status
  const taskCounts = {
    all: milestones.flatMap(m => m.tasks).length,
    completed: milestones.flatMap(m => m.tasks).filter(t => t.status === 'completed').length,
    'in-progress': milestones.flatMap(m => m.tasks).filter(t => t.status === 'in-progress').length,
    planned: milestones.flatMap(m => m.tasks).filter(t => t.status === 'planned').length,
    blocked: milestones.flatMap(m => m.tasks).filter(t => t.status === 'blocked').length
  };
  
  // Filter tasks based on current filters and search query
  const filteredTasks = milestones.flatMap(milestone => 
    milestone.tasks.map(task => ({ ...task, milestone: milestone.title }))
  ).filter(task => {
    // Apply status filter
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    
    // Apply category filter
    if (filterCategory !== 'all' && task.category !== filterCategory) return false;
    
    // Apply search filter (match title or description)
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !task.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Sort tasks by status and then by priority
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // First by status (in-progress first, then planned, then completed)
    const statusOrder = { 'in-progress': 0, 'planned': 1, 'blocked': 2, 'completed': 3 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    
    // Then by priority (high first, then medium, then low)
    const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  // Handle updating a task's status
  const updateTaskStatus = (taskId: string, newStatus: TaskItem['status']) => {
    setMilestones(currentMilestones => 
      currentMilestones.map(milestone => ({
        ...milestone,
        tasks: milestone.tasks.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus, updated: new Date() }
            : task
        ),
        // Recalculate milestone progress
        progress: Math.round(
          (milestone.tasks.map(task => 
            task.id === taskId 
              ? (newStatus === 'completed' ? 1 : 0) 
              : (task.status === 'completed' ? 1 : 0)
          ).reduce((sum: number, val: number) => sum + val, 0) / milestone.tasks.length) * 100
        )
      }))
    );
  };
  
  // Handle adding a new task
  const addNewTask = (milestoneId: string, task: Omit<TaskItem, 'id' | 'created' | 'updated'>) => {
    const newTask: TaskItem = {
      ...task,
      id: `task-${Date.now()}`,
      created: new Date(),
      updated: new Date()
    };
    
    setMilestones(currentMilestones => 
      currentMilestones.map(milestone => 
        milestone.id === milestoneId 
          ? {
              ...milestone,
              tasks: [...milestone.tasks, newTask],
              // Recalculate milestone progress
              progress: Math.round(
                ((milestone.tasks.filter(t => t.status === 'completed').length + 
                  (newTask.status === 'completed' ? 1 : 0)) / 
                  (milestone.tasks.length + 1)) * 100
              )
            }
          : milestone
      )
    );
    
    // Close the add task modal
    setIsAddTaskModalOpen(false);
  };
  
  // Handle adding a new milestone
  const addNewMilestone = (milestone: Omit<Milestone, 'id' | 'tasks' | 'progress'>) => {
    const newMilestone: Milestone = {
      ...milestone,
      id: `milestone-${Date.now()}`,
      tasks: [],
      progress: 0
    };
    
    setMilestones(currentMilestones => [...currentMilestones, newMilestone]);
    
    // Close the add milestone modal
    setIsAddMilestoneModalOpen(false);
  };
  
  // Handle editing a task
  const editTask = (taskId: string, updatedTask: Partial<TaskItem>) => {
    setMilestones(currentMilestones => 
      currentMilestones.map(milestone => ({
        ...milestone,
        tasks: milestone.tasks.map(task => 
          task.id === taskId 
            ? { ...task, ...updatedTask, updated: new Date() }
            : task
        ),
        // Recalculate milestone progress if status changed
        progress: updatedTask.status 
          ? Math.round(
              (milestone.tasks.map(task => 
                task.id === taskId 
                  ? (updatedTask.status === 'completed' ? 1 : 0) 
                  : (task.status === 'completed' ? 1 : 0)
              ).reduce((sum: number, val: number) => sum + val, 0) / milestone.tasks.length) * 100
            )
          : milestone.progress
      }))
    );
    
    // Clear the editing task
    setEditingTask(null);
  };
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Milestone className="h-5 w-5 text-primary" />
          Project Tracker
        </CardTitle>
        <CardDescription>
          Track the progress of the ETL system implementation
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="px-6 mb-2">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">
              <BarChart className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex-1">
              <GitPullRequestDraft className="h-4 w-4 mr-2" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="milestones" className="flex-1">
              <Milestone className="h-4 w-4 mr-2" />
              Milestones
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-0">
          {/* Overview Tab */}
          <TabsContent value="overview" className="m-0 px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Progress Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Overall Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-muted-foreground">Project Completion</span>
                        <span className="font-medium">{overallProgress}%</span>
                      </div>
                      <Progress value={overallProgress} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Completed Tasks</span>
                        <span className="font-medium">{taskCounts.completed} / {taskCounts.all}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">In Progress</span>
                        <span className="font-medium">{taskCounts['in-progress']}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Planned</span>
                        <span className="font-medium">{taskCounts.planned}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-muted-foreground">Blocked</span>
                        <span className="font-medium">{taskCounts.blocked}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Milestones Summary Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Milestones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {milestones.map(milestone => (
                      <div key={milestone.id} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{milestone.title}</span>
                          <span className="text-sm">{milestone.progress}%</span>
                        </div>
                        <Progress value={milestone.progress} className="h-1.5" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {milestone.tasks.filter(t => t.status === 'completed').length} of {milestone.tasks.length} tasks completed
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Recent Activity */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3">Recent Activity</h3>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTasks.slice(0, 5).map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-muted-foreground">{task.milestone}</div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={task.status} />
                        </TableCell>
                        <TableCell>{formatDate(task.updated)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </TabsContent>
          
          {/* Tasks Tab */}
          <TabsContent value="tasks" className="m-0 px-6 py-4">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="md:w-1/3"
              />
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                >
                  All ({taskCounts.all})
                </Button>
                <Button
                  variant={filterStatus === 'in-progress' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('in-progress')}
                >
                  In Progress ({taskCounts['in-progress']})
                </Button>
                <Button
                  variant={filterStatus === 'planned' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('planned')}
                >
                  Planned ({taskCounts.planned})
                </Button>
                <Button
                  variant={filterStatus === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('completed')}
                >
                  Completed ({taskCounts.completed})
                </Button>
                <Button
                  variant={filterStatus === 'blocked' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('blocked')}
                >
                  Blocked ({taskCounts.blocked})
                </Button>
              </div>
              
              <div className="ml-auto">
                <Select
                  value={filterCategory}
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {projectCategories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {sortedTasks.length > 0 ? (
                  sortedTasks.map((task) => (
                    <Card key={task.id} className="overflow-hidden">
                      <div className="p-4 flex flex-col gap-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-base">{task.title}</h4>
                              <StatusBadge status={task.status} />
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1 ml-4">
                            <PriorityBadge priority={task.priority} />
                            <span className="text-xs text-muted-foreground">
                              Updated: {formatDate(task.updated)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              Milestone: {task.milestone}
                            </span>
                          </div>
                          <CategoryBadge categoryId={task.category} />
                        </div>
                        
                        {/* Task Actions */}
                        <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                          {task.status !== 'completed' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8" 
                              onClick={() => updateTaskStatus(task.id, 'completed')}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Mark Complete
                            </Button>
                          )}
                          
                          {task.status === 'completed' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8" 
                              onClick={() => updateTaskStatus(task.id, 'in-progress')}
                            >
                              <GitPullRequestDraft className="h-3.5 w-3.5 mr-1" />
                              Reopen
                            </Button>
                          )}
                          
                          {task.status === 'planned' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8" 
                              onClick={() => updateTaskStatus(task.id, 'in-progress')}
                            >
                              <GitPullRequestDraft className="h-3.5 w-3.5 mr-1" />
                              Start Task
                            </Button>
                          )}
                          
                          {task.status === 'blocked' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8" 
                              onClick={() => updateTaskStatus(task.id, 'in-progress')}
                            >
                              <GitMerge className="h-3.5 w-3.5 mr-1" />
                              Unblock
                            </Button>
                          )}
                          
                          {task.status === 'in-progress' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8" 
                              onClick={() => updateTaskStatus(task.id, 'blocked')}
                            >
                              <AlertCircle className="h-3.5 w-3.5 mr-1" />
                              Block
                            </Button>
                          )}
                          
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8" 
                            onClick={() => setEditingTask(task)}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No tasks match your filters. Try adjusting your search criteria.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          {/* Milestones Tab */}
          <TabsContent value="milestones" className="m-0 px-6 py-4">
            <div className="space-y-6">
              {milestones.map((milestone) => (
                <Card key={milestone.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{milestone.title}</CardTitle>
                      <Badge variant="outline">
                        {milestone.progress}% Complete
                      </Badge>
                    </div>
                    <CardDescription>{milestone.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <Progress value={milestone.progress} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="col-span-1">
                        <span className="text-sm font-medium">Total Tasks</span>
                        <p className="text-lg">{milestone.tasks.length}</p>
                      </div>
                      <div className="col-span-1">
                        <span className="text-sm font-medium">Completed</span>
                        <p className="text-lg">{milestone.tasks.filter(t => t.status === 'completed').length}</p>
                      </div>
                      <div className="col-span-1">
                        <span className="text-sm font-medium">In Progress</span>
                        <p className="text-lg">{milestone.tasks.filter(t => t.status === 'in-progress').length}</p>
                      </div>
                      <div className="col-span-1">
                        <span className="text-sm font-medium">Remaining</span>
                        <p className="text-lg">{milestone.tasks.filter(t => ['planned', 'blocked'].includes(t.status)).length}</p>
                      </div>
                    </div>
                    
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Task</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Category</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {milestone.tasks.map((task) => (
                            <TableRow key={task.id}>
                              <TableCell>
                                <Checkbox 
                                  checked={task.status === 'completed'} 
                                  disabled 
                                />
                              </TableCell>
                              <TableCell className="font-medium">{task.title}</TableCell>
                              <TableCell>
                                <StatusBadge status={task.status} />
                              </TableCell>
                              <TableCell>
                                <PriorityBadge priority={task.priority} />
                              </TableCell>
                              <TableCell>
                                <CategoryBadge categoryId={task.category} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="bg-muted/30 px-6 py-4 border-t">
        <div className="flex items-center justify-between w-full">
          <span className="text-sm text-muted-foreground">
            Last updated: {formatDate(new Date())}
          </span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddTaskModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Task
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddMilestoneModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Milestone
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              Export Report
            </Button>
          </div>
        </div>
      </CardFooter>
      
      {/* Add Task Modal */}
      <Dialog open={isAddTaskModalOpen} onOpenChange={setIsAddTaskModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
            <DialogDescription>
              Create a new task for the selected milestone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="milestone">Milestone</Label>
              <Select
                value={selectedMilestoneId}
                onValueChange={setSelectedMilestoneId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a milestone" />
                </SelectTrigger>
                <SelectContent>
                  {milestones.map((milestone) => (
                    <SelectItem key={milestone.id} value={milestone.id}>
                      {milestone.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newTaskData.title}
                onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTaskData.description}
                onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={newTaskData.status} 
                  onValueChange={(value: TaskItem['status']) => 
                    setNewTaskData({ ...newTaskData, status: value })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={newTaskData.priority} 
                  onValueChange={(value: TaskItem['priority']) => 
                    setNewTaskData({ ...newTaskData, priority: value })
                  }
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={newTaskData.category} 
                onValueChange={(value) => 
                  setNewTaskData({ ...newTaskData, category: value })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {projectCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={() => {
                if (selectedMilestoneId && newTaskData.title) {
                  addNewTask(selectedMilestoneId, newTaskData as Omit<TaskItem, 'id' | 'created' | 'updated'>);
                  // Reset form data
                  setNewTaskData({
                    title: '',
                    description: '',
                    status: 'planned',
                    priority: 'medium',
                    category: '1',
                  });
                  setSelectedMilestoneId('');
                }
              }}
              disabled={!selectedMilestoneId || !newTaskData.title}
            >
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Milestone Modal */}
      <Dialog open={isAddMilestoneModalOpen} onOpenChange={setIsAddMilestoneModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Milestone</DialogTitle>
            <DialogDescription>
              Create a new milestone to group related tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="milestone-title">Title</Label>
              <Input
                id="milestone-title"
                value={newMilestoneData.title}
                onChange={(e) => setNewMilestoneData({ ...newMilestoneData, title: e.target.value })}
                className="col-span-3"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="milestone-description">Description</Label>
              <Textarea
                id="milestone-description"
                value={newMilestoneData.description}
                onChange={(e) => setNewMilestoneData({ ...newMilestoneData, description: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddMilestoneModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={() => {
                if (newMilestoneData.title) {
                  addNewMilestone(newMilestoneData as Omit<Milestone, 'id' | 'tasks' | 'progress'>);
                  // Reset form data
                  setNewMilestoneData({
                    title: '',
                    description: '',
                  });
                }
              }}
              disabled={!newMilestoneData.title}
            >
              Add Milestone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Task Modal */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task details and save changes.
            </DialogDescription>
          </DialogHeader>
          {editingTask && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select 
                    value={editingTask.status} 
                    onValueChange={(value: TaskItem['status']) => 
                      setEditingTask({ ...editingTask, status: value })
                    }
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select 
                    value={editingTask.priority} 
                    onValueChange={(value: TaskItem['priority']) => 
                      setEditingTask({ ...editingTask, priority: value })
                    }
                  >
                    <SelectTrigger id="edit-priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select 
                  value={editingTask.category} 
                  onValueChange={(value) => 
                    setEditingTask({ ...editingTask, category: value })
                  }
                >
                  <SelectTrigger id="edit-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingTask(null)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              onClick={() => {
                if (editingTask && editingTask.id) {
                  editTask(editingTask.id, editingTask);
                }
              }}
              disabled={!editingTask?.title}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}