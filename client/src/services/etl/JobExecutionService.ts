/**
 * JobExecutionService.ts
 * 
 * Service for executing, tracking, and managing ETL jobs
 */

import { ETLJob, JobStatus, ETLJobResult } from './ETLTypes';

// Browser compatibility: Using Record instead of Map
interface RunningJob {
  job: ETLJob;
  abortController: AbortController;
}

class JobExecutionService {
  // Track running jobs using Record for browser compatibility
  private runningJobs: Record<number, RunningJob> = {};
  
  /**
   * Start job execution 
   */
  async startJob(job: ETLJob): Promise<void> {
    // Create abort controller for this job
    const abortController = new AbortController();
    
    // Register as running job
    this.runningJobs[job.id] = {
      job,
      abortController
    };
    
    // Update job status
    job.status = JobStatus.RUNNING;
    job.lastRun = new Date();
  }
  
  /**
   * Complete job execution
   */
  completeJob(job: ETLJob, result: ETLJobResult): void {
    // Update job status
    job.status = result.status;
    
    // Remove from running jobs
    delete this.runningJobs[job.id];
    
    console.log(`Job ${job.id} completed with status: ${result.status}`);
  }
  
  /**
   * Abort a running job
   */
  abortJob(jobId: number): boolean {
    const runningJob = this.runningJobs[jobId];
    
    if (!runningJob) {
      console.warn(`Job ${jobId} is not running, cannot abort`);
      return false;
    }
    
    try {
      // Signal abort
      runningJob.abortController.abort();
      
      // Update job status
      runningJob.job.status = JobStatus.ABORTED;
      
      // Remove from running jobs
      delete this.runningJobs[jobId];
      
      console.log(`Job ${jobId} aborted`);
      return true;
    } catch (error) {
      console.error(`Error aborting job ${jobId}:`, error);
      return false;
    }
  }
  
  /**
   * Check if a job is currently running
   */
  isJobRunning(jobId: number): boolean {
    return this.runningJobs[jobId] !== undefined;
  }
  
  /**
   * Get list of all running jobs
   */
  getRunningJobs(): ETLJob[] {
    return Object.values(this.runningJobs).map(({ job }) => job);
  }
  
  /**
   * Get abort signal for a running job
   */
  getJobAbortSignal(jobId: number): AbortSignal | null {
    const runningJob = this.runningJobs[jobId];
    
    if (!runningJob) {
      return null;
    }
    
    return runningJob.abortController.signal;
  }
  
  /**
   * Add job execution progress event listener
   */
  onJobProgress(jobId: number, callback: (progress: number) => void): () => void {
    // This is a simplified implementation
    // In a real system, this would connect to a more robust event system
    
    const eventName = `job-progress-${jobId}`;
    const listener = (event: CustomEvent) => {
      callback(event.detail.progress);
    };
    
    window.addEventListener(eventName, listener as EventListener);
    
    // Return function to remove the listener
    return () => {
      window.removeEventListener(eventName, listener as EventListener);
    };
  }
  
  /**
   * Update job progress
   */
  updateJobProgress(jobId: number, progress: number): void {
    // Check if job is running
    if (!this.isJobRunning(jobId)) {
      console.warn(`Cannot update progress for job ${jobId}, it is not running`);
      return;
    }
    
    // Emit progress event
    const event = new CustomEvent(`job-progress-${jobId}`, {
      detail: { progress }
    });
    
    window.dispatchEvent(event);
  }
}

// Export a singleton instance
export const jobExecutionService = new JobExecutionService();