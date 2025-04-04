import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Tooltip from '@/components/ui/tooltip';
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@radix-ui/react-tooltip';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Check, Info, Plus, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface TransformationConfig {
  [key: string]: any;
}

interface TransformationRuleSuggestion {
  name: string;
  description: string;
  sourceField: string;
  targetField: string;
  transformationType: string;
  transformationConfig: TransformationConfig;
  isEnabled: boolean;
}

interface DataQualityIssue {
  field: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

interface TransformationRuleSuggestionsProps {
  issues: DataQualityIssue[];
  onRefresh?: () => void;
  onRuleCreated?: () => void;
}

export const TransformationRuleSuggestions: React.FC<TransformationRuleSuggestionsProps> = ({
  issues,
  onRefresh,
  onRuleCreated,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedRules, setSuggestedRules] = useState<TransformationRuleSuggestion[]>([]);
  const [creatingRule, setCreatingRule] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSuggestions = async () => {
    if (!issues || issues.length === 0) {
      toast({
        title: 'No issues to analyze',
        description: 'No data quality issues found to create transformation rules for.',
        variant: 'default',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest(
        'POST',
        '/api/etl/suggest-transformation-rules',
        { issues }
      ) as { count: number; suggestions: TransformationRuleSuggestion[] };

      if (response.suggestions && Array.isArray(response.suggestions)) {
        setSuggestedRules(response.suggestions);
        toast({
          title: 'Transformation rules generated',
          description: `${response.suggestions.length} transformation rules have been suggested.`,
          variant: 'default',
        });
      } else {
        toast({
          title: 'No suggestions available',
          description: 'Unable to generate transformation rule suggestions.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching transformation rule suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch transformation rule suggestions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createRule = async (rule: TransformationRuleSuggestion) => {
    setCreatingRule(rule.name);
    try {
      await apiRequest(
        'POST',
        '/api/etl/transformation-rules',
        rule
      );

      toast({
        title: 'Transformation rule created',
        description: `"${rule.name}" has been created successfully.`,
        variant: 'default',
      });

      // Remove the rule from suggestions after it's been created
      setSuggestedRules(prev => prev.filter(r => r.name !== rule.name));
      
      // Notify parent component if needed
      if (onRuleCreated) {
        onRuleCreated();
      }
    } catch (error) {
      console.error('Error creating transformation rule:', error);
      toast({
        title: 'Error',
        description: 'Failed to create the transformation rule. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreatingRule(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTransformationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      fillMissingValues: 'Fill Missing',
      validation: 'Validate',
      numberTransform: 'Number Operation',
      deduplicate: 'Deduplicate',
      dateValidation: 'Date Validation',
      qualityScore: 'Quality Score',
      addressStandardization: 'Address Format'
    };
    
    return labels[type] || type;
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gray-50">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Transformation Rule Suggestions</CardTitle>
            <CardDescription>
              Suggested transformation rules based on data quality issues
            </CardDescription>
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Issues
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={fetchSuggestions}
              disabled={isLoading || !issues || issues.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Generate Suggestions
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <>
            {suggestedRules.length === 0 ? (
              <div className="text-center py-6">
                <Info className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <h3 className="text-lg font-medium">No Suggestions Available</h3>
                <p className="text-gray-500 mt-1">
                  {issues && issues.length > 0
                    ? 'Click "Generate Suggestions" to create transformation rules based on data issues.'
                    : 'No data quality issues found to create transformation rules for.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {suggestedRules.map((rule, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">{rule.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">{rule.description}</p>
                        
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">
                            {rule.sourceField} → {rule.targetField}
                          </Badge>
                          <Badge>
                            {getTransformationTypeLabel(rule.transformationType)}
                          </Badge>
                        </div>
                      </div>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="default" 
                              size="sm"
                              disabled={creatingRule === rule.name}
                              onClick={() => createRule(rule)}
                            >
                              {creatingRule === rule.name ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Create Rule
                                </>
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Add this transformation rule</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {rule.transformationConfig && Object.keys(rule.transformationConfig).length > 0 && (
                      <>
                        <Separator className="my-3" />
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(rule.transformationConfig).map(([key, value]) => (
                            <div key={key} className="flex items-center">
                              <span className="font-medium text-gray-600 mr-2">{key}:</span>
                              <span>
                                {typeof value === 'object' 
                                  ? JSON.stringify(value) 
                                  : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>

      <CardFooter className="bg-gray-50 border-t px-6 py-3">
        <div className="w-full flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {suggestedRules.length} suggestions available
          </div>
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Suggestions are based on detected data quality issues</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default TransformationRuleSuggestions;