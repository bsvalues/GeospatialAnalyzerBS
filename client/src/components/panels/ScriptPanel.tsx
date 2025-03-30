import React, { useState } from 'react';
import { ChevronDown, ChevronRight, GitBranch, FileText, Code, Play, Sliders } from 'lucide-react';
import ScriptEditor from '../script/ScriptEditor';
import ResultsPreview from '../script/ResultsPreview';

const ScriptPanel: React.FC = () => {
  const [scriptsExpanded, setScriptsExpanded] = useState(true);
  const [stepsExpanded, setStepsExpanded] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState('modeling-prep');
  const [selectedStep, setSelectedStep] = useState('compute-sizerange');
  const [runningScript, setRunningScript] = useState(false);
  
  // Script groups data
  const scriptGroups = [
    { id: 'data-review', name: 'Data Review', active: false },
    { id: 'sales-review', name: 'Sales Review', active: false },
    { id: 'modeling-prep', name: 'Modeling Prep', active: true },
    { id: 'regression-analysis', name: 'Regression Analysis', active: false },
    { id: 'comparable-analysis', name: 'Comparable Analysis', active: false }
  ];
  
  // Script steps data
  const scriptSteps = [
    { id: 'compute-bppsf', name: 'Compute BPPSF', status: 'complete' },
    { id: 'compute-useablesale', name: 'Compute UseableSale', status: 'complete' },
    { id: 'compute-sizerange', name: 'Compute SIZERANGE', status: 'active' },
    { id: 'compute-outliertag', name: 'Compute OutlierTag', status: 'pending' },
    { id: 'group-by-neighborhood', name: 'Group By Neighborhood', status: 'pending' }
  ];
  
  // SQL queries data
  const sqlQueries = [
    { id: 'prop-data', name: 'Prop Data SQL' },
    { id: 'property', name: 'Property' },
    { id: 'permits', name: 'Permits' },
    { id: 'land', name: 'Land' }
  ];
  
  // Current step code
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

  // Sample preview data
  const previewData = [
    { parcelId: '10425-01-29', squareFeet: 2300, sizeRange: 'Medium' },
    { parcelId: '10425-02-13', squareFeet: 3150, sizeRange: 'Large' },
    { parcelId: '10426-05-02', squareFeet: 1320, sizeRange: 'Small' },
    { parcelId: '10427-01-15', squareFeet: 4200, sizeRange: 'Very Large' },
    { parcelId: '10427-03-08', squareFeet: 1650, sizeRange: 'Medium' }
  ];
  
  // Chart data
  const chartData = [
    { name: 'Small', value: 22 },
    { name: 'Medium', value: 42 },
    { name: 'Large', value: 28 },
    { name: 'Very Large', value: 8 }
  ];
  
  const handleRunScript = () => {
    setRunningScript(true);
    setTimeout(() => {
      setRunningScript(false);
      
      // Update the active step and move to next
      const currentIndex = scriptSteps.findIndex(step => step.id === selectedStep);
      if (currentIndex < scriptSteps.length - 1) {
        scriptSteps[currentIndex].status = 'complete';
        scriptSteps[currentIndex + 1].status = 'active';
        setSelectedStep(scriptSteps[currentIndex + 1].id);
      }
    }, 2000);
  };

  const currentStep = scriptSteps.find(step => step.id === selectedStep);

  return (
    <div className="flex h-full">
      {/* Script Sidebar */}
      <div className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Script Groups */}
        <div className="border-b border-gray-700">
          <div 
            className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-750"
            onClick={() => setScriptsExpanded(!scriptsExpanded)}
          >
            <div className="flex items-center">
              <GitBranch size={16} className="mr-2 text-blue-400" />
              <h2 className="font-medium">Script Groups</h2>
            </div>
            {scriptsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          
          {scriptsExpanded && (
            <div className="px-2 pb-2">
              {scriptGroups.map(group => (
                <button 
                  key={group.id}
                  className={`w-full text-left px-3 py-2 rounded text-sm ${
                    group.id === selectedGroup 
                      ? 'bg-blue-600 text-white' 
                      : 'hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedGroup(group.id)}
                >
                  {group.name}
                </button>
              ))}
              <button className="w-full mt-1 text-center px-3 py-1.5 rounded border border-dashed border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white text-xs">
                + Add Script Group
              </button>
            </div>
          )}
        </div>
        
        {/* Script Steps */}
        <div className="flex-1 overflow-y-auto">
          <div 
            className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-750 border-b border-gray-700"
            onClick={() => setStepsExpanded(!stepsExpanded)}
          >
            <div className="flex items-center">
              <FileText size={16} className="mr-2 text-blue-400" />
              <h2 className="font-medium">Script Steps</h2>
            </div>
            {stepsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </div>
          
          {stepsExpanded && (
            <div className="p-2">
              {scriptSteps.map(step => (
                <div 
                  key={step.id}
                  className={`flex items-center p-2 rounded text-sm cursor-pointer ${
                    selectedStep === step.id 
                      ? 'bg-blue-900 bg-opacity-50' 
                      : 'hover:bg-gray-700'
                  } ${
                    step.status === 'complete' 
                      ? 'text-green-400' 
                      : step.status === 'active'
                        ? 'text-white'
                        : 'text-gray-500'
                  }`}
                  onClick={() => setSelectedStep(step.id)}
                >
                  <div className={`h-3 w-3 rounded-full mr-2 ${
                    step.status === 'complete' 
                      ? 'bg-green-500' 
                      : step.status === 'active'
                        ? 'border-2 border-blue-500' 
                        : 'border border-gray-500'
                  }`}></div>
                  <span>{step.name}</span>
                </div>
              ))}
              <button className="w-full mt-2 text-center px-3 py-2 rounded border border-dashed border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white text-xs">
                + Add Script Step
              </button>
              
              {/* SQL Queries Section */}
              <div className="mt-4 p-3 bg-gray-750 rounded border border-gray-700">
                <h3 className="text-sm font-medium text-blue-400 mb-2">Available Queries</h3>
                <div className="space-y-1 text-sm max-h-40 overflow-y-auto">
                  {sqlQueries.map(query => (
                    <div key={query.id} className="px-2 py-1 rounded hover:bg-gray-700 cursor-pointer">
                      <div className="h-3 w-3 rounded-full bg-blue-500 inline-block mr-1.5 opacity-60"></div>
                      {query.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Script Content */}
      <div className="flex-1 flex flex-col">
        {/* Script Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center">
              <Code size={20} className="mr-2 text-blue-400" />
              Script Step: {currentStep?.name}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Creates a new variable based on existing data
            </p>
          </div>
          <div className="flex space-x-2">
            <button 
              className={`px-4 py-1.5 rounded flex items-center space-x-1 ${
                runningScript 
                  ? 'bg-green-700 text-white cursor-wait' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              onClick={handleRunScript}
              disabled={runningScript}
            >
              {runningScript ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play size={16} className="mr-1" />
                  <span>Run Step</span>
                </>
              )}
            </button>
            <button className="px-4 py-1.5 bg-gray-700 text-white rounded hover:bg-gray-600 flex items-center">
              <Sliders size={16} className="mr-1" />
              <span>Configure</span>
            </button>
          </div>
        </div>
        
        {/* Script Editor and Preview */}
        <div className="flex-1 grid grid-cols-2 gap-0 overflow-hidden">
          <ScriptEditor code={currentStepCode} />
          <ResultsPreview tableData={previewData} chartData={chartData} />
        </div>
      </div>
    </div>
  );
};

export default ScriptPanel;
