/**
 * ETL Optimization Service
 * 
 * This service analyzes ETL jobs, pipelines, and runs to provide AI-powered
 * optimization suggestions for improving performance, data quality, and efficiency.
 */

import { ETLJob, JobRun, DataSource, DataTransformation } from './ETLPipeline';

/**
 * Optimization suggestion severity level
 */
export enum SuggestionSeverity {
  Info = 'info',
  Warning = 'warning',
  Critical = 'critical'
}

/**
 * Optimization suggestion category
 */
export enum SuggestionCategory {
  Performance = 'performance',
  DataQuality = 'dataQuality',
  ResourceUsage = 'resourceUsage',
  Pipeline = 'pipeline',
  Schedule = 'schedule'
}

/**
 * Interface for optimization suggestions
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
  appliedAt?: Date;
  createdAt: Date;
}

/**
 * AI ETL Optimization Service
 */
export class OptimizationService {
  private suggestions: Map<string, OptimizationSuggestion> = new Map();
  
  // Singleton instance
  private static instance: OptimizationService;
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  public static getInstance(): OptimizationService {
    if (!OptimizationService.instance) {
      OptimizationService.instance = new OptimizationService();
    }
    return OptimizationService.instance;
  }
  
  /**
   * Analyze an ETL job and generate optimization suggestions
   */
  public analyzeJob(
    job: ETLJob, 
    jobRuns: JobRun[], 
    sources: DataSource[], 
    transformations: DataTransformation[]
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const now = new Date();
    
    // Skip analysis for jobs that are not enabled
    if (!job.enabled) return suggestions;
    
    // Get the sources and transformations for this job
    const jobSources = sources.filter(s => job.sources.includes(s.id));
    const jobTransformations = transformations
      .filter(t => job.transformations.includes(t.id))
      .sort((a, b) => a.order - b.order);
    
    // Get the most recent job runs (up to 5)
    const recentRuns = jobRuns
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, 5);
    
    // ===== Performance Analysis =====
    
    // Check for long-running jobs (over 30 seconds)
    if (recentRuns.length > 0) {
      const longRunningJobs = recentRuns.filter(run => {
        if (!run.endTime) return false;
        const duration = new Date(run.endTime).getTime() - new Date(run.startTime).getTime();
        return duration > 30000; // 30 seconds
      });
      
      if (longRunningJobs.length > 0) {
        const avgDuration = longRunningJobs.reduce((sum, run) => {
          if (!run.endTime) return sum;
          return sum + (new Date(run.endTime).getTime() - new Date(run.startTime).getTime());
        }, 0) / longRunningJobs.length;
        
        suggestions.push({
          id: `perf-long-running-${job.id}`,
          jobId: job.id,
          title: 'Long-running ETL job detected',
          description: `This job takes an average of ${Math.round(avgDuration / 1000)} seconds to complete, which may impact system performance.`,
          severity: SuggestionSeverity.Warning,
          category: SuggestionCategory.Performance,
          actionable: true,
          recommendation: 'Consider adding more selective filters early in the pipeline or breaking the job into smaller tasks.',
          createdAt: now
        });
      }
    }
    
    // Check for failed jobs
    const failedRuns = recentRuns.filter(run => run.status === 'failed');
    if (failedRuns.length > 0) {
      const failureRate = (failedRuns.length / recentRuns.length) * 100;
      
      suggestions.push({
        id: `reliability-failed-${job.id}`,
        jobId: job.id,
        title: 'ETL job failures detected',
        description: `This job has a ${failureRate.toFixed(0)}% failure rate based on recent runs.`,
        severity: failureRate > 50 ? SuggestionSeverity.Critical : SuggestionSeverity.Warning,
        category: SuggestionCategory.Pipeline,
        actionable: true,
        recommendation: 'Review error logs and consider adding error handling or retry logic.',
        createdAt: now
      });
    }
    
    // ===== Pipeline Structure Analysis =====
    
    // Check for validation transformations
    const hasValidationStep = jobTransformations.some(t => t.type === 'validate');
    if (!hasValidationStep && jobTransformations.length > 0) {
      suggestions.push({
        id: `quality-validation-${job.id}`,
        jobId: job.id,
        title: 'Missing data validation',
        description: 'This ETL pipeline does not include a validation step to ensure data quality.',
        severity: SuggestionSeverity.Warning,
        category: SuggestionCategory.DataQuality,
        actionable: true,
        recommendation: 'Add a validation transformation to check for data integrity and completeness.',
        createdAt: now
      });
    }
    
    // Check for missing schedule
    if (!job.schedule) {
      suggestions.push({
        id: `schedule-missing-${job.id}`,
        jobId: job.id,
        title: 'No automatic schedule',
        description: 'This job is not scheduled to run automatically.',
        severity: SuggestionSeverity.Info,
        category: SuggestionCategory.Schedule,
        actionable: true,
        recommendation: 'Consider setting up a schedule to automate data processing.',
        createdAt: now
      });
    }
    
    // Check for inefficient scheduling
    if (job.schedule && job.schedule.startsWith('*/')) {
      // Parse the schedule to get the frequency
      const minuteMatch = job.schedule.match(/^\*\/(\d+)\s+/);
      if (minuteMatch) {
        const minutes = parseInt(minuteMatch[1], 10);
        if (minutes < 15) {
          suggestions.push({
            id: `schedule-frequency-${job.id}`,
            jobId: job.id,
            title: 'High-frequency job scheduling',
            description: `This job is scheduled to run every ${minutes} minutes, which may be unnecessarily frequent.`,
            severity: SuggestionSeverity.Info,
            category: SuggestionCategory.ResourceUsage,
            actionable: true,
            recommendation: 'Consider reducing the frequency if real-time data is not required.',
            createdAt: now
          });
        }
      }
    }
    
    // Check for redundant transformations
    const transformationTypes = jobTransformations.map(t => t.type);
    const hasDuplicateTransformTypes = transformationTypes.some((type, index) => 
      transformationTypes.indexOf(type) !== index
    );
    
    if (hasDuplicateTransformTypes) {
      suggestions.push({
        id: `pipeline-redundant-${job.id}`,
        jobId: job.id,
        title: 'Potential redundant transformations',
        description: 'This pipeline contains multiple transformations of the same type which may be redundant.',
        severity: SuggestionSeverity.Info,
        category: SuggestionCategory.Pipeline,
        actionable: true,
        recommendation: 'Review the pipeline structure to see if transformations can be combined.',
        createdAt: now
      });
    }
    
    // ===== Source Analysis =====
    
    // Check if job uses multiple sources
    if (jobSources.length > 1) {
      // Check if job has a join transformation
      const hasJoinTransformation = jobTransformations.some(t => t.type === 'join');
      if (!hasJoinTransformation) {
        suggestions.push({
          id: `pipeline-join-${job.id}`,
          jobId: job.id,
          title: 'Multiple sources without join',
          description: 'This job uses multiple data sources but does not have a join transformation.',
          severity: SuggestionSeverity.Info,
          category: SuggestionCategory.Pipeline,
          actionable: true,
          recommendation: 'Consider adding a join transformation to properly combine data from different sources.',
          createdAt: now
        });
      }
    }
    
    // Store the suggestions
    suggestions.forEach(suggestion => {
      this.suggestions.set(suggestion.id, suggestion);
    });
    
    return suggestions;
  }
  
  /**
   * Get all suggestions for a job
   */
  public getSuggestionsForJob(jobId: string): OptimizationSuggestion[] {
    return Array.from(this.suggestions.values())
      .filter(suggestion => suggestion.jobId === jobId)
      .sort((a, b) => {
        // Sort by severity first
        const severityOrder = {
          [SuggestionSeverity.Critical]: 0,
          [SuggestionSeverity.Warning]: 1,
          [SuggestionSeverity.Info]: 2
        };
        
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
  }
  
  /**
   * Get all suggestions
   */
  public getAllSuggestions(): OptimizationSuggestion[] {
    return Array.from(this.suggestions.values())
      .sort((a, b) => {
        // Sort by severity first
        const severityOrder = {
          [SuggestionSeverity.Critical]: 0,
          [SuggestionSeverity.Warning]: 1,
          [SuggestionSeverity.Info]: 2
        };
        
        return severityOrder[a.severity] - severityOrder[b.severity];
      });
  }
  
  /**
   * Mark a suggestion as applied
   */
  public applySuggestion(suggestionId: string): boolean {
    const suggestion = this.suggestions.get(suggestionId);
    
    if (!suggestion) {
      return false;
    }
    
    // Update the suggestion
    suggestion.appliedAt = new Date();
    this.suggestions.set(suggestionId, suggestion);
    
    return true;
  }
  
  /**
   * Dismiss a suggestion
   */
  public dismissSuggestion(suggestionId: string): boolean {
    if (!this.suggestions.has(suggestionId)) {
      return false;
    }
    
    this.suggestions.delete(suggestionId);
    return true;
  }
  
  /**
   * Generate auto-fix for a suggestion if possible
   */
  public generateAutoFix(suggestion: OptimizationSuggestion, job: ETLJob): Partial<ETLJob> | null {
    // Only handle certain suggestion types for now
    switch (suggestion.id) {
      case `quality-validation-${job.id}`:
        // Create a validation step for the job
        return {
          transformations: [
            ...job.transformations,
            'validate-properties' // Add a basic validation transformation
          ]
        };
        
      case `schedule-missing-${job.id}`:
        // Suggest a daily schedule
        return {
          schedule: '0 0 * * *' // Daily at midnight
        };
        
      case `schedule-frequency-${job.id}`:
        // Suggest a less frequent schedule
        if (job.schedule?.startsWith('*/')) {
          const minuteMatch = job.schedule.match(/^\*\/(\d+)\s+/);
          if (minuteMatch) {
            const currentMinutes = parseInt(minuteMatch[1], 10);
            // Suggest hourly if currently less than hourly
            if (currentMinutes < 60) {
              return {
                schedule: '0 */1 * * *' // Hourly
              };
            }
          }
        }
        return null;
        
      default:
        return null;
    }
  }
}

// Export singleton instance
export default OptimizationService.getInstance();