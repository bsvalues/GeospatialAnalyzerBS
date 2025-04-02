import React from 'react';
import { Property } from '@shared/schema';
import { PropertyValueAnalysis, ValuationStatus } from '../../services/comparison/valueAnalysisService';
import { formatCurrency, formatPercentage } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle,
  DollarSign, 
  Home,
  ArrowUpDown,
  Ruler
} from 'lucide-react';

interface PropertyValueAnalysisCardProps {
  analysis: PropertyValueAnalysis;
  className?: string;
}

/**
 * Card component to display property value analysis results
 */
export const PropertyValueAnalysisCard: React.FC<PropertyValueAnalysisCardProps> = ({
  analysis,
  className = ''
}) => {
  // Get valuation status details
  const getValuationDetails = (status: ValuationStatus) => {
    switch (status) {
      case 'undervalued':
        return {
          label: 'Undervalued',
          icon: <TrendingDown className="h-5 w-5 text-green-500" />,
          color: 'text-green-600',
          description: 'This property appears to be undervalued compared to similar properties in the area.'
        };
      case 'overvalued':
        return {
          label: 'Overvalued',
          icon: <TrendingUp className="h-5 w-5 text-red-500" />,
          color: 'text-red-500',
          description: 'This property appears to be overvalued compared to similar properties in the area.'
        };
      case 'fair-value':
      default:
        return {
          label: 'Fair Value',
          icon: <CheckCircle className="h-5 w-5 text-blue-500" />,
          color: 'text-blue-500',
          description: 'This property appears to be fairly valued compared to similar properties in the area.'
        };
    }
  };
  
  const valuationDetails = getValuationDetails(analysis.valuationStatus);
  
  // Get percentage difference color
  const getPercentColor = (percent: number) => {
    if (Math.abs(percent) < 5) return 'text-blue-500';
    return percent < 0 ? 'text-green-600' : 'text-red-500';
  };
  
  // Get progress bar color
  const getProgressColor = (percent: number) => {
    if (Math.abs(percent) < 5) return 'bg-blue-500';
    return percent < 0 ? 'bg-green-600' : 'bg-red-500';
  };
  
  // Convert percentage difference to a 0-100 scale for the progress bar
  const getProgressValue = (percent: number) => {
    // Center at 50, with range from 0 to 100
    // -30% or lower -> 0
    // +30% or higher -> 100
    return Math.max(0, Math.min(100, (percent + 30) / 60 * 100));
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Value Analysis</CardTitle>
          <Badge 
            variant="outline" 
            className={`ml-2 ${valuationDetails.color}`}
          >
            <span className="flex items-center gap-1">
              {valuationDetails.icon}
              <span>{valuationDetails.label}</span>
            </span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-gray-500 mb-4">
          {valuationDetails.description}
        </p>
        
        {/* Value metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-center text-sm text-gray-500 mb-1">
              <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
              <span>Property Value</span>
            </div>
            <div className="text-lg font-medium">
              {formatCurrency(parseFloat(analysis.property.value || '0'))}
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-center text-sm text-gray-500 mb-1">
              <Ruler className="h-4 w-4 mr-1 text-gray-400" />
              <span>Price per Sq.Ft.</span>
            </div>
            <div className="text-lg font-medium">
              {formatCurrency(analysis.pricePerSquareFoot)}
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-center text-sm text-gray-500 mb-1">
              <Home className="h-4 w-4 mr-1 text-gray-400" />
              <span>Neighborhood Avg. (per Sq.Ft.)</span>
            </div>
            <div className="text-lg font-medium">
              {formatCurrency(analysis.neighborhoodAveragePricePerSquareFoot)}
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-center text-sm text-gray-500 mb-1">
              <ArrowUpDown className="h-4 w-4 mr-1 text-gray-400" />
              <span>Difference</span>
            </div>
            <div className={`text-lg font-medium ${getPercentColor(analysis.percentageDifference)}`}>
              {analysis.percentageDifference > 0 ? '+' : ''}{formatPercentage(analysis.percentageDifference)}
            </div>
          </div>
        </div>
        
        {/* Relative Value Position */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Undervalued</span>
            <span>Market Value</span>
            <span>Overvalued</span>
          </div>
          <Progress 
            value={getProgressValue(analysis.percentageDifference)} 
            className={`h-2 ${getProgressColor(analysis.percentageDifference)}`}
          />
        </div>
        
        <Separator className="my-4" />
        
        {/* Suggested Value Range */}
        {analysis.suggestedValue && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Suggested Value Range</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {formatCurrency(analysis.valueRangeMin || 0)}
              </span>
              <Badge variant="secondary" className="text-md">
                {formatCurrency(analysis.suggestedValue)}
              </Badge>
              <span className="text-sm text-gray-500">
                {formatCurrency(analysis.valueRangeMax || 0)}
              </span>
            </div>
          </div>
        )}
        
        {!analysis.suggestedValue && (
          <div className="text-center text-gray-500 py-2">
            <AlertCircle className="h-10 w-10 mx-auto text-amber-400 mb-2" />
            <p className="text-sm">
              Not enough comparable data to suggest a value range for this property.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};