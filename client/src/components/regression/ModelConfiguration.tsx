import React from 'react';
import { KernelType } from '@/services/regressionService';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoIcon } from 'lucide-react';

interface ModelConfigurationProps {
  modelType: 'ols' | 'weighted' | 'gwr';
  onModelTypeChange: (type: 'ols' | 'weighted' | 'gwr') => void;
  gwrConfig: {
    bandwidth: number;
    kernel: KernelType;
    adaptive: boolean;
  };
  onGwrConfigChange: (config: {
    bandwidth: number;
    kernel: KernelType;
    adaptive: boolean;
  }) => void;
}

export function ModelConfiguration({
  modelType,
  onModelTypeChange,
  gwrConfig,
  onGwrConfigChange
}: ModelConfigurationProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Model Type</h3>
        <RadioGroup 
          value={modelType} 
          onValueChange={(value) => onModelTypeChange(value as 'ols' | 'weighted' | 'gwr')}
          className="space-y-4"
        >
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="ols" id="model-ols" />
            <div className="grid gap-1">
              <Label htmlFor="model-ols" className="font-medium">Ordinary Least Squares</Label>
              <p className="text-sm text-muted-foreground">
                Standard linear regression that minimizes the sum of squared residuals.
                Best for global, non-spatial models.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="weighted" id="model-weighted" />
            <div className="grid gap-1">
              <Label htmlFor="model-weighted" className="font-medium">Weighted Regression</Label>
              <p className="text-sm text-muted-foreground">
                Gives different weights to observations based on their importance.
                Useful when some observations are more reliable than others.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="gwr" id="model-gwr" />
            <div className="grid gap-1">
              <Label htmlFor="model-gwr" className="font-medium">Geographic Weighted Regression</Label>
              <p className="text-sm text-muted-foreground">
                Accounts for spatial variation by fitting local models for each location.
                Excellent for capturing neighborhood effects and spatial patterns.
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>
      
      {modelType === 'gwr' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">GWR Parameters</CardTitle>
            <CardDescription>
              Configure the Geographic Weighted Regression parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="bandwidth-slider">Bandwidth: {gwrConfig.bandwidth.toFixed(2)}</Label>
                  <div className="text-xs text-muted-foreground">
                    {gwrConfig.adaptive ? 'Proportion of points' : 'Distance'}
                  </div>
                </div>
                <Slider
                  id="bandwidth-slider"
                  value={[gwrConfig.bandwidth]}
                  min={0.01}
                  max={gwrConfig.adaptive ? 1 : 2}
                  step={0.01}
                  onValueChange={(value) => onGwrConfigChange({
                    ...gwrConfig,
                    bandwidth: value[0]
                  })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Controls the extent of local influence. Smaller values produce more local models.
                </p>
              </div>
              
              <div>
                <Label htmlFor="kernel-type" className="mb-2 block">Kernel Function</Label>
                <Select
                  value={gwrConfig.kernel}
                  onValueChange={(value) => onGwrConfigChange({
                    ...gwrConfig,
                    kernel: value as KernelType
                  })}
                >
                  <SelectTrigger id="kernel-type">
                    <SelectValue placeholder="Select kernel function" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={KernelType.GAUSSIAN}>Gaussian</SelectItem>
                    <SelectItem value={KernelType.BISQUARE}>Bisquare</SelectItem>
                    <SelectItem value={KernelType.EXPONENTIAL}>Exponential</SelectItem>
                    <SelectItem value={KernelType.TRICUBE}>Tricube</SelectItem>
                    <SelectItem value={KernelType.BOXCAR}>Boxcar</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Determines how influence drops off with distance.
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="adaptive-toggle" className="mb-1 block">Adaptive Bandwidth</Label>
                  <p className="text-xs text-muted-foreground">
                    Uses a varying bandwidth based on data density.
                  </p>
                </div>
                <Switch
                  id="adaptive-toggle"
                  checked={gwrConfig.adaptive}
                  onCheckedChange={(checked) => onGwrConfigChange({
                    ...gwrConfig,
                    adaptive: checked
                  })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {modelType === 'weighted' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center">
              <span className="text-base">Weighting Scheme</span>
              <InfoIcon className="ml-2 h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              Currently using inverse of building age as weights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              Newer properties have higher weights in the regression, making them more influential in the model.
              This is useful when newer properties are more representative of current market conditions.
            </p>
            {/* Future enhancement: Add configurable weighting schemes */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}