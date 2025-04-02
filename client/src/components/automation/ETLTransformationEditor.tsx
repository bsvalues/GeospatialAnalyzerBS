import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Play, Plus, ArrowRight, X, Edit, Trash2, ChevronDown, ChevronUp, Filter, Code, Activity } from 'lucide-react';
import MonacoEditor from '@monaco-editor/react';

interface Transformation {
  id: string;
  name: string;
  description: string;
  type: 'filter' | 'map' | 'reduce' | 'aggregate' | 'join' | 'script';
  script: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  order: number;
}

interface TransformationGroup {
  id: string;
  name: string;
  description: string;
  transformations: Transformation[];
  isActive: boolean;
}

interface ETLTransformationEditorProps {
  className?: string;
}

export function ETLTransformationEditor({ className }: ETLTransformationEditorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('editor');
  const [groups, setGroups] = useState<TransformationGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedTransformation, setSelectedTransformation] = useState<string | null>(null);
  const [isEditingGroup, setIsEditingGroup] = useState<boolean>(false);
  const [isEditingTransformation, setIsEditingTransformation] = useState<boolean>(false);
  const [newGroup, setNewGroup] = useState<Partial<TransformationGroup>>({});
  const [newTransformation, setNewTransformation] = useState<Partial<Transformation>>({
    type: 'filter',
    script: 'function transform(data) {\n  // Filter records based on condition\n  return data.filter(record => {\n    // Your filter logic here\n    return true;\n  });\n}'
  });
  const [testData, setTestData] = useState<string>('[\n  {\n    "id": 1,\n    "parcelId": "ABC123",\n    "address": "123 Main St",\n    "value": "$250,000"\n  },\n  {\n    "id": 2,\n    "parcelId": "DEF456",\n    "address": "456 Oak Ave",\n    "value": "$300,000"\n  }\n]');
  const [testResult, setTestResult] = useState<string>('');
  const [isTestRunning, setIsTestRunning] = useState<boolean>(false);
  
  // Sample transformation templates based on type
  const transformationTemplates = {
    filter: 'function transform(data) {\n  // Filter records based on condition\n  return data.filter(record => {\n    // Your filter logic here\n    return true;\n  });\n}',
    map: 'function transform(data) {\n  // Transform each record\n  return data.map(record => {\n    // Your mapping logic here\n    return {\n      ...record,\n      // Add or modify fields\n    };\n  });\n}',
    reduce: 'function transform(data) {\n  // Reduce records to a single value\n  return data.reduce((result, record) => {\n    // Your reduce logic here\n    return result;\n  }, {});\n}',
    aggregate: 'function transform(data) {\n  // Group and aggregate records\n  const result = {};\n  \n  // Your aggregation logic here\n  data.forEach(record => {\n    const key = record.someField;\n    if (!result[key]) {\n      result[key] = {\n        count: 0,\n        sum: 0\n      };\n    }\n    \n    result[key].count++;\n    result[key].sum += parseFloat(record.value);\n  });\n  \n  return Object.entries(result).map(([key, value]) => ({\n    key,\n    ...value\n  }));\n}',
    join: 'function transform(data, secondaryData) {\n  // Join two datasets\n  return data.map(record => {\n    const matchingSecondary = secondaryData.find(s => s.id === record.id);\n    \n    if (matchingSecondary) {\n      return {\n        ...record,\n        // Add fields from secondary dataset\n        ...matchingSecondary\n      };\n    }\n    \n    return record;\n  });\n}',
    script: 'function transform(data) {\n  // Custom transformation script\n  // Write any JavaScript code to transform the data\n  \n  // Example: Calculate a new field\n  return data.map(record => {\n    if (record.value) {\n      // Extract numeric value from formatted string\n      const numericValue = parseFloat(record.value.replace(/[^0-9.-]+/g, ""));\n      \n      return {\n        ...record,\n        numericValue\n      };\n    }\n    \n    return record;\n  });\n}'
  };
  
  // Load sample data on component mount
  useEffect(() => {
    // Simulate loading data from the server
    setTimeout(() => {
      setGroups([
        {
          id: 'group-1',
          name: 'Data Cleaning',
          description: 'Transformations for cleaning and standardizing property data',
          isActive: true,
          transformations: [
            {
              id: 'transform-1',
              name: 'Remove Incomplete Records',
              description: 'Filter out records without required fields',
              type: 'filter',
              script: 'function transform(data) {\n  return data.filter(record => {\n    return record.parcelId && record.address && record.value;\n  });\n}',
              createdAt: '2024-03-30T12:00:00Z',
              updatedAt: '2024-03-30T12:00:00Z',
              isActive: true,
              order: 1
            },
            {
              id: 'transform-2',
              name: 'Standardize Property Values',
              description: 'Convert all property values to numeric format',
              type: 'map',
              script: 'function transform(data) {\n  return data.map(record => {\n    if (record.value) {\n      // Extract numeric value from formatted string\n      const numericValue = parseFloat(record.value.replace(/[^0-9.-]+/g, ""));\n      \n      return {\n        ...record,\n        numericValue\n      };\n    }\n    \n    return record;\n  });\n}',
              createdAt: '2024-03-30T12:30:00Z',
              updatedAt: '2024-03-30T12:30:00Z',
              isActive: true,
              order: 2
            }
          ]
        },
        {
          id: 'group-2',
          name: 'Analysis Prep',
          description: 'Transformations for preparing data for analysis',
          isActive: false,
          transformations: [
            {
              id: 'transform-3',
              name: 'Calculate Price Per Square Foot',
              description: 'Add price per square foot field to each property',
              type: 'map',
              script: 'function transform(data) {\n  return data.map(record => {\n    if (record.numericValue && record.squareFeet) {\n      const pricePerSqFt = record.numericValue / record.squareFeet;\n      \n      return {\n        ...record,\n        pricePerSqFt\n      };\n    }\n    \n    return record;\n  });\n}',
              createdAt: '2024-03-30T13:00:00Z',
              updatedAt: '2024-03-30T13:00:00Z',
              isActive: true,
              order: 1
            },
            {
              id: 'transform-4',
              name: 'Group By Neighborhood',
              description: 'Aggregate properties by neighborhood',
              type: 'aggregate',
              script: 'function transform(data) {\n  const result = {};\n  \n  data.forEach(record => {\n    if (!record.neighborhood) return;\n    \n    const key = record.neighborhood;\n    if (!result[key]) {\n      result[key] = {\n        count: 0,\n        totalValue: 0,\n        avgValue: 0\n      };\n    }\n    \n    result[key].count++;\n    if (record.numericValue) {\n      result[key].totalValue += record.numericValue;\n    }\n  });\n  \n  // Calculate averages\n  Object.keys(result).forEach(key => {\n    if (result[key].count > 0) {\n      result[key].avgValue = result[key].totalValue / result[key].count;\n    }\n  });\n  \n  return Object.entries(result).map(([key, value]) => ({\n    neighborhood: key,\n    ...value\n  }));\n}',
              createdAt: '2024-03-30T13:30:00Z',
              updatedAt: '2024-03-30T13:30:00Z',
              isActive: true,
              order: 2
            }
          ]
        }
      ]);
      
      setLoading(false);
      
      // Select the first group and transformation by default
      setSelectedGroup('group-1');
      setSelectedTransformation('transform-1');
    }, 1000);
  }, []);
  
  // Get the currently selected transformation
  const getCurrentTransformation = (): Transformation | undefined => {
    if (!selectedGroup || !selectedTransformation) return undefined;
    
    const group = groups.find(g => g.id === selectedGroup);
    if (!group) return undefined;
    
    return group.transformations.find(t => t.id === selectedTransformation);
  };
  
  // Get the currently selected group
  const getCurrentGroup = (): TransformationGroup | undefined => {
    if (!selectedGroup) return undefined;
    return groups.find(g => g.id === selectedGroup);
  };
  
  // Handle script editor change
  const handleScriptChange = (value: string | undefined) => {
    if (!value) return;
    
    if (isEditingTransformation) {
      setNewTransformation(prev => ({ ...prev, script: value }));
    } else {
      // Update the script of the selected transformation
      const updatedGroups = [...groups];
      const groupIndex = updatedGroups.findIndex(g => g.id === selectedGroup);
      
      if (groupIndex !== -1) {
        const transformationIndex = updatedGroups[groupIndex].transformations.findIndex(
          t => t.id === selectedTransformation
        );
        
        if (transformationIndex !== -1) {
          updatedGroups[groupIndex].transformations[transformationIndex].script = value;
          updatedGroups[groupIndex].transformations[transformationIndex].updatedAt = new Date().toISOString();
          setGroups(updatedGroups);
        }
      }
    }
  };
  
  // Handle transformation type change
  const handleTransformationTypeChange = (type: string) => {
    setNewTransformation(prev => ({
      ...prev,
      type: type as Transformation['type'],
      script: transformationTemplates[type as keyof typeof transformationTemplates]
    }));
  };
  
  // Handle saving a transformation
  const handleSaveTransformation = () => {
    if (isEditingTransformation) {
      // Validate inputs
      if (!newTransformation.name || !newTransformation.script) {
        toast({
          title: "Validation Error",
          description: "Name and script are required.",
          variant: "destructive",
        });
        return;
      }
      
      // Save new or edited transformation
      const updatedGroups = [...groups];
      const groupIndex = updatedGroups.findIndex(g => g.id === selectedGroup);
      
      if (groupIndex !== -1) {
        if (newTransformation.id) {
          // Edit existing transformation
          const transformationIndex = updatedGroups[groupIndex].transformations.findIndex(
            t => t.id === newTransformation.id
          );
          
          if (transformationIndex !== -1) {
            updatedGroups[groupIndex].transformations[transformationIndex] = {
              ...updatedGroups[groupIndex].transformations[transformationIndex],
              ...newTransformation,
              updatedAt: new Date().toISOString()
            } as Transformation;
          }
        } else {
          // Add new transformation
          const newId = `transform-${Date.now()}`;
          const newOrder = updatedGroups[groupIndex].transformations.length > 0
            ? Math.max(...updatedGroups[groupIndex].transformations.map(t => t.order)) + 1
            : 1;
          
          updatedGroups[groupIndex].transformations.push({
            ...newTransformation,
            id: newId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
            order: newOrder
          } as Transformation);
          
          setSelectedTransformation(newId);
        }
        
        setGroups(updatedGroups);
        setIsEditingTransformation(false);
        setNewTransformation({
          type: 'filter',
          script: transformationTemplates.filter
        });
        
        toast({
          title: "Success",
          description: `Transformation ${newTransformation.id ? 'updated' : 'created'} successfully.`,
        });
      }
    } else {
      // Save the current transformation script
      const updatedGroups = [...groups];
      const groupIndex = updatedGroups.findIndex(g => g.id === selectedGroup);
      
      if (groupIndex !== -1) {
        const transformationIndex = updatedGroups[groupIndex].transformations.findIndex(
          t => t.id === selectedTransformation
        );
        
        if (transformationIndex !== -1) {
          updatedGroups[groupIndex].transformations[transformationIndex].updatedAt = new Date().toISOString();
          setGroups(updatedGroups);
          
          toast({
            title: "Success",
            description: "Transformation saved successfully.",
          });
        }
      }
    }
  };
  
  // Handle saving a group
  const handleSaveGroup = () => {
    // Validate inputs
    if (!newGroup.name) {
      toast({
        title: "Validation Error",
        description: "Group name is required.",
        variant: "destructive",
      });
      return;
    }
    
    const updatedGroups = [...groups];
    
    if (newGroup.id) {
      // Edit existing group
      const groupIndex = updatedGroups.findIndex(g => g.id === newGroup.id);
      
      if (groupIndex !== -1) {
        updatedGroups[groupIndex] = {
          ...updatedGroups[groupIndex],
          ...newGroup
        } as TransformationGroup;
      }
    } else {
      // Add new group
      const newId = `group-${Date.now()}`;
      
      updatedGroups.push({
        ...newGroup,
        id: newId,
        transformations: [],
        isActive: false
      } as TransformationGroup);
      
      setSelectedGroup(newId);
    }
    
    setGroups(updatedGroups);
    setIsEditingGroup(false);
    setNewGroup({});
    
    toast({
      title: "Success",
      description: `Group ${newGroup.id ? 'updated' : 'created'} successfully.`,
    });
  };
  
  // Handle deleting a transformation
  const handleDeleteTransformation = (groupId: string, transformationId: string) => {
    const updatedGroups = [...groups];
    const groupIndex = updatedGroups.findIndex(g => g.id === groupId);
    
    if (groupIndex !== -1) {
      updatedGroups[groupIndex].transformations = updatedGroups[groupIndex].transformations.filter(
        t => t.id !== transformationId
      );
      setGroups(updatedGroups);
      
      // If the deleted transformation was selected, select another one
      if (selectedTransformation === transformationId) {
        const nextTransformation = updatedGroups[groupIndex].transformations[0];
        setSelectedTransformation(nextTransformation ? nextTransformation.id : null);
      }
      
      toast({
        title: "Success",
        description: "Transformation deleted successfully.",
      });
    }
  };
  
  // Handle deleting a group
  const handleDeleteGroup = (groupId: string) => {
    const updatedGroups = groups.filter(g => g.id !== groupId);
    setGroups(updatedGroups);
    
    // If the deleted group was selected, select another one
    if (selectedGroup === groupId) {
      const nextGroup = updatedGroups[0];
      setSelectedGroup(nextGroup ? nextGroup.id : null);
      setSelectedTransformation(nextGroup && nextGroup.transformations[0] ? nextGroup.transformations[0].id : null);
    }
    
    toast({
      title: "Success",
      description: "Group deleted successfully.",
    });
  };
  
  // Handle toggling a group's active state
  const handleToggleGroupActive = (groupId: string) => {
    const updatedGroups = [...groups];
    const groupIndex = updatedGroups.findIndex(g => g.id === groupId);
    
    if (groupIndex !== -1) {
      updatedGroups[groupIndex].isActive = !updatedGroups[groupIndex].isActive;
      setGroups(updatedGroups);
    }
  };
  
  // Handle toggling a transformation's active state
  const handleToggleTransformationActive = (groupId: string, transformationId: string) => {
    const updatedGroups = [...groups];
    const groupIndex = updatedGroups.findIndex(g => g.id === groupId);
    
    if (groupIndex !== -1) {
      const transformationIndex = updatedGroups[groupIndex].transformations.findIndex(
        t => t.id === transformationId
      );
      
      if (transformationIndex !== -1) {
        updatedGroups[groupIndex].transformations[transformationIndex].isActive = 
          !updatedGroups[groupIndex].transformations[transformationIndex].isActive;
        setGroups(updatedGroups);
      }
    }
  };
  
  // Handle moving a transformation up or down in the order
  const handleMoveTransformation = (groupId: string, transformationId: string, direction: 'up' | 'down') => {
    const updatedGroups = [...groups];
    const groupIndex = updatedGroups.findIndex(g => g.id === groupId);
    
    if (groupIndex !== -1) {
      const transformations = [...updatedGroups[groupIndex].transformations];
      const index = transformations.findIndex(t => t.id === transformationId);
      
      if (index !== -1) {
        if (direction === 'up' && index > 0) {
          // Swap with the previous transformation
          const temp = transformations[index].order;
          transformations[index].order = transformations[index - 1].order;
          transformations[index - 1].order = temp;
          
          // Reorder array
          const item = transformations[index];
          transformations[index] = transformations[index - 1];
          transformations[index - 1] = item;
        } else if (direction === 'down' && index < transformations.length - 1) {
          // Swap with the next transformation
          const temp = transformations[index].order;
          transformations[index].order = transformations[index + 1].order;
          transformations[index + 1].order = temp;
          
          // Reorder array
          const item = transformations[index];
          transformations[index] = transformations[index + 1];
          transformations[index + 1] = item;
        }
        
        updatedGroups[groupIndex].transformations = transformations;
        setGroups(updatedGroups);
      }
    }
  };
  
  // Handle testing the transformation
  const handleTestTransformation = async () => {
    try {
      setIsTestRunning(true);
      
      // Get the current transformation script
      const transformation = getCurrentTransformation();
      if (!transformation) {
        throw new Error("No transformation selected");
      }
      
      // Parse the test data
      let data;
      try {
        data = JSON.parse(testData);
      } catch (error) {
        throw new Error("Invalid test data JSON");
      }
      
      // Execute the transformation function
      const script = transformation.script;
      const transformFn = new Function('return ' + script)();
      
      if (typeof transformFn !== 'function') {
        throw new Error("Invalid transformation function");
      }
      
      // Apply the transformation
      const result = transformFn(data);
      
      // Format and display the result
      setTestResult(JSON.stringify(result, null, 2));
      
      toast({
        title: "Test Successful",
        description: "Transformation executed successfully.",
      });
    } catch (error) {
      console.error('Error testing transformation:', error);
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsTestRunning(false);
    }
  };
  
  // Render the transformation type badge
  const renderTransformationTypeBadge = (type: Transformation['type']) => {
    let color = '';
    let icon = null;
    
    switch (type) {
      case 'filter':
        color = 'bg-blue-100 text-blue-800 border-blue-200';
        icon = <Filter className="h-3.5 w-3.5 mr-1" />;
        break;
      case 'map':
        color = 'bg-green-100 text-green-800 border-green-200';
        icon = <ArrowRight className="h-3.5 w-3.5 mr-1" />;
        break;
      case 'reduce':
        color = 'bg-purple-100 text-purple-800 border-purple-200';
        icon = <Activity className="h-3.5 w-3.5 mr-1" />;
        break;
      case 'aggregate':
        color = 'bg-orange-100 text-orange-800 border-orange-200';
        icon = <Activity className="h-3.5 w-3.5 mr-1" />;
        break;
      case 'join':
        color = 'bg-pink-100 text-pink-800 border-pink-200';
        icon = <Activity className="h-3.5 w-3.5 mr-1" />;
        break;
      case 'script':
        color = 'bg-gray-100 text-gray-800 border-gray-200';
        icon = <Code className="h-3.5 w-3.5 mr-1" />;
        break;
      default:
        color = 'bg-gray-100 text-gray-800 border-gray-200';
    }
    
    return (
      <Badge variant="outline" className={`${color} flex items-center`}>
        {icon}
        <span className="capitalize">{type}</span>
      </Badge>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Code className="h-5 w-5 mr-2" />
          ETL Transformation Editor
        </CardTitle>
        <CardDescription>
          Create and manage data transformations for ETL processing
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p>Loading transformations...</p>
          </div>
        ) : (
          <div className="flex flex-col h-[600px]">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="testing">Testing</TabsTrigger>
                <TabsTrigger value="management">Management</TabsTrigger>
              </TabsList>
              
              <TabsContent value="editor" className="flex-1 h-full">
                <div className="grid grid-cols-12 gap-4 h-full">
                  {/* Left sidebar - Transformation Groups */}
                  <div className="col-span-3 border rounded-md p-2 overflow-y-auto">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium">Transformation Groups</h3>
                      <Dialog open={isEditingGroup} onOpenChange={setIsEditingGroup}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => {
                            setNewGroup({});
                            setIsEditingGroup(true);
                          }}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>{newGroup.id ? 'Edit' : 'Add'} Transformation Group</DialogTitle>
                            <DialogDescription>
                              Create a new group to organize related transformations
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="group-name" className="text-right">
                                Name
                              </Label>
                              <Input
                                id="group-name"
                                value={newGroup.name || ''}
                                onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="group-description" className="text-right">
                                Description
                              </Label>
                              <Textarea
                                id="group-description"
                                value={newGroup.description || ''}
                                onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                                className="col-span-3"
                              />
                            </div>
                          </div>
                          
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditingGroup(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleSaveGroup}>
                              Save
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <div className="space-y-1">
                      {groups.map(group => (
                        <div 
                          key={group.id}
                          className={`rounded-md cursor-pointer transition-colors ${
                            selectedGroup === group.id ? 'bg-secondary' : 'hover:bg-secondary/50'
                          }`}
                        >
                          <div 
                            className="flex items-center justify-between p-2"
                            onClick={() => {
                              setSelectedGroup(group.id);
                              if (group.transformations.length > 0) {
                                setSelectedTransformation(group.transformations[0].id);
                              } else {
                                setSelectedTransformation(null);
                              }
                            }}
                          >
                            <div className="flex items-center">
                              <span className="font-medium">{group.name}</span>
                              {group.isActive && (
                                <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-200">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNewGroup({
                                    id: group.id,
                                    name: group.name,
                                    description: group.description,
                                    isActive: group.isActive
                                  });
                                  setIsEditingGroup(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleGroupActive(group.id);
                                }}
                              >
                                {group.isActive ? <X className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteGroup(group.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {selectedGroup === group.id && group.transformations.length > 0 && (
                            <div className="pl-2 pr-1 pb-1">
                              {group.transformations.map(transformation => (
                                <div
                                  key={transformation.id}
                                  className={`flex items-center justify-between p-2 rounded-md text-sm ${
                                    selectedTransformation === transformation.id 
                                      ? 'bg-primary/10'
                                      : 'hover:bg-secondary/80'
                                  }`}
                                  onClick={() => setSelectedTransformation(transformation.id)}
                                >
                                  <div className="truncate">
                                    {transformation.name}
                                  </div>
                                  {!transformation.isActive && (
                                    <Badge variant="outline" className="bg-gray-100 ml-2">
                                      Disabled
                                    </Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Main content - Transformation Editor */}
                  <div className="col-span-9 border rounded-md p-4 overflow-hidden flex flex-col">
                    {selectedGroup && getCurrentGroup() ? (
                      <>
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <h2 className="text-lg font-semibold">
                              {getCurrentGroup()?.name}
                              {isEditingTransformation ? ' - New Transformation' : ''}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              {getCurrentGroup()?.description}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {!isEditingTransformation && (
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setNewTransformation({
                                    type: 'filter',
                                    script: transformationTemplates.filter
                                  });
                                  setIsEditingTransformation(true);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Transformation
                              </Button>
                            )}
                            <Button onClick={handleSaveTransformation}>
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                        
                        {isEditingTransformation ? (
                          <div className="grid grid-cols-12 gap-4 mb-4">
                            <div className="col-span-6">
                              <Label htmlFor="transform-name">Name</Label>
                              <Input
                                id="transform-name"
                                value={newTransformation.name || ''}
                                onChange={(e) => setNewTransformation(prev => ({ ...prev, name: e.target.value }))}
                                className="mt-1"
                                placeholder="e.g., Filter Incomplete Records"
                              />
                            </div>
                            <div className="col-span-6">
                              <Label htmlFor="transform-type">Type</Label>
                              <Select 
                                value={newTransformation.type} 
                                onValueChange={handleTransformationTypeChange}
                              >
                                <SelectTrigger id="transform-type" className="mt-1">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="filter">Filter</SelectItem>
                                  <SelectItem value="map">Map</SelectItem>
                                  <SelectItem value="reduce">Reduce</SelectItem>
                                  <SelectItem value="aggregate">Aggregate</SelectItem>
                                  <SelectItem value="join">Join</SelectItem>
                                  <SelectItem value="script">Custom Script</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-12">
                              <Label htmlFor="transform-description">Description</Label>
                              <Textarea
                                id="transform-description"
                                value={newTransformation.description || ''}
                                onChange={(e) => setNewTransformation(prev => ({ ...prev, description: e.target.value }))}
                                className="mt-1"
                                placeholder="Describe what this transformation does"
                              />
                            </div>
                          </div>
                        ) : selectedTransformation && getCurrentTransformation() ? (
                          <div className="mb-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="text-md font-medium flex items-center">
                                  {getCurrentTransformation()?.name}
                                  <span className="ml-2">
                                    {renderTransformationTypeBadge(getCurrentTransformation()?.type || 'filter')}
                                  </span>
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {getCurrentTransformation()?.description}
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const transformation = getCurrentTransformation();
                                    if (transformation) {
                                      setNewTransformation({
                                        id: transformation.id,
                                        name: transformation.name,
                                        description: transformation.description,
                                        type: transformation.type,
                                        script: transformation.script
                                      });
                                      setIsEditingTransformation(true);
                                    }
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (selectedGroup && selectedTransformation) {
                                      handleToggleTransformationActive(selectedGroup, selectedTransformation);
                                    }
                                  }}
                                >
                                  {getCurrentTransformation()?.isActive ? (
                                    <X className="h-4 w-4" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (selectedGroup && selectedTransformation) {
                                      handleMoveTransformation(selectedGroup, selectedTransformation, 'up');
                                    }
                                  }}
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (selectedGroup && selectedTransformation) {
                                      handleMoveTransformation(selectedGroup, selectedTransformation, 'down');
                                    }
                                  }}
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (selectedGroup && selectedTransformation) {
                                      handleDeleteTransformation(selectedGroup, selectedTransformation);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="mb-4 text-center p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                            <p className="text-muted-foreground">
                              No transformation selected. Select a transformation from the sidebar or create a new one.
                            </p>
                          </div>
                        )}
                        
                        <div className="flex-1 relative min-h-[200px]">
                          <MonacoEditor
                            height="100%"
                            language="javascript"
                            theme="vs-dark"
                            value={isEditingTransformation 
                              ? newTransformation.script 
                              : getCurrentTransformation()?.script}
                            options={{
                              minimap: { enabled: false },
                              scrollBeyondLastLine: false,
                              automaticLayout: true,
                              tabSize: 2,
                              wordWrap: 'on'
                            }}
                            onChange={handleScriptChange}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-muted-foreground mb-4">
                          No transformation group selected. Select a group from the sidebar or create a new one.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setNewGroup({});
                            setIsEditingGroup(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Create Transformation Group
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="testing" className="flex-1 h-full">
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div className="border rounded-md p-4 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Test Data</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setTestData('[\n  {\n    "id": 1,\n    "parcelId": "ABC123",\n    "address": "123 Main St",\n    "value": "$250,000"\n  },\n  {\n    "id": 2,\n    "parcelId": "DEF456",\n    "address": "456 Oak Ave",\n    "value": "$300,000"\n  }\n]')}
                      >
                        Reset
                      </Button>
                    </div>
                    <div className="flex-1 relative min-h-[200px]">
                      <MonacoEditor
                        height="100%"
                        language="json"
                        theme="vs-dark"
                        value={testData}
                        options={{
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 2,
                          wordWrap: 'on'
                        }}
                        onChange={(value) => setTestData(value || '')}
                      />
                    </div>
                  </div>
                  
                  <div className="border rounded-md p-4 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Test Results</h3>
                      <Button 
                        onClick={handleTestTransformation}
                        disabled={isTestRunning || !selectedTransformation}
                      >
                        {isTestRunning ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Running...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Run Test
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="flex-1 relative min-h-[200px]">
                      <MonacoEditor
                        height="100%"
                        language="json"
                        theme="vs-dark"
                        value={testResult}
                        options={{
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 2,
                          wordWrap: 'on',
                          readOnly: true
                        }}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="management" className="flex-1 h-full">
                <div className="border rounded-md p-4 h-full overflow-auto">
                  <h3 className="text-lg font-semibold mb-4">Transformation Groups</h3>
                  
                  {groups.length === 0 ? (
                    <div className="text-center p-6 bg-gray-50 dark:bg-gray-900 rounded-md">
                      <p className="text-muted-foreground mb-4">
                        No transformation groups created yet.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setNewGroup({});
                          setIsEditingGroup(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Create Group
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {groups.map(group => (
                        <div key={group.id} className="border rounded-md p-4">
                          <div className="flex justify-between items-center mb-4">
                            <div>
                              <h3 className="text-md font-semibold flex items-center">
                                {group.name}
                                {group.isActive && (
                                  <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 border-green-200">
                                    Active
                                  </Badge>
                                )}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {group.description}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setNewGroup({
                                    id: group.id,
                                    name: group.name,
                                    description: group.description,
                                    isActive: group.isActive
                                  });
                                  setIsEditingGroup(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant={group.isActive ? "outline" : "default"}
                                size="sm"
                                onClick={() => handleToggleGroupActive(group.id)}
                              >
                                {group.isActive ? (
                                  <>
                                    <X className="h-4 w-4 mr-1" />
                                    Disable
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-1" />
                                    Enable
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteGroup(group.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </div>
                          
                          <div className="border rounded-md">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Order</TableHead>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {group.transformations.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                      No transformations in this group
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  group.transformations.map(transformation => (
                                    <TableRow key={transformation.id}>
                                      <TableCell>{transformation.order}</TableCell>
                                      <TableCell className="font-medium">
                                        <div>
                                          {transformation.name}
                                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                            {transformation.description}
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        {renderTransformationTypeBadge(transformation.type)}
                                      </TableCell>
                                      <TableCell>
                                        {transformation.isActive ? (
                                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                            Active
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="bg-gray-100">
                                            Disabled
                                          </Badge>
                                        )}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setSelectedGroup(group.id);
                                              setSelectedTransformation(transformation.id);
                                              setActiveTab('editor');
                                            }}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleTransformationActive(group.id, transformation.id)}
                                          >
                                            {transformation.isActive ? (
                                              <X className="h-4 w-4" />
                                            ) : (
                                              <Play className="h-4 w-4" />
                                            )}
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteTransformation(group.id, transformation.id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {groups.reduce((total, group) => total + group.transformations.length, 0)} transformation(s) in {groups.length} group(s)
        </div>
      </CardFooter>
    </Card>
  );
}

export default ETLTransformationEditor;