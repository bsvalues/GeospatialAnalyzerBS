import React, { useState, useEffect } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import ScriptEditor from '../script/ScriptEditor';
import ResultsPreview from '../script/ResultsPreview';
import ScriptWorkflow from '../script/ScriptWorkflow';
import { Property, ScriptStep, ScriptGroup } from '@/shared/types';

const ScriptPanel: React.FC = () => {
  // Sample properties data
  const [properties, setProperties] = useState<Property[]>([
    {
      id: "prop1",
      address: "123 Jadwin Ave, Richland",
      parcelId: "1-0425-100-0129-000",
      salePrice: "$375,000",
      squareFeet: 2300,
      yearBuilt: 2005,
      landValue: "$125,000",
      coordinates: [46.2804, -119.2752] // Richland, Benton County
    },
    {
      id: "prop2",
      address: "456 Columbia Center Blvd, Kennewick",
      parcelId: "1-0425-200-0213-000",
      salePrice: "$425,000",
      squareFeet: 3150,
      yearBuilt: 2010,
      coordinates: [46.2087, -119.2022] // Kennewick, Benton County
    },
    {
      id: "prop3",
      address: "789 Edison St, Kennewick",
      parcelId: "1-0426-500-0052-000",
      salePrice: "$295,000",
      squareFeet: 1320,
      yearBuilt: 1998,
      coordinates: [46.2115, -119.1868] // East Kennewick, Benton County
    },
    {
      id: "prop4",
      address: "321 9th St, Benton City",
      parcelId: "1-0427-300-0178-000",
      salePrice: "$265,000",
      squareFeet: 1750,
      yearBuilt: 2001,
      coordinates: [46.2631, -119.4871] // Benton City, Benton County
    },
    {
      id: "prop5",
      address: "555 Keene Rd, Richland",
      parcelId: "1-0425-700-0092-000",
      salePrice: "$395,000",
      squareFeet: 2650,
      yearBuilt: 2008,
      coordinates: [46.2392, -119.2802] // South Richland, Benton County
    }
  ]);
  
  // Sample script data
  const [scriptGroups, setScriptGroups] = useState<ScriptGroup[]>([
    {
      id: 'group1',
      name: 'Basic Valuation',
      active: true,
      description: 'Simple property valuation calculations'
    },
    {
      id: 'group2',
      name: 'Advanced Analysis',
      active: false,
      description: 'Complex statistical models for property valuation'
    }
  ]);
  
  const [scriptSteps, setScriptSteps] = useState<ScriptStep[]>([
    {
      id: 'step1',
      name: 'Square Footage Calculation',
      status: 'complete',
      type: 'compute',
      groupId: 'group1',
      code: `// Calculate property value based on square footage
function calculateBaseValue(property) {
  const pricePerSqFt = 150;
  return property.squareFeet * pricePerSqFt;
}

// Apply the calculation to each property
properties.forEach(property => {
  results[property.id] = calculateBaseValue(property);
});`,
      lastRun: '2023-03-15T14:30:00'
    },
    {
      id: 'step2',
      name: 'Age Adjustment',
      status: 'active',
      type: 'compute',
      groupId: 'group1',
      code: `// Apply age-based depreciation to property values
function applyAgeAdjustment(property, baseValue) {
  if (!property.yearBuilt) return baseValue;
  
  const currentYear = new Date().getFullYear();
  const age = currentYear - property.yearBuilt;
  const depreciationRate = 0.005; // 0.5% per year
  
  // Cap depreciation at 50%
  const depreciation = Math.min(age * depreciationRate, 0.5);
  
  return baseValue * (1 - depreciation);
}

// Apply to previous results
properties.forEach(property => {
  const baseValue = results[property.id] || 0;
  results[property.id] = applyAgeAdjustment(property, baseValue);
});`,
      lastRun: '2023-03-15T14:35:00'
    },
    {
      id: 'step3',
      name: 'Location Factor',
      status: 'pending',
      type: 'compute',
      groupId: 'group1',
      code: `// Apply location-based adjustments
function applyLocationFactor(property, value) {
  // Simplified location factors by area
  const locationFactors = {
    'Richland': 1.15,
    'Kennewick': 1.05,
    'Benton City': 0.95,
    'West Richland': 1.10,
    'Prosser': 0.9
  };
  
  // Extract city from address
  const addressParts = property.address.split(',');
  if (addressParts.length < 2) return value;
  
  const city = addressParts[1].trim().split(' ')[0];
  const factor = locationFactors[city] || 1.0;
  
  return value * factor;
}

// Apply to previous results
properties.forEach(property => {
  const currentValue = results[property.id] || 0;
  results[property.id] = applyLocationFactor(property, currentValue);
});`
    },
    {
      id: 'step4',
      name: 'Market Trends Analysis',
      status: 'pending',
      type: 'compute',
      groupId: 'group2',
      code: `// Advanced market trends analysis
// This would typically integrate with external market data
function applyMarketTrends(property, value) {
  // Simplified market appreciation rate
  const annualAppreciation = 0.035; // 3.5% annual appreciation
  
  // Apply 2 years of appreciation to account for market growth
  return value * Math.pow(1 + annualAppreciation, 2);
}

// Apply to all properties
properties.forEach(property => {
  const currentValue = results[property.id] || 0;
  results[property.id] = applyMarketTrends(property, currentValue);
});`
    }
  ]);
  
  const [selectedStepId, setSelectedStepId] = useState<string>(scriptSteps[1].id);
  const [currentCode, setCurrentCode] = useState<string>('');
  const [resultsLoading, setResultsLoading] = useState(false);
  const [calculatedValues, setCalculatedValues] = useState<Record<string, number>>({});
  const [resultsProperties, setResultsProperties] = useState<Property[]>([]);
  
  // Load the code for the selected step
  useEffect(() => {
    const selectedStep = scriptSteps.find(step => step.id === selectedStepId);
    if (selectedStep && selectedStep.code) {
      setCurrentCode(selectedStep.code);
    }
  }, [selectedStepId, scriptSteps]);
  
  // Handle selecting a script step
  const handleSelectStep = (stepId: string) => {
    setSelectedStepId(stepId);
  };
  
  // Handle running script
  const handleRunScript = (code: string) => {
    setResultsLoading(true);
    
    // In a real app, this would be executed on the server or in a controlled environment
    setTimeout(() => {
      try {
        // Safety execution environment
        const results: Record<string, number> = {};
        
        // Execute user code in a controlled environment
        // (This is a highly simplified version - real implementation would need more sandboxing)
        new Function('properties', 'results', code)(properties, results);
        
        setCalculatedValues(results);
        setResultsProperties(properties.filter(p => results[p.id] !== undefined));
        setResultsLoading(false);
      } catch (error) {
        console.error('Script execution error:', error);
        setResultsLoading(false);
        // Would show error message to user in real implementation
      }
    }, 1000);
  };
  
  // Handle saving script
  const handleSaveScript = (code: string) => {
    // Update the script step code
    setScriptSteps(prev => 
      prev.map(step => 
        step.id === selectedStepId ? { ...step, code } : step
      )
    );
  };
  
  // Add a new script step
  const handleAddStep = (groupId?: string) => {
    const newStep: ScriptStep = {
      id: `step${scriptSteps.length + 1}`,
      name: `New Script ${scriptSteps.length + 1}`,
      status: 'pending',
      type: 'compute',
      groupId: groupId,
      code: `// New script step
// This is where you can write your custom property valuation logic

// Example:
function processProperties(property) {
  // Your calculation logic here
  return property.squareFeet * 100; // Simple example
}

// Apply to all properties
properties.forEach(property => {
  results[property.id] = processProperties(property);
});`
    };
    
    setScriptSteps(prev => [...prev, newStep]);
    setSelectedStepId(newStep.id);
  };
  
  // Add a new script group
  const handleAddGroup = () => {
    const newGroup: ScriptGroup = {
      id: `group${scriptGroups.length + 1}`,
      name: `New Group ${scriptGroups.length + 1}`,
      active: false,
      description: 'A new script group'
    };
    
    setScriptGroups(prev => [...prev, newGroup]);
  };
  
  // Run a specific step
  const handleRunStep = (stepId: string) => {
    const step = scriptSteps.find(s => s.id === stepId);
    if (step && step.code) {
      handleRunScript(step.code);
      
      // Update step status to complete
      setScriptSteps(prev => 
        prev.map(s => 
          s.id === stepId ? { ...s, status: 'complete' as const, lastRun: new Date().toISOString() } : s
        )
      );
    }
  };
  
  // Delete a script step
  const handleDeleteStep = (stepId: string) => {
    setScriptSteps(prev => prev.filter(step => step.id !== stepId));
    
    // If the deleted step was selected, select another one
    if (selectedStepId === stepId) {
      const remainingSteps = scriptSteps.filter(step => step.id !== stepId);
      if (remainingSteps.length > 0) {
        setSelectedStepId(remainingSteps[0].id);
      }
    }
  };
  
  // Get the selected step
  const selectedStep = scriptSteps.find(step => step.id === selectedStepId);
  
  return (
    <div className="h-full flex">
      {/* Left sidebar - Script workflow */}
      <div className="w-56">
        <ScriptWorkflow 
          scriptGroups={scriptGroups}
          scriptSteps={scriptSteps}
          onSelectStep={handleSelectStep}
          onAddStep={handleAddStep}
          onAddGroup={handleAddGroup}
          onRunStep={handleRunStep}
          onDeleteStep={handleDeleteStep}
          selectedStepId={selectedStepId}
        />
      </div>
      
      {/* Main content area with editor and results */}
      <div className="flex-1">
        <ResizablePanelGroup direction="vertical">
          {/* Editor Panel */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <ScriptEditor 
              initialCode={currentCode}
              onRun={handleRunScript}
              onSave={handleSaveScript}
              scriptName={selectedStep?.name || 'Script Editor'}
            />
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* Results Panel */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <ResultsPreview 
              title={`Results: ${selectedStep?.name || 'Script Execution'}`}
              results={resultsProperties}
              calculatedValues={calculatedValues}
              isLoading={resultsLoading}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default ScriptPanel;