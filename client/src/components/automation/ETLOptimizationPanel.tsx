/**
 * ETL Optimization Panel Component
 * 
 * Displays AI-powered optimization suggestions for ETL jobs
 * and allows users to apply or dismiss them.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangleIcon, AlertCircleIcon, InfoIcon, ZapIcon, XCircleIcon, CheckCircleIcon, FilterIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import OptimizationService, { OptimizationSuggestion, SuggestionSeverity, SuggestionCategory } from '../../services/etl/OptimizationService';
import ETLPipeline, { ETLJob, JobRun, DataSource, DataTransformation } from '../../services/etl/ETLPipeline';

/**
 * Properties for the ETL optimization panel
 */
interface ETLOptimizationPanelProps {
  selectedJobId?: string;
  onApplySuggestion?: (job: ETLJob) => void;
  className?: string;
}

/**
 * Suggestion badge component
 */
const SuggestionBadge: React.FC<{ severity: SuggestionSeverity }> = ({ severity }) => {
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
  let icon = <InfoIcon className="h-3.5 w-3.5 mr-1" />;
  
  switch (severity) {
    case SuggestionSeverity.Critical:
      variant = 'destructive';
      icon = <AlertCircleIcon className="h-3.5 w-3.5 mr-1" />;
      break;
    case SuggestionSeverity.Warning:
      variant = 'default';
      icon = <AlertTriangleIcon className="h-3.5 w-3.5 mr-1" />;
      break;
    case SuggestionSeverity.Info:
      variant = 'secondary';
      icon = <InfoIcon className="h-3.5 w-3.5 mr-1" />;
      break;
  }
  
  return (
    <Badge variant={variant} className="flex items-center">
      {icon}
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  );
};

/**
 * Category badge component
 */
const CategoryBadge: React.FC<{ category: SuggestionCategory }> = ({ category }) => {
  const displayName = {
    performance: 'Performance',
    dataQuality: 'Data Quality',
    resourceUsage: 'Resource Usage',
    pipeline: 'Pipeline Structure',
    schedule: 'Scheduling'
  }[category] || category;
  
  return (
    <Badge variant="outline" className="bg-muted text-muted-foreground">
      {displayName}
    </Badge>
  );
};

/**
 * ETL Optimization Panel Component
 */
const ETLOptimizationPanel: React.FC<ETLOptimizationPanelProps> = ({ 
  selectedJobId,
  onApplySuggestion,
  className = ''
}) => {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<SuggestionSeverity | 'all'>('all');
  
  // Load suggestions when the component mounts or selected job changes
  useEffect(() => {
    loadSuggestions();
  }, [selectedJobId]);
  
  // Load suggestions from the optimization service
  const loadSuggestions = async () => {
    setLoading(true);
    
    try {
      // Get all jobs, sources, and transformations
      const jobs = ETLPipeline.getJobs();
      const sources = ETLPipeline.getDataSources();
      const transformations = ETLPipeline.getTransformations();
      
      // Clear existing suggestions when reloading
      let allSuggestions: OptimizationSuggestion[] = [];
      
      if (selectedJobId) {
        // Analyze a specific job
        const job = jobs.find(j => j.id === selectedJobId);
        if (job) {
          const jobRuns = ETLPipeline.getJobRuns(job.id);
          allSuggestions = OptimizationService.analyzeJob(job, jobRuns, sources, transformations);
        }
      } else {
        // Analyze all jobs
        for (const job of jobs) {
          const jobRuns = ETLPipeline.getJobRuns(job.id);
          const jobSuggestions = OptimizationService.analyzeJob(job, jobRuns, sources, transformations);
          allSuggestions = [...allSuggestions, ...jobSuggestions];
        }
      }
      
      // Filter suggestions based on selection
      if (selectedJobId) {
        setSuggestions(allSuggestions.filter(s => s.jobId === selectedJobId));
      } else {
        setSuggestions(allSuggestions);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load optimization suggestions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Apply a suggestion to a job
  const handleApplySuggestion = (suggestion: OptimizationSuggestion) => {
    try {
      if (!suggestion.jobId) {
        console.error('Cannot apply suggestion: No job ID');
        return;
      }
      
      const job = ETLPipeline.getJob(suggestion.jobId);
      if (!job) {
        console.error('Cannot apply suggestion: Job not found');
        return;
      }
      
      // Generate auto-fix for the suggestion
      const autoFix = OptimizationService.generateAutoFix(suggestion, job);
      
      if (!autoFix) {
        toast({
          title: 'Cannot Apply Automatically',
          description: 'This suggestion requires manual implementation.',
          variant: 'default'
        });
        return;
      }
      
      // Apply the fix
      ETLPipeline.updateJob(job.id, autoFix);
      
      // Mark suggestion as applied
      OptimizationService.applySuggestion(suggestion.id);
      
      // Update suggestions list
      setSuggestions(prevSuggestions => 
        prevSuggestions.filter(s => s.id !== suggestion.id)
      );
      
      // Notify parent component
      if (onApplySuggestion) {
        onApplySuggestion({ ...job, ...autoFix });
      }
      
      toast({
        title: 'Suggestion Applied',
        description: 'The optimization suggestion has been applied successfully.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error applying suggestion:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply optimization suggestion',
        variant: 'destructive'
      });
    }
  };
  
  // Dismiss a suggestion
  const handleDismissSuggestion = (suggestionId: string) => {
    try {
      OptimizationService.dismissSuggestion(suggestionId);
      
      // Update suggestions list
      setSuggestions(prevSuggestions => 
        prevSuggestions.filter(s => s.id !== suggestionId)
      );
      
      toast({
        title: 'Suggestion Dismissed',
        description: 'The suggestion has been dismissed.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error dismissing suggestion:', error);
    }
  };
  
  // Filter suggestions by severity
  const filteredSuggestions = activeFilter === 'all'
    ? suggestions
    : suggestions.filter(s => s.severity === activeFilter);
  
  // Get job name for a suggestion
  const getJobName = (jobId?: string) => {
    if (!jobId) return 'System';
    
    const job = ETLPipeline.getJob(jobId);
    return job ? job.name : jobId;
  };
  
  return (
    <Card className={`${className} shadow-lg`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ZapIcon className="h-5 w-5 text-primary" />
          AI-Powered Optimization Suggestions
        </CardTitle>
        <CardDescription>
          Intelligent suggestions to improve your ETL workflows based on analysis of your pipelines and job execution history
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="border-b border-border px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FilterIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter:</span>
              <div className="flex space-x-1">
                <Button 
                  size="sm" 
                  variant={activeFilter === 'all' ? 'secondary' : 'ghost'} 
                  onClick={() => setActiveFilter('all')}
                  className="text-xs h-8"
                >
                  All
                </Button>
                <Button 
                  size="sm" 
                  variant={activeFilter === SuggestionSeverity.Critical ? 'secondary' : 'ghost'} 
                  onClick={() => setActiveFilter(SuggestionSeverity.Critical)}
                  className="text-xs h-8"
                >
                  Critical
                </Button>
                <Button 
                  size="sm" 
                  variant={activeFilter === SuggestionSeverity.Warning ? 'secondary' : 'ghost'} 
                  onClick={() => setActiveFilter(SuggestionSeverity.Warning)}
                  className="text-xs h-8"
                >
                  Warning
                </Button>
                <Button 
                  size="sm" 
                  variant={activeFilter === SuggestionSeverity.Info ? 'secondary' : 'ghost'} 
                  onClick={() => setActiveFilter(SuggestionSeverity.Info)}
                  className="text-xs h-8"
                >
                  Info
                </Button>
              </div>
            </div>
            
            <Button 
              size="sm" 
              variant="outline" 
              onClick={loadSuggestions}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-pulse">Loading suggestions...</div>
          </div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground px-6">
            <CheckCircleIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
            <p>
              {suggestions.length === 0
                ? "No optimization suggestions found. Your ETL pipelines look good!"
                : "No suggestions match the selected filter."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredSuggestions.map(suggestion => (
              <div key={suggestion.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <SuggestionBadge severity={suggestion.severity} />
                      <CategoryBadge category={suggestion.category} />
                    </div>
                    <h3 className="text-base font-medium">{suggestion.title}</h3>
                    {!selectedJobId && suggestion.jobId && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Job: {getJobName(suggestion.jobId)}
                      </p>
                    )}
                    <p className="text-muted-foreground mt-1 text-sm">
                      {suggestion.description}
                    </p>
                  </div>
                  
                  <div className="flex items-start space-x-2">
                    {suggestion.actionable && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-xs flex items-center gap-1"
                        onClick={() => handleApplySuggestion(suggestion)}
                      >
                        <ZapIcon className="h-3.5 w-3.5" />
                        Apply
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-xs flex items-center gap-1"
                      onClick={() => handleDismissSuggestion(suggestion.id)}
                    >
                      <XCircleIcon className="h-3.5 w-3.5" />
                      Dismiss
                    </Button>
                  </div>
                </div>
                
                <div className="mt-3 text-sm bg-muted p-3 rounded-md">
                  <strong>Recommendation:</strong> {suggestion.recommendation}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="bg-muted/20 flex justify-between px-6 py-4 text-sm text-muted-foreground">
        <div>
          Total suggestions: {suggestions.length}
        </div>
        <div>
          <span className="text-destructive font-medium">{suggestions.filter(s => s.severity === SuggestionSeverity.Critical).length}</span> critical,{' '}
          <span className="text-primary font-medium">{suggestions.filter(s => s.severity === SuggestionSeverity.Warning).length}</span> warnings,{' '}
          <span className="text-muted-foreground font-medium">{suggestions.filter(s => s.severity === SuggestionSeverity.Info).length}</span> informational
        </div>
      </CardFooter>
    </Card>
  );
};

export default ETLOptimizationPanel;