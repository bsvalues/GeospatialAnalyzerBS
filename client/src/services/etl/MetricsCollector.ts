/**
 * ETL Metrics Collector
 * 
 * This service collects and manages metrics for ETL jobs, including execution time,
 * memory usage, CPU utilization, and error counts.
 */

export interface MemoryUsage {
  initialHeapSize: number;
  finalHeapSize: number;
  peakHeapSize: number;
}

export interface TaskMetrics {
  taskId: string;
  taskName: string;
  startTime: Date;
  endTime: Date | null;
  executionTime: number;
  recordsProcessed: number;
}

export interface ETLJobMetrics {
  jobId: string;
  jobName: string;
  startTime: Date;
  endTime: Date | null;
  executionTime: number;
  taskMetrics: TaskMetrics[];
  recordsProcessed: number;
  errorCount: number;
  memoryUsage: MemoryUsage;
  cpuUtilization: number; // percentage of available CPU
}

type MetricsUpdateCallback = (metrics: ETLJobMetrics) => void;

/**
 * Metrics Collector Service
 */
class MetricsCollector {
  private activeJobMetrics: Map<string, ETLJobMetrics>;
  private historicalMetrics: ETLJobMetrics[];
  private updateCallbacks: MetricsUpdateCallback[];

  constructor() {
    this.activeJobMetrics = new Map();
    this.historicalMetrics = [];
    this.updateCallbacks = [];
  }

  /**
   * Start collecting metrics for a job
   */
  startJobMetrics(jobId: string, jobName: string): ETLJobMetrics {
    const metrics: ETLJobMetrics = {
      jobId,
      jobName,
      startTime: new Date(),
      endTime: null,
      executionTime: 0,
      taskMetrics: [],
      recordsProcessed: 0,
      errorCount: 0,
      memoryUsage: {
        initialHeapSize: this.getCurrentHeapSize(),
        finalHeapSize: 0,
        peakHeapSize: this.getCurrentHeapSize()
      },
      cpuUtilization: 0
    };

    this.activeJobMetrics.set(jobId, metrics);
    return metrics;
  }

  /**
   * Get current metrics for a job (both active and historical)
   */
  getJobMetrics(jobId: string): ETLJobMetrics | null {
    // Check active jobs first
    const activeMetrics = this.activeJobMetrics.get(jobId);
    if (activeMetrics) {
      // Update execution time for active jobs
      if (!activeMetrics.endTime) {
        activeMetrics.executionTime = this.calculateExecutionTime(activeMetrics.startTime);
      }
      return activeMetrics;
    }

    // Then check historical metrics
    const historicalMetrics = this.historicalMetrics.find(m => m.jobId === jobId);
    return historicalMetrics || null;
  }

  /**
   * Get all historical job metrics
   */
  getHistoricalJobMetrics(): ETLJobMetrics[] {
    return [...this.historicalMetrics];
  }

  /**
   * Complete metrics collection for a job
   */
  completeJobMetrics(jobId: string): ETLJobMetrics | null {
    const metrics = this.activeJobMetrics.get(jobId);
    if (!metrics) return null;

    // Capture final metrics
    metrics.endTime = new Date();
    metrics.executionTime = this.calculateExecutionTime(metrics.startTime, metrics.endTime);
    metrics.memoryUsage.finalHeapSize = this.getCurrentHeapSize();
    metrics.cpuUtilization = this.calculateCpuUtilization();

    // Calculate total records processed from all tasks
    metrics.recordsProcessed = metrics.taskMetrics.reduce(
      (total, task) => total + task.recordsProcessed, 
      0
    );

    // Move to historical metrics
    this.historicalMetrics.push({ ...metrics });
    
    // Notify subscribers
    this.notifyMetricsUpdated(metrics);

    return metrics;
  }

  /**
   * Start collecting metrics for a task
   */
  startTaskMetrics(jobId: string, taskId: string, taskName: string): TaskMetrics | null {
    const jobMetrics = this.activeJobMetrics.get(jobId);
    if (!jobMetrics) return null;

    const taskMetrics: TaskMetrics = {
      taskId,
      taskName,
      startTime: new Date(),
      endTime: null,
      executionTime: 0,
      recordsProcessed: 0
    };

    jobMetrics.taskMetrics.push(taskMetrics);
    
    // Update job metrics with current memory usage
    const currentHeapSize = this.getCurrentHeapSize();
    if (currentHeapSize > jobMetrics.memoryUsage.peakHeapSize) {
      jobMetrics.memoryUsage.peakHeapSize = currentHeapSize;
    }

    // Notify subscribers
    this.notifyMetricsUpdated(jobMetrics);

    return taskMetrics;
  }

  /**
   * Complete metrics collection for a task
   */
  completeTaskMetrics(jobId: string, taskId: string): TaskMetrics | null {
    const jobMetrics = this.activeJobMetrics.get(jobId);
    if (!jobMetrics) return null;

    const taskMetrics = jobMetrics.taskMetrics.find(t => t.taskId === taskId);
    if (!taskMetrics) return null;

    // Capture final metrics
    taskMetrics.endTime = new Date();
    taskMetrics.executionTime = this.calculateExecutionTime(
      taskMetrics.startTime, 
      taskMetrics.endTime
    );

    // Update job metrics with current memory usage
    const currentHeapSize = this.getCurrentHeapSize();
    if (currentHeapSize > jobMetrics.memoryUsage.peakHeapSize) {
      jobMetrics.memoryUsage.peakHeapSize = currentHeapSize;
    }

    // Notify subscribers
    this.notifyMetricsUpdated(jobMetrics);

    return taskMetrics;
  }

  /**
   * Update record count for a task
   */
  updateRecordCount(
    jobId: string, 
    recordCount: number, 
    taskId?: string
  ): boolean {
    const jobMetrics = this.activeJobMetrics.get(jobId);
    if (!jobMetrics) return false;

    if (taskId) {
      // Update record count for specific task
      const taskMetrics = jobMetrics.taskMetrics.find(t => t.taskId === taskId);
      if (!taskMetrics) return false;
      taskMetrics.recordsProcessed = recordCount;
    } else {
      // Update job-level record count
      jobMetrics.recordsProcessed = recordCount;
    }

    // Notify subscribers
    this.notifyMetricsUpdated(jobMetrics);

    return true;
  }

  /**
   * Record an error occurrence
   */
  recordError(jobId: string): boolean {
    const jobMetrics = this.activeJobMetrics.get(jobId);
    if (!jobMetrics) return false;

    jobMetrics.errorCount++;

    // Notify subscribers
    this.notifyMetricsUpdated(jobMetrics);

    return true;
  }

  /**
   * Subscribe to metrics updates
   */
  subscribeToMetricsUpdates(callback: MetricsUpdateCallback): () => void {
    this.updateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify subscribers of metrics updates
   */
  private notifyMetricsUpdated(metrics: ETLJobMetrics): void {
    this.updateCallbacks.forEach(callback => {
      callback({ ...metrics });
    });
  }

  /**
   * Calculate execution time between two timestamps
   */
  private calculateExecutionTime(startTime: Date, endTime: Date | null = null): number {
    const end = endTime || new Date();
    return end.getTime() - startTime.getTime();
  }

  /**
   * Get current heap size (using performance API when available)
   */
  private getCurrentHeapSize(): number {
    // Note: performance.memory is a non-standard Chrome-only feature
    // TypeScript doesn't have types for it by default, so we use this workaround
    const perf = performance as any;
    if (typeof perf !== 'undefined' && 
        perf.memory && 
        perf.memory.usedJSHeapSize) {
      return perf.memory.usedJSHeapSize;
    }
    // Fallback when actual memory metrics aren't available
    return Math.floor(Math.random() * 1000000) + 500000;
  }

  /**
   * Calculate CPU utilization (mockup implementation)
   */
  private calculateCpuUtilization(): number {
    // This is a mockup implementation since browsers don't provide direct CPU metrics
    // In a production app, this could be approximated using task execution times
    // or could be provided by server-side metrics
    return Math.min(95, Math.floor(Math.random() * 60) + 20);
  }
}

// Singleton instance
export const metricsCollector = new MetricsCollector();