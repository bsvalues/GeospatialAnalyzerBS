import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { TransformationRule } from '../../services/etl/ETLTypes';
import { CheckCircle, Code, Database, Edit, PlusCircle, Save, Trash2, Play, FileText } from 'lucide-react';
import Editor from '@monaco-editor/react';

// Function to generate unique IDs for transformation rules
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * Mock function to validate transformation code
 */
const validateTransformationCode = (
  code: string,
  dataType: 'number' | 'text' | 'date' | 'boolean' | 'object'
): { isValid: boolean; message: string } => {
  if (!code.trim()) {
    return { isValid: false, message: 'Code cannot be empty' };
  }
  
  // Simple validation based on data type (this would be more sophisticated in a real app)
  switch (dataType) {
    case 'number':
      if (code.includes('UPPER(') || code.includes('LOWER(') || code.includes('CONCAT(')) {
        return { isValid: false, message: 'String functions cannot be used with number data type' };
      }
      break;
    case 'text':
      if (code.includes('SUM(') || code.includes('AVG(') || code.includes('COUNT(')) {
        return { isValid: false, message: 'Aggregate functions cannot be used with text data type' };
      }
      break;
    case 'date':
      if (!code.includes('DATE') && !code.includes('TIMESTAMP') && !code.includes('INTERVAL')) {
        return { isValid: false, message: 'Date transformation should use date functions' };
      }
      break;
    case 'boolean':
      if (!code.includes('=') && !code.includes('>') && !code.includes('<') && 
          !code.includes('AND') && !code.includes('OR') && !code.includes('NOT')) {
        return { isValid: false, message: 'Boolean transformation should include logical operators' };
      }
      break;
  }
  
  return { isValid: true, message: 'Validation successful' };
};

/**
 * Sample transformation rule templates
 */
const ruleTemplates: Record<string, { name: string; description: string; code: string; dataType: 'number' | 'text' | 'date' | 'boolean' | 'object' }> = {
  uppercase: {
    name: 'Uppercase Text',
    description: 'Convert text to uppercase',
    code: 'UPPER(column_name)',
    dataType: 'text'
  },
  lowercase: {
    name: 'Lowercase Text',
    description: 'Convert text to lowercase',
    code: 'LOWER(column_name)',
    dataType: 'text'
  },
  formatDate: {
    name: 'Format Date',
    description: 'Format date as YYYY-MM-DD',
    code: "TO_CHAR(column_name, 'YYYY-MM-DD')",
    dataType: 'date'
  },
  calculateArea: {
    name: 'Calculate Area',
    description: 'Calculate area based on length and width',
    code: 'length_column * width_column',
    dataType: 'number'
  },
  concatenate: {
    name: 'Concatenate Fields',
    description: 'Combine multiple fields into one',
    code: "CONCAT(first_name, ' ', last_name)",
    dataType: 'text'
  }
};

/**
 * ETL Transformation Editor Component
 */
export function ETLTransformationEditor() {
  const [transformationRules, setTransformationRules] = useState<TransformationRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<TransformationRule | null>(null);
  const [newRule, setNewRule] = useState<Omit<TransformationRule, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    dataType: 'text',
    transformationCode: '',
    isActive: true
  });
  const [isEditing, setIsEditing] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  
  // Initialize with sample rules
  useEffect(() => {
    const sampleRules: TransformationRule[] = [
      {
        id: generateId(),
        name: 'Convert Address to Uppercase',
        description: 'Converts property address to uppercase for standardization',
        dataType: 'text',
        transformationCode: 'UPPER(property.address)',
        isActive: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)  // 3 days ago
      },
      {
        id: generateId(),
        name: 'Calculate Price per Square Foot',
        description: 'Calculates the price per square foot of a property',
        dataType: 'number',
        transformationCode: 'property.value / property.squareFeet',
        isActive: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)  // 2 days ago
      },
      {
        id: generateId(),
        name: 'Format Assessment Date',
        description: 'Formats the assessment date in YYYY-MM-DD format',
        dataType: 'date',
        transformationCode: "TO_CHAR(property.assessmentDate, 'YYYY-MM-DD')",
        isActive: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)  // 1 day ago
      }
    ];
    
    setTransformationRules(sampleRules);
  }, []);
  
  // Handle selecting a rule for editing
  const handleSelectRule = (rule: TransformationRule) => {
    setSelectedRule(rule);
    setNewRule({
      name: rule.name,
      description: rule.description || '',
      dataType: rule.dataType,
      transformationCode: rule.transformationCode,
      isActive: rule.isActive
    });
    setIsEditing(true);
    setValidationResult(null);
    setOpenDialog(true);
  };
  
  // Handle creating a new rule
  const handleNewRule = () => {
    setSelectedRule(null);
    setNewRule({
      name: '',
      description: '',
      dataType: 'text',
      transformationCode: '',
      isActive: true
    });
    setIsEditing(false);
    setValidationResult(null);
    setOpenDialog(true);
  };
  
  // Handle input changes for the rule form
  const handleInputChange = (field: keyof typeof newRule, value: string | boolean) => {
    setNewRule(prev => ({ ...prev, [field]: value }));
    
    // If changing data type, reset the code
    if (field === 'dataType') {
      setNewRule(prev => ({ ...prev, transformationCode: '' }));
      setValidationResult(null);
    }
  };
  
  // Handle code changes in the editor
  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setNewRule(prev => ({ ...prev, transformationCode: value }));
      setValidationResult(null);
    }
  };
  
  // Apply template to current rule
  const applyTemplate = (templateKey: string) => {
    const template = ruleTemplates[templateKey];
    setNewRule(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      dataType: template.dataType,
      transformationCode: template.code
    }));
    setActiveTemplate(templateKey);
  };
  
  // Validate the transformation code
  const handleValidateCode = () => {
    const result = validateTransformationCode(
      newRule.transformationCode,
      newRule.dataType
    );
    setValidationResult(result);
  };
  
  // Save or update a rule
  const handleSaveRule = () => {
    // Validate first
    const result = validateTransformationCode(
      newRule.transformationCode,
      newRule.dataType
    );
    
    if (!result.isValid) {
      setValidationResult(result);
      return;
    }
    
    const now = new Date();
    
    if (isEditing && selectedRule) {
      // Update existing rule
      const updatedRules = transformationRules.map(rule => 
        rule.id === selectedRule.id 
          ? { 
              ...rule, 
              ...newRule, 
              updatedAt: now 
            }
          : rule
      );
      setTransformationRules(updatedRules);
    } else {
      // Create new rule
      const newRuleWithId: TransformationRule = {
        id: generateId(),
        ...newRule,
        createdAt: now,
        updatedAt: now
      };
      setTransformationRules([...transformationRules, newRuleWithId]);
    }
    
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setOpenDialog(false);
    }, 1500);
  };
  
  // Delete a rule
  const handleDeleteRule = (id: string) => {
    setTransformationRules(transformationRules.filter(rule => rule.id !== id));
  };
  
  // Toggle rule active state
  const handleToggleActive = (id: string) => {
    setTransformationRules(transformationRules.map(rule =>
      rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };
  
  // Format date to relative time
  const formatRelativeDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      return `${Math.floor(diffDays / 7)} weeks ago`;
    } else {
      return `${Math.floor(diffDays / 30)} months ago`;
    }
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Transformation Rules Editor</h2>
        <Button onClick={handleNewRule} className="flex items-center">
          <PlusCircle className="h-4 w-4 mr-2" />
          New Rule
        </Button>
      </div>
      
      {transformationRules.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <Code className="h-12 w-12 text-gray-400" />
            <h3 className="text-lg font-semibold">No Transformation Rules</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Transformation rules define how data is processed during ETL jobs.
              Click "New Rule" to create your first transformation rule.
            </p>
            <Button onClick={handleNewRule} variant="outline">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create First Rule
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transformationRules.map(rule => (
            <Card key={rule.id} className={`transition-colors ${!rule.isActive ? 'bg-gray-50' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{rule.name}</CardTitle>
                    <CardDescription>
                      {rule.description || 'No description'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Badge variant={rule.isActive ? 'default' : 'outline'}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {rule.dataType}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="bg-gray-100 rounded-md p-3 text-sm font-mono overflow-x-auto">
                  {rule.transformationCode}
                </div>
                <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                  <span>Created: {formatRelativeDate(rule.createdAt)}</span>
                  <span>Updated: {formatRelativeDate(rule.updatedAt)}</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`active-${rule.id}`} className="text-sm">Active</Label>
                  <Switch
                    id={`active-${rule.id}`}
                    checked={rule.isActive}
                    onCheckedChange={() => handleToggleActive(rule.id)}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSelectRule(rule)}
                    className="flex items-center"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="flex items-center text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Transformation Rule' : 'Create New Transformation Rule'}</DialogTitle>
            <DialogDescription>
              Define how your data should be transformed during ETL processing.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4 md:col-span-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input 
                    id="rule-name" 
                    value={newRule.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="My Transformation Rule"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rule-type">Data Type</Label>
                  <Select 
                    value={newRule.dataType}
                    onValueChange={(value) => handleInputChange('dataType', value)}
                  >
                    <SelectTrigger id="rule-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="object">Object/JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rule-description">Description</Label>
                <Textarea 
                  id="rule-description" 
                  value={newRule.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what this transformation does"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Transformation Code</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleValidateCode}
                    className="flex items-center"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Validate
                  </Button>
                </div>
                <div className="border rounded-md overflow-hidden" style={{ height: '200px' }}>
                  <Editor
                    height="200px"
                    language="sql"
                    value={newRule.transformationCode}
                    onChange={handleCodeChange}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      lineNumbers: 'on'
                    }}
                  />
                </div>
                
                {validationResult && (
                  <div className={`text-sm p-2 rounded ${
                    validationResult.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {validationResult.message}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="rule-active"
                  checked={newRule.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor="rule-active">Rule is active</Label>
              </div>
            </div>
            
            <div className="space-y-4">
              <Label>Template Gallery</Label>
              <ScrollArea className="h-[300px] border rounded-md p-2">
                <div className="space-y-2">
                  {Object.entries(ruleTemplates).map(([key, template]) => (
                    <Card 
                      key={key} 
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${activeTemplate === key ? 'border-blue-500 bg-blue-50' : ''}`}
                      onClick={() => applyTemplate(key)}
                    >
                      <h4 className="font-semibold">{template.name}</h4>
                      <p className="text-xs text-gray-500">{template.description}</p>
                      <div className="text-xs mt-1 font-mono bg-gray-100 p-1 rounded">
                        {template.code}
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
          
          <DialogFooter>
            <div className="flex justify-between w-full">
              <Button 
                variant="outline" 
                onClick={() => setOpenDialog(false)}
              >
                Cancel
              </Button>
              {saveSuccess ? (
                <Button className="bg-green-600 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Saved Successfully
                </Button>
              ) : (
                <Button 
                  onClick={handleSaveRule}
                  disabled={!newRule.name || !newRule.transformationCode}
                  className="flex items-center"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {isEditing ? 'Update Rule' : 'Save Rule'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}