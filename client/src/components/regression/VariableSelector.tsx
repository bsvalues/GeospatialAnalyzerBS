import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, Filter } from 'lucide-react';

interface VariableSelectorProps {
  availableVariables: string[];
  targetVariable: string;
  independentVariables: string[];
  onTargetChange: (variable: string) => void;
  onIndependentChange: (variables: string[]) => void;
}

export function VariableSelector({
  availableVariables,
  targetVariable,
  independentVariables,
  onTargetChange,
  onIndependentChange
}: VariableSelectorProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  // Filter variables based on search
  const filteredVariables = availableVariables.filter(variable => 
    variable.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle selecting/deselecting a variable
  const handleVariableToggle = (variable: string) => {
    if (independentVariables.includes(variable)) {
      onIndependentChange(independentVariables.filter(v => v !== variable));
    } else {
      onIndependentChange([...independentVariables, variable]);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="target-variable" className="text-base font-medium mb-2 block">
          Target Variable
        </Label>
        <Select 
          value={targetVariable} 
          onValueChange={onTargetChange}
        >
          <SelectTrigger id="target-variable">
            <SelectValue placeholder="Select target variable" />
          </SelectTrigger>
          <SelectContent>
            {availableVariables.map(variable => (
              <SelectItem key={variable} value={variable}>
                {variable}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground mt-1">
          This is the value you want to predict (typically property value)
        </p>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="independent-variables" className="text-base font-medium">
            Independent Variables
          </Label>
          <span className="text-sm text-muted-foreground">
            {independentVariables.length} selected
          </span>
        </div>
        
        <div className="flex items-center space-x-2 mb-2">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-variables"
              placeholder="Search variables..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Could add category filters here if needed */}
        </div>
        
        <div className="border rounded-md">
          <ScrollArea className="h-[300px] p-4">
            <div className="space-y-2">
              {filteredVariables.map(variable => (
                <div key={variable} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`variable-${variable}`}
                    checked={independentVariables.includes(variable)}
                    onCheckedChange={() => handleVariableToggle(variable)}
                  />
                  <Label 
                    htmlFor={`variable-${variable}`} 
                    className="flex-grow cursor-pointer"
                  >
                    {variable}
                  </Label>
                </div>
              ))}
              
              {filteredVariables.length === 0 && (
                <div className="py-4 text-center text-muted-foreground">
                  No variables match your search
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        
        <p className="text-sm text-muted-foreground mt-1">
          Select the variables to use for prediction
        </p>
      </div>
    </div>
  );
}