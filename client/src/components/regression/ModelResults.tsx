import React from 'react';
import { RegressionModel } from '@/services/regressionService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HelpCircle, AlertTriangle, Check, X, Baseline } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';

interface ModelResultsProps {
  model: RegressionModel;
}

export function ModelResults({ model }: ModelResultsProps) {
  // Helper to format p-values with appropriate significance stars
  const formatPValue = (pValue: number) => {
    const stars = pValue < 0.001 ? '***' : pValue < 0.01 ? '**' : pValue < 0.05 ? '*' : '';
    return (
      <div className="flex items-center justify-between">
        <span>{pValue.toFixed(4)}</span>
        <span className="text-primary font-bold">{stars}</span>
      </div>
    );
  };
  
  // Helper to determine significance
  const isSignificant = (pValue: number) => pValue < 0.05;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">R-squared</CardTitle>
            <CardDescription>
              Proportion of variance explained
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{model.rSquared.toFixed(4)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Adjusted: {model.adjustedRSquared.toFixed(4)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Model Fit</CardTitle>
            <CardDescription>
              F-statistic and significance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{model.fStatistic.toFixed(2)}</div>
            <div className="text-sm mt-1 flex items-center">
              <span className={model.pValue < 0.05 ? 'text-green-500' : 'text-red-500'}>
                p = {model.pValue.toExponential(2)}
              </span>
              {model.pValue < 0.05 && (
                <span className="ml-2 text-green-500 flex items-center">
                  <Check className="h-3 w-3 mr-1" /> Significant
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Observations</CardTitle>
            <CardDescription>
              Sample size and data completeness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{model.usedObservations}</div>
            {model.diagnostics.missingValueCount > 0 && (
              <div className="text-sm text-amber-500 mt-1 flex items-center">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {model.diagnostics.missingValueCount} values missing
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Coefficients Table */}
      <div>
        <h3 className="text-lg font-medium mb-4">Regression Coefficients</h3>
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Variable</TableHead>
                <TableHead className="text-right">Coefficient</TableHead>
                <TableHead className="text-right">Std. Error</TableHead>
                <TableHead className="text-right">t-value</TableHead>
                <TableHead className="text-right">p-value</TableHead>
                <TableHead className="text-center">Significance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">(Intercept)</TableCell>
                <TableCell className="text-right">{model.intercept.toFixed(4)}</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-right">-</TableCell>
                <TableCell className="text-center">-</TableCell>
              </TableRow>
              
              {model.usedVariables.map(variable => (
                <TableRow key={variable}>
                  <TableCell className="font-medium">{variable}</TableCell>
                  <TableCell className="text-right">{model.coefficients[variable].toFixed(4)}</TableCell>
                  <TableCell className="text-right">{model.standardErrors[variable].toFixed(4)}</TableCell>
                  <TableCell className="text-right">{model.tValues[variable].toFixed(4)}</TableCell>
                  <TableCell className="text-right">{formatPValue(model.pValues[variable])}</TableCell>
                  <TableCell className="text-center">
                    {isSignificant(model.pValues[variable]) ? (
                      <span className="text-green-500 flex items-center justify-center">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="text-red-500 flex items-center justify-center">
                        <X className="h-4 w-4" />
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex justify-end mt-2 text-xs text-muted-foreground">
          <div className="space-x-2">
            <span>Significance levels:</span>
            <span>* p&lt;0.05</span>
            <span>** p&lt;0.01</span>
            <span>*** p&lt;0.001</span>
          </div>
        </div>
      </div>
      
      {/* Interpretation */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Model Interpretation</CardTitle>
          <CardDescription>
            What the model results mean
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <p>
              This model explains <span className="font-semibold">{(model.rSquared * 100).toFixed(1)}%</span> of the variation in {model.targetVariable}.
              {model.pValue < 0.05 
                ? " The model is statistically significant, suggesting it has good predictive power."
                : " The model is not statistically significant, which suggests poor predictive power."}
            </p>
            
            {model.usedVariables.filter(v => isSignificant(model.pValues[v])).length > 0 ? (
              <div>
                <p className="font-semibold">Key factors affecting {model.targetVariable}:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {model.usedVariables
                    .filter(v => isSignificant(model.pValues[v]))
                    .sort((a, b) => Math.abs(model.tValues[b]) - Math.abs(model.tValues[a]))
                    .slice(0, 5)
                    .map(variable => (
                      <li key={variable}>
                        <span className="font-medium">{variable}</span>: 
                        {model.coefficients[variable] > 0 
                          ? ` Increases ${model.targetVariable} by ${model.coefficients[variable].toFixed(2)} units per unit increase`
                          : ` Decreases ${model.targetVariable} by ${Math.abs(model.coefficients[variable]).toFixed(2)} units per unit increase`}
                      </li>
                    ))
                  }
                </ul>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No significant variables</AlertTitle>
                <AlertDescription>
                  None of the variables in the model have a statistically significant effect on {model.targetVariable}.
                  Consider trying different variables or transformations.
                </AlertDescription>
              </Alert>
            )}
            
            {model.diagnostics.collinearity && (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Multicollinearity detected</AlertTitle>
                <AlertDescription>
                  Some variables are highly correlated, which can make coefficient interpretation difficult.
                  Consider removing some correlated variables.
                </AlertDescription>
              </Alert>
            )}
            
            {model.diagnostics.heteroskedasticity && (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Heteroskedasticity detected</AlertTitle>
                <AlertDescription>
                  Error variance is not constant, which may affect statistical tests.
                  Consider transforming variables or using robust standard errors.
                </AlertDescription>
              </Alert>
            )}
            
            {model.diagnostics.spatialAutocorrelation && (
              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Spatial autocorrelation detected</AlertTitle>
                <AlertDescription>
                  Property values are spatially clustered. Consider using Geographic Weighted Regression
                  or adding spatial variables to account for location effects.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Prediction Formula</CardTitle>
          <CardDescription>
            Use this equation to predict {model.targetVariable}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-md font-mono text-sm overflow-auto whitespace-pre">
            {`${model.targetVariable} = ${model.intercept.toFixed(4)} ${
              model.usedVariables.map(v => {
                const coef = model.coefficients[v];
                return coef >= 0 
                  ? `+ ${coef.toFixed(4)} × ${v}`
                  : `- ${Math.abs(coef).toFixed(4)} × ${v}`;
              }).join(' ')
            }`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}