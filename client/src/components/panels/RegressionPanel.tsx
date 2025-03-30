import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Property } from '@shared/schema';
import { RegressionModel, calculateOLSRegression, calculateGWRRegression, KernelType, calculateModelQuality, calculateVariableImportance } from '@/services/regressionService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, BarChart4, Save, Download, MapPin, FileText, BarChart, HelpCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { VariableSelector } from '@/components/regression/VariableSelector';
import { ModelResults } from '@/components/regression/ModelResults';
import { ModelDiagnostics } from '@/components/regression/ModelDiagnostics';
import { ModelConfiguration } from '@/components/regression/ModelConfiguration';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

export interface RegressionPanelProps {
  className?: string;
}

export function RegressionPanel({ className }: RegressionPanelProps) {
  // Fetch property data
  const { data: properties, isLoading: propertiesLoading } = useQuery({
    queryKey: ['/api/properties'],
  });
  
  // State for regression model configuration
  const [targetVariable, setTargetVariable] = useState<string>('marketValue');
  const [independentVariables, setIndependentVariables] = useState<string[]>([]);
  const [modelType, setModelType] = useState<'ols' | 'weighted' | 'gwr'>('ols');
  const [gwrConfig, setGwrConfig] = useState({
    bandwidth: 0.5,
    kernel: KernelType.GAUSSIAN,
    adaptive: false
  });
  
  // State for model results
  const [model, setModel] = useState<RegressionModel | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [modelName, setModelName] = useState('');
  const [activeTab, setActiveTab] = useState('variables');
  
  // State for saved models
  const [savedModels, setSavedModels] = useState<RegressionModel[]>([]);
  
  // Available property variables for selection
  const [availableVariables, setAvailableVariables] = useState<string[]>([]);
  
  // Extract available variables from property data
  useEffect(() => {
    if (properties && properties.length > 0) {
      const property = properties[0];
      const variables: string[] = [];
      
      // Add basic property fields
      Object.keys(property).forEach(key => {
        // Skip non-numeric fields, id, and geo fields
        if (
          typeof property[key] === 'number' &&
          !['id', 'latitude', 'longitude'].includes(key)
        ) {
          variables.push(key);
        }
      });
      
      // Add attributes if they exist and are numeric
      if (property.attributes) {
        Object.keys(property.attributes).forEach(key => {
          if (typeof property.attributes[key] === 'number') {
            variables.push(`attributes.${key}`);
          }
        });
      }
      
      setAvailableVariables(variables);
    }
  }, [properties]);
  
  // Calculate regression model
  const calculateModel = () => {
    if (!properties || properties.length === 0 || independentVariables.length === 0) return;
    
    setIsCalculating(true);
    
    // Use setTimeout to prevent UI from freezing during calculation
    setTimeout(() => {
      try {
        let newModel: RegressionModel;
        
        switch (modelType) {
          case 'ols':
            newModel = calculateOLSRegression(
              properties,
              targetVariable,
              independentVariables
            );
            break;
          case 'gwr':
            newModel = calculateGWRRegression(
              properties,
              targetVariable,
              independentVariables,
              gwrConfig
            );
            break;
          case 'weighted':
            // For now, weight by recency of year built
            newModel = calculateOLSRegression(
              properties,
              targetVariable,
              independentVariables
            );
            break;
          default:
            newModel = calculateOLSRegression(
              properties,
              targetVariable,
              independentVariables
            );
        }
        
        setModel(newModel);
      } catch (error) {
        console.error('Error calculating regression model:', error);
        // Handle error (could set error state and display to user)
      } finally {
        setIsCalculating(false);
      }
    }, 100);
  };
  
  // Save the current model
  const saveModel = () => {
    if (!model) return;
    
    const modelToSave = {
      ...model,
      modelName: modelName || `${modelType.toUpperCase()} Model ${new Date().toLocaleString()}`,
      createdAt: new Date()
    };
    
    setSavedModels([...savedModels, modelToSave]);
    setModelName(modelToSave.modelName);
  };
  
  // Load a saved model
  const loadModel = (savedModel: RegressionModel) => {
    setModel(savedModel);
    setTargetVariable(savedModel.targetVariable);
    setIndependentVariables(savedModel.usedVariables);
    setModelName(savedModel.modelName || '');
    
    // Set appropriate model type
    if ('localCoefficients' in savedModel) {
      setModelType('gwr');
    } else {
      setModelType('ols');
    }
  };
  
  // Generate a script from the model
  const generateScript = () => {
    // This would navigate to the script panel with a pre-populated script
    // based on the regression model
    console.log('Generate script from model:', model);
    // Implementation would depend on app routing/state management
  };
  
  // Visualize model on map
  const visualizeOnMap = () => {
    // This would navigate to the map panel with the regression results visualization
    console.log('Visualize model on map:', model);
    // Implementation would depend on app routing/state management
  };
  
  // If properties are loading, show loading state
  if (propertiesLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading property data...</span>
      </div>
    );
  }
  
  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-2xl font-bold">Regression Analysis</h2>
          <p className="text-muted-foreground">
            Create and analyze property valuation models
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setSavedModels([])}
            disabled={savedModels.length === 0}
          >
            Clear Saved Models
          </Button>
          
          <Button
            variant="outline"
            onClick={saveModel}
            disabled={!model}
          >
            <Save className="mr-2 h-4 w-4" /> Save Model
          </Button>
          
          <Button
            variant="outline"
            onClick={visualizeOnMap}
            disabled={!model}
          >
            <MapPin className="mr-2 h-4 w-4" /> Visualize on Map
          </Button>
          
          <Button
            variant="outline"
            onClick={generateScript}
            disabled={!model}
          >
            <FileText className="mr-2 h-4 w-4" /> Generate Script
          </Button>
        </div>
      </div>
      
      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        {/* Left panel - Model Configuration */}
        <ResizablePanel defaultSize={25} minSize={20}>
          <div className="h-full flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="variables" className="flex-1">Variables</TabsTrigger>
                <TabsTrigger value="configuration" className="flex-1">Configuration</TabsTrigger>
                <TabsTrigger value="saved" className="flex-1">Saved Models</TabsTrigger>
              </TabsList>
              
              <TabsContent value="variables" className="flex-grow p-4 overflow-auto">
                <VariableSelector 
                  availableVariables={availableVariables}
                  targetVariable={targetVariable}
                  independentVariables={independentVariables}
                  onTargetChange={setTargetVariable}
                  onIndependentChange={setIndependentVariables}
                />
                
                <div className="mt-8">
                  <Button 
                    onClick={calculateModel} 
                    disabled={isCalculating || independentVariables.length === 0}
                    className="w-full"
                  >
                    {isCalculating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <BarChart4 className="mr-2 h-4 w-4" />
                        Calculate Model
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="configuration" className="flex-grow p-4 overflow-auto">
                <ModelConfiguration
                  modelType={modelType}
                  onModelTypeChange={setModelType}
                  gwrConfig={gwrConfig}
                  onGwrConfigChange={setGwrConfig}
                />
              </TabsContent>
              
              <TabsContent value="saved" className="flex-grow p-4 overflow-auto">
                {savedModels.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <Save className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No saved models</h3>
                    <p className="text-muted-foreground mt-2">
                      Save your regression models to compare and reuse them later.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    {savedModels.map((savedModel, index) => (
                      <Card key={index} className="mb-4">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            {savedModel.modelName || `Model ${index + 1}`}
                          </CardTitle>
                          <CardDescription>
                            {savedModel.createdAt?.toLocaleString() || 'No date'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Target: {savedModel.targetVariable}</div>
                            <div>R²: {savedModel.rSquared.toFixed(4)}</div>
                            <div>Variables: {savedModel.usedVariables.length}</div>
                            <div>Obs: {savedModel.observations}</div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => loadModel(savedModel)}
                          >
                            Load Model
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>
        
        {/* Right panel - Results */}
        <ResizablePanel defaultSize={75}>
          <div className="h-full flex flex-col">
            {!model ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <BarChart className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium">No regression model calculated</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Select a target variable and independent variables, then click "Calculate Model" to generate regression results.
                </p>
              </div>
            ) : (
              <Tabs defaultValue="results" className="w-full h-full flex flex-col">
                <TabsList className="w-full">
                  <TabsTrigger value="results">Results</TabsTrigger>
                  <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
                  <TabsTrigger value="predictions">Predictions</TabsTrigger>
                  <TabsTrigger value="quality">Model Quality</TabsTrigger>
                </TabsList>
                
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center">
                    <h3 className="text-lg font-medium">
                      {modelType === 'ols' ? 'OLS Regression' : 
                       modelType === 'gwr' ? 'Geographic Weighted Regression' : 
                       'Weighted Regression'}
                    </h3>
                    <span className="mx-2 text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      R² = {model.rSquared.toFixed(4)}
                    </span>
                    <span className="mx-2 text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {model.usedVariables.length} variables
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Label htmlFor="model-name" className="mr-2">Model Name:</Label>
                      <Input
                        id="model-name"
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        placeholder="Enter model name"
                        className="w-64"
                      />
                    </div>
                  </div>
                </div>
                
                <TabsContent value="results" className="flex-grow overflow-auto p-4">
                  <ModelResults model={model} />
                </TabsContent>
                
                <TabsContent value="diagnostics" className="flex-grow overflow-auto p-4">
                  <ModelDiagnostics model={model} />
                </TabsContent>
                
                <TabsContent value="predictions" className="flex-grow overflow-auto p-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Prediction vs. Actual Values</h3>
                      <div className="h-80 border rounded-md p-4">
                        {/* Placeholder for scatter plot of predicted vs actual values */}
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Scatter plot of predicted vs. actual values would go here
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Prediction Table</h3>
                      <div className="border rounded-md overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-muted">
                              <th className="p-2 text-left">Property ID</th>
                              <th className="p-2 text-left">Address</th>
                              <th className="p-2 text-right">Actual Value</th>
                              <th className="p-2 text-right">Predicted Value</th>
                              <th className="p-2 text-right">Difference</th>
                              <th className="p-2 text-right">% Difference</th>
                            </tr>
                          </thead>
                          <tbody>
                            {properties?.slice(0, 10).map((property, index) => {
                              const actual = model.actualValues[index];
                              const predicted = model.predictedValues[index];
                              const diff = actual - predicted;
                              const pctDiff = (diff / actual) * 100;
                              
                              return (
                                <tr key={property.id} className="border-t">
                                  <td className="p-2">{property.parcelId}</td>
                                  <td className="p-2">{property.address}</td>
                                  <td className="p-2 text-right">{formatCurrency(actual)}</td>
                                  <td className="p-2 text-right">{formatCurrency(predicted)}</td>
                                  <td className="p-2 text-right">{formatCurrency(diff)}</td>
                                  <td className="p-2 text-right">
                                    <span className={pctDiff < 0 ? 'text-red-500' : 'text-green-500'}>
                                      {pctDiff.toFixed(2)}%
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="quality" className="flex-grow overflow-auto p-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Model Quality Metrics</h3>
                      
                      {(() => {
                        const quality = calculateModelQuality(model);
                        return (
                          <div className="grid grid-cols-3 gap-4">
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">Coefficient of Dispersion</CardTitle>
                                <CardDescription>
                                  Measures assessment uniformity
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="text-3xl font-bold">{quality.cod.toFixed(2)}</div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {quality.cod < 10 ? 'Excellent' : 
                                   quality.cod < 15 ? 'Good' : 
                                   quality.cod < 20 ? 'Fair' : 'Poor'} uniformity
                                </p>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">Price-Related Differential</CardTitle>
                                <CardDescription>
                                  Measures vertical equity (regressivity/progressivity)
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="text-3xl font-bold">{quality.prd.toFixed(3)}</div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {quality.prd < 0.98 ? 'Progressive' : 
                                   quality.prd > 1.03 ? 'Regressive' : 'Neutral'} assessment
                                </p>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">Root Mean Square Error</CardTitle>
                                <CardDescription>
                                  Average prediction error magnitude
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="text-3xl font-bold">{formatCurrency(quality.rootMeanSquaredError)}</div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {(quality.rootMeanSquaredError / model.dataMean * 100).toFixed(2)}% of mean value
                                </p>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">Price-Related Bias</CardTitle>
                                <CardDescription>
                                  Correlation between ratio and value
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="text-3xl font-bold">{quality.prb.toFixed(3)}</div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {Math.abs(quality.prb) < 0.05 ? 'No significant bias' : 
                                   quality.prb < 0 ? 'Progressive bias' : 'Regressive bias'}
                                </p>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">Mean Absolute Error</CardTitle>
                                <CardDescription>
                                  Average absolute prediction error
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="text-3xl font-bold">{formatCurrency(quality.averageAbsoluteError)}</div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {(quality.averageAbsoluteError / model.dataMean * 100).toFixed(2)}% of mean value
                                </p>
                              </CardContent>
                            </Card>
                            
                            <Card>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">Median Absolute Error</CardTitle>
                                <CardDescription>
                                  Median absolute prediction error
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="text-3xl font-bold">{formatCurrency(quality.medianAbsoluteError)}</div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {(quality.medianAbsoluteError / model.dataMean * 100).toFixed(2)}% of mean value
                                </p>
                              </CardContent>
                            </Card>
                          </div>
                        );
                      })()}
                      
                      <div className="mt-6">
                        <h4 className="text-md font-medium mb-2">Variable Importance</h4>
                        <div className="border rounded-md p-4">
                          {(() => {
                            const importance = calculateVariableImportance(model);
                            return (
                              <div className="space-y-4">
                                {Object.entries(importance).map(([variable, value]) => (
                                  <div key={variable} className="space-y-1">
                                    <div className="flex justify-between">
                                      <span>{variable}</span>
                                      <span>{(value * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2.5">
                                      <div 
                                        className="bg-primary h-2.5 rounded-full" 
                                        style={{ width: `${value * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}