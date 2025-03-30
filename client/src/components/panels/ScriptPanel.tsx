import React, { useState } from 'react';
import { Workflow, FileText, CheckCircle, Circle, Play, Sliders, Code, Save, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScriptGroup, ScriptStep } from '@/shared/types';

interface ScriptData {
  scriptGroups: ScriptGroup[];
  scriptSteps: ScriptStep[];
}

const ScriptPanel: React.FC = () => {
  // Sample script data
  const [scriptData, setScriptData] = useState<ScriptData>({
    scriptGroups: [
      { id: 'data-review', name: 'Data Review', active: false },
      { id: 'sales-review', name: 'Sales Review', active: false },
      { id: 'modeling-prep', name: 'Modeling Prep', active: true },
      { id: 'regression-analysis', name: 'Regression Analysis', active: false },
      { id: 'comp-analysis', name: 'Comparable Analysis', active: false },
      { id: 'report-generation', name: 'Report Generation', active: false }
    ],
    scriptSteps: [
      { id: 'compute-bppsf', name: 'Compute BPPSF', status: 'complete', type: 'compute' },
      { id: 'compute-useablesale', name: 'Compute UseableSale', status: 'complete', type: 'compute' },
      { id: 'compute-sizerange', name: 'Compute SIZERANGE', status: 'active', type: 'compute' },
      { id: 'compute-outliertag', name: 'Compute OutlierTag', status: 'pending', type: 'compute' },
      { id: 'group-by-neighborhood', name: 'Group By Neighborhood', status: 'pending', type: 'group' },
      { id: 'combine-quality-condition', name: 'Combine Quality & Condition', status: 'pending', type: 'combine' }
    ]
  });
  
  const [activeStep, setActiveStep] = useState<string>('compute-sizerange');
  const [runningScript, setRunningScript] = useState<boolean>(false);
  const [scriptsExpanded, setScriptsExpanded] = useState<boolean>(true);
  const [stepsExpanded, setStepsExpanded] = useState<boolean>(true);
  
  // Current script step code (sample)
  const currentStepCode = `' Create a SIZERANGE variable
If ([SQUAREFEET] < 1500) Then
    Return "Small"
ElseIf ([SQUAREFEET] >= 1500 And [SQUAREFEET] < 2500) Then
    Return "Medium"
ElseIf ([SQUAREFEET] >= 2500 And [SQUAREFEET] < 3500) Then
    Return "Large"
Else
    Return "Very Large"
End If`;
  
  // Get the active step details
  const currentStep = scriptData.scriptSteps.find(step => step.id === activeStep);
  
  // Function to run the script
  const runScript = () => {
    setRunningScript(true);
    setTimeout(() => {
      setRunningScript(false);
      
      // Update the active step and next step status
      const updatedSteps = [...scriptData.scriptSteps];
      const currentIndex = updatedSteps.findIndex(step => step.id === activeStep);
      
      if (currentIndex < updatedSteps.length - 1) {
        updatedSteps[currentIndex].status = 'complete';
        updatedSteps[currentIndex + 1].status = 'active';
        setActiveStep(updatedSteps[currentIndex + 1].id);
      } else {
        updatedSteps[currentIndex].status = 'complete';
      }
      
      setScriptData({
        ...scriptData,
        scriptSteps: updatedSteps
      });
    }, 2000);
  };
  
  return (
    <div className="flex h-full">
      {/* Left sidebar - Script navigation */}
      <div className="w-72 bg-card border-r border-border flex flex-col">
        {/* Script Groups Section */}
        <div className="border-b border-border">
          <div 
            className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted"
            onClick={() => setScriptsExpanded(!scriptsExpanded)}
          >
            <div className="flex items-center">
              <Workflow size={16} className="mr-2 text-primary" />
              <h2 className="font-medium">Script Groups</h2>
            </div>
            {scriptsExpanded ? 
              <div className="h-4 w-4 flex items-center justify-center">—</div> : 
              <div className="h-4 w-4 flex items-center justify-center">+</div>
            }
          </div>
          
          {scriptsExpanded && (
            <div className="px-2 pb-2">
              {scriptData.scriptGroups.map((group) => (
                <Button 
                  key={group.id}
                  variant={group.active ? "default" : "ghost"}
                  className="w-full justify-start h-9 mb-1 text-sm"
                >
                  {group.name}
                </Button>
              ))}
              <Button 
                variant="outline" 
                className="w-full justify-center h-7 text-xs border-dashed border-muted-foreground/50"
              >
                + Add Script Group
              </Button>
            </div>
          )}
        </div>
        
        {/* Script Steps Section */}
        <div className="flex-1 overflow-y-auto">
          <div 
            className="p-3 flex items-center justify-between cursor-pointer hover:bg-muted border-b border-border"
            onClick={() => setStepsExpanded(!stepsExpanded)}
          >
            <div className="flex items-center">
              <FileText size={16} className="mr-2 text-primary" />
              <h2 className="font-medium">Script Steps</h2>
            </div>
            {stepsExpanded ? 
              <div className="h-4 w-4 flex items-center justify-center">—</div> : 
              <div className="h-4 w-4 flex items-center justify-center">+</div>
            }
          </div>
          
          {stepsExpanded && (
            <div className="p-2">
              {scriptData.scriptSteps.map((step) => (
                <div 
                  key={step.id}
                  className={`flex items-center p-2 rounded text-sm cursor-pointer ${
                    activeStep === step.id 
                      ? 'bg-primary bg-opacity-10' 
                      : 'hover:bg-muted'
                  } ${
                    step.status === 'complete' 
                      ? 'text-green-500' 
                      : step.status === 'active'
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                  }`}
                  onClick={() => setActiveStep(step.id)}
                >
                  {step.status === 'complete' ? (
                    <CheckCircle size={14} className="mr-2 text-green-500" />
                  ) : step.status === 'active' ? (
                    <Circle size={14} className="mr-2 text-primary" />
                  ) : (
                    <Circle size={14} className="mr-2 text-muted-foreground" />
                  )}
                  <span>{step.name}</span>
                </div>
              ))}
              
              <Button 
                variant="outline" 
                className="w-full justify-center h-7 text-xs mt-2 border-dashed border-muted-foreground/50"
              >
                + Add Script Step
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Main content - Script editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Editor header */}
        <div className="p-4 border-b border-border flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center">
              <Code size={20} className="mr-2 text-primary" />
              Script Step: {currentStep?.name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {currentStep?.type === 'compute' && 'Creates a new variable based on existing data'}
              {currentStep?.type === 'group' && 'Groups records based on a common attribute'}
              {currentStep?.type === 'combine' && 'Combines multiple attributes into a new attribute'}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant={runningScript ? "outline" : "default"}
              disabled={runningScript}
              onClick={runScript}
              className="flex items-center"
            >
              {runningScript ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-1"></div>
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play size={16} className="mr-1" />
                  <span>Run Step</span>
                </>
              )}
            </Button>
            <Button variant="outline" className="flex items-center">
              <Sliders size={16} className="mr-1" />
              <span>Configure</span>
            </Button>
          </div>
        </div>
        
        {/* Script content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left column - Code editor */}
            <div>
              <Card className="mb-4">
                <div className="p-3 bg-muted border-b border-border flex justify-between items-center">
                  <h3 className="text-sm font-medium">VB.Net Code</h3>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Copy size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Save size={14} />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-0">
                  <pre className="bg-card p-4 overflow-x-auto text-sm font-mono whitespace-pre text-foreground">
                    {currentStepCode}
                  </pre>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-2">Step Description</h3>
                  <p className="text-sm text-muted-foreground">
                    This script step creates a new variable "SIZERANGE" that groups properties into size categories based on square footage. 
                    This grouped variable can be used in regression analysis or for filtering comparable properties.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Right column - Step metadata */}
            <div>
              <Card className="mb-4">
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-3">Step Information</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Script Type:</div>
                      <div>Compute Field</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Output Field:</div>
                      <div>SIZERANGE</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Dependencies:</div>
                      <div>SQUAREFEET</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Last Run:</div>
                      <div>March 28, 2025</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Run Count:</div>
                      <div>12</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-3">Execution Results</h3>
                  <div className="p-3 bg-muted rounded-md text-sm">
                    <p className="text-muted-foreground">Run this step to see execution results...</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScriptPanel;