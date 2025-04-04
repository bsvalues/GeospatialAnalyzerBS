import { ETLJob, TransformationRule, DataSource } from './ETLTypes';
import { JobRun } from './ETLPipelineManager';

/**
 * Suggestion Severity Levels
 */
export enum SuggestionSeverity {
  Info = 'info',
  Warning = 'warning',
  Critical = 'critical'
}

/**
 * Suggestion Categories
 */
export enum SuggestionCategory {
  Performance = 'performance',
  DataQuality = 'dataQuality',
  Security = 'security',
  Reliability = 'reliability',
  Cost = 'cost',
  Maintenance = 'maintenance'
}

/**
 * Optimization Suggestion interface
 */
export interface OptimizationSuggestion {
  id: string;
  jobId?: string;
  title: string;
  description: string;
  severity: SuggestionSeverity;
  category: SuggestionCategory;
  actionable: boolean;
  recommendation: string;
  createdAt: Date;
  appliedAt?: Date;
  dismissedAt?: Date;
}

/**
 * OptimizationService provides suggestions for improving ETL jobs
 */
class OptimizationService {
  private suggestions: OptimizationSuggestion[] = [];
  
  constructor() {
    // Initialize
  }
  
  /**
   * Get all suggestions
   */
  getSuggestions(): OptimizationSuggestion[] {
    return this.suggestions;
  }
  
  /**
   * Get active suggestions
   */
  getActiveSuggestions(): OptimizationSuggestion[] {
    return this.suggestions.filter(s => !s.appliedAt && !s.dismissedAt);
  }
  
  /**
   * Get suggestions by job ID
   */
  getSuggestionsByJob(jobId: string): OptimizationSuggestion[] {
    return this.suggestions.filter(s => s.jobId === jobId && !s.appliedAt && !s.dismissedAt);
  }
  
  /**
   * Add a suggestion
   */
  addSuggestion(suggestion: Omit<OptimizationSuggestion, 'id' | 'createdAt'>): OptimizationSuggestion {
    const newSuggestion: OptimizationSuggestion = {
      ...suggestion,
      id: `suggestion-${Date.now()}`,
      createdAt: new Date()
    };
    
    this.suggestions.push(newSuggestion);
    console.log(`Added suggestion: ${newSuggestion.title}`);
    
    return newSuggestion;
  }
  
  /**
   * Mark a suggestion as applied
   */
  markSuggestionAsApplied(id: string): OptimizationSuggestion | undefined {
    const suggestion = this.suggestions.find(s => s.id === id);
    
    if (suggestion && !suggestion.appliedAt) {
      suggestion.appliedAt = new Date();
      console.log(`Marked suggestion as applied: ${suggestion.title}`);
    }
    
    return suggestion;
  }
  
  /**
   * Dismiss a suggestion
   */
  dismissSuggestion(id: string): OptimizationSuggestion | undefined {
    const suggestion = this.suggestions.find(s => s.id === id);
    
    if (suggestion && !suggestion.dismissedAt) {
      suggestion.dismissedAt = new Date();
      console.log(`Dismissed suggestion: ${suggestion.title}`);
    }
    
    return suggestion;
  }
  
  /**
   * Analyze an ETL job for optimization opportunities
   */
  analyzeJob(job: ETLJob, jobRuns: JobRun[], dataSources: DataSource[], transformations: TransformationRule[]): OptimizationSuggestion[] {
    const newSuggestions: OptimizationSuggestion[] = [];
    
    // Get job transformations
    const jobTransformations = job.transformations
      .map(id => transformations.find(t => t.id === id))
      .filter(t => t !== undefined) as TransformationRule[];
    
    // Check for missing validation step
    if (!this.hasValidationStep(jobTransformations)) {
      newSuggestions.push(this.addSuggestion({
        jobId: job.id,
        title: 'Add validation step',
        description: 'This ETL pipeline does not include a validation step to ensure data quality.',
        severity: SuggestionSeverity.Warning,
        category: SuggestionCategory.DataQuality,
        actionable: true,
        recommendation: 'Add a validation transformation to check for data integrity and completeness.'
      }));
    }
    
    // Check job performance
    const averageDuration = this.calculateAverageDuration(jobRuns);
    if (averageDuration > 10 * 60 * 1000) { // 10 minutes
      newSuggestions.push(this.addSuggestion({
        jobId: job.id,
        title: 'Optimize for performance',
        description: `This job takes an average of ${Math.round(averageDuration / 1000 / 60)} minutes to complete.`,
        severity: SuggestionSeverity.Info,
        category: SuggestionCategory.Performance,
        actionable: true,
        recommendation: 'Consider adding filtering earlier in the pipeline or optimizing transformations.'
      }));
    }
    
    // Check for missing error handling
    if (!job.continueOnError) {
      newSuggestions.push(this.addSuggestion({
        jobId: job.id,
        title: 'Add error handling',
        description: 'This job will fail completely if any step encounters an error.',
        severity: SuggestionSeverity.Warning,
        category: SuggestionCategory.Reliability,
        actionable: true,
        recommendation: 'Enable "Continue on Error" for more robust error handling.'
      }));
    }
    
    // Check for scheduling optimization
    if (job.schedule && job.schedule.expression.includes('@hourly')) {
      newSuggestions.push(this.addSuggestion({
        jobId: job.id,
        title: 'Optimize job schedule',
        description: 'This job is scheduled to run hourly, which may be unnecessary for your data.',
        severity: SuggestionSeverity.Info,
        category: SuggestionCategory.Cost,
        actionable: true,
        recommendation: 'Consider reducing the job frequency if data does not change that often.'
      }));
    }
    
    return newSuggestions;
  }
  
  /**
   * Check if job has a validation step
   */
  private hasValidationStep(transformations: TransformationRule[]): boolean {
    return transformations.some(t => t.type === 'VALIDATE');
  }
  
  /**
   * Calculate average job duration
   */
  private calculateAverageDuration(jobRuns: JobRun[]): number {
    if (jobRuns.length === 0) {
      return 0;
    }
    
    let totalDuration = 0;
    let count = 0;
    
    for (const run of jobRuns) {
      if (run.endTime) {
        const duration = new Date(run.endTime).getTime() - new Date(run.startTime).getTime();
        totalDuration += duration;
        count++;
      }
    }
    
    return count > 0 ? totalDuration / count : 0;
  }
}

// Export a singleton instance
export const optimizationService = new OptimizationService();