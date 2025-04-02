/**
 * ETL Metrics Collector Service
 * 
 * This service collects and analyzes performance metrics for ETL jobs.
 */

export interface ETLJobMetrics {
  jobId: string;
  executionTime: number; // in milliseconds
  startTime: Date;
  endTime: Date | null;
  memoryUsage: {
    initialHeapSize: number;
    peakHeapSize: number;
    finalHeapSize: number;
  };
  cpuUtilization: number; // percentage
  recordsProcessed: number;
  errorCount: number;
  taskMetrics: {
    taskId: string;
    taskName: string;
    startTime: Date;
    endTime: Date | null;
    executionTime: number;
    recordsProcessed: number;
  }[];
}

export type MetricsSnapshot = Omit<ETLJobMetrics, 'endTime' | 'taskMetrics'> & {
  endTime: Date | null;
  taskMetrics: {
    taskId: string;
    taskName: string;
    startTime: Date;
    endTime: Date | null;
    executionTime: number;
    recordsProcessed: number;
  }[];
}

export class MetricsCollector {
  private activeJobMetrics: Map<string, ETLJobMetrics> = new Map();
  private historicalMetrics: ETLJobMetrics[] = [];
  private listeners: ((metrics: MetricsSnapshot) => void)[] = [];

  /**
   * Start collecting metrics for a job
   */
  startJobMetrics(jobId: string, jobName: string): void {
    const startTime = new Date();
    
    // Get initial memory usage from browser
    const initialMemory = window.performance && (performance as any).memory 
      ? (performance as any).memory.usedJSHeapSize 
      : 0;
    
    const metrics: ETLJobMetrics = {
      jobId,
      executionTime: 0,
      startTime,
      endTime: null,
      memoryUsage: {
        initialHeapSize: initialMemory,
        peakHeapSize: initialMemory,
        finalHeapSize: initialMemory
      },
      cpuUtilization: 0,
      recordsProcessed: 0,
      errorCount: 0,
      taskMetrics: []
    };
    
    this.activeJobMetrics.set(jobId, metrics);
    this.notifyListeners(jobId);
    
    // Start periodic collection
    this.scheduleMetricsUpdate(jobId);
  }
  
  /**
   * Schedule periodic updates of metrics while job is running
   */
  private scheduleMetricsUpdate(jobId: string): void {
    // Only schedule if job is still active
    if (!this.activeJobMetrics.has(jobId)) return;
    
    // Update metrics
    this.updateJobMetrics(jobId);
    
    // Schedule next update
    setTimeout(() => this.scheduleMetricsUpdate(jobId), 1000);
  }
  
  /**
   * Update metrics for an active job
   */
  private updateJobMetrics(jobId: string): void {
    const metrics = this.activeJobMetrics.get(jobId);
    if (!metrics) return;
    
    // Update execution time
    const currentTime = new Date();
    metrics.executionTime = currentTime.getTime() - metrics.startTime.getTime();
    
    // Update memory usage if available in browser
    if (window.performance && (performance as any).memory) {
      const currentHeapSize = (performance as any).memory.usedJSHeapSize;
      metrics.memoryUsage.peakHeapSize = Math.max(
        metrics.memoryUsage.peakHeapSize,
        currentHeapSize
      );
    }
    
    // Estimate CPU utilization (not accurate in browser environment)
    // In a real implementation, this would use server-side metrics
    metrics.cpuUtilization = Math.min(
      100,
      Math.random() * 30 + metrics.taskMetrics.length * 10
    );
    
    this.notifyListeners(jobId);
  }
  
  /**
   * Start collecting metrics for a task within a job
   */
  startTaskMetrics(jobId: string, taskId: string, taskName: string): void {
    const metrics = this.activeJobMetrics.get(jobId);
    if (!metrics) return;
    
    metrics.taskMetrics.push({
      taskId,
      taskName,
      startTime: new Date(),
      endTime: null,
      executionTime: 0,
      recordsProcessed: 0
    });
    
    this.notifyListeners(jobId);
  }
  
  /**
   * Update record count for a job or task
   */
  updateRecordCount(jobId: string, count: number, taskId?: string): void {
    const metrics = this.activeJobMetrics.get(jobId);
    if (!metrics) return;
    
    if (taskId) {
      const taskMetric = metrics.taskMetrics.find(t => t.taskId === taskId);
      if (taskMetric) {
        taskMetric.recordsProcessed = count;
      }
    } else {
      metrics.recordsProcessed = count;
    }
    
    this.notifyListeners(jobId);
  }
  
  /**
   * Increment error count for a job
   */
  incrementErrorCount(jobId: string): void {
    const metrics = this.activeJobMetrics.get(jobId);
    if (!metrics) return;
    
    metrics.errorCount++;
    this.notifyListeners(jobId);
  }
  
  /**
   * Complete metrics collection for a task
   */
  completeTaskMetrics(jobId: string, taskId: string): void {
    const metrics = this.activeJobMetrics.get(jobId);
    if (!metrics) return;
    
    const taskMetric = metrics.taskMetrics.find(t => t.taskId === taskId);
    if (taskMetric) {
      const endTime = new Date();
      taskMetric.endTime = endTime;
      taskMetric.executionTime = endTime.getTime() - taskMetric.startTime.getTime();
    }
    
    this.notifyListeners(jobId);
  }
  
  /**
   * Complete metrics collection for a job
   */
  completeJobMetrics(jobId: string): ETLJobMetrics | null {
    const metrics = this.activeJobMetrics.get(jobId);
    if (!metrics) return null;
    
    // Set final timestamps and metrics
    const endTime = new Date();
    metrics.endTime = endTime;
    metrics.executionTime = endTime.getTime() - metrics.startTime.getTime();
    
    // Update final memory usage if available
    if (window.performance && (performance as any).memory) {
      metrics.memoryUsage.finalHeapSize = (performance as any).memory.usedJSHeapSize;
    }
    
    // Move to historical metrics
    this.activeJobMetrics.delete(jobId);
    this.historicalMetrics.push({ ...metrics });
    
    this.notifyListeners(jobId);
    return metrics;
  }
  
  /**
   * Get current metrics for a job
   */
  getJobMetrics(jobId: string): ETLJobMetrics | null {
    // Check active jobs first
    const activeMetrics = this.activeJobMetrics.get(jobId);
    if (activeMetrics) return { ...activeMetrics };
    
    // Check historical metrics
    const historicalMetrics = this.historicalMetrics.find(m => m.jobId === jobId);
    return historicalMetrics ? { ...historicalMetrics } : null;
  }
  
  /**
   * Get all active job metrics
   */
  getAllActiveJobMetrics(): ETLJobMetrics[] {
    return Array.from(this.activeJobMetrics.values()).map(metrics => ({ ...metrics }));
  }
  
  /**
   * Get all historical job metrics
   */
  getHistoricalJobMetrics(): ETLJobMetrics[] {
    return [...this.historicalMetrics];
  }
  
  /**
   * Subscribe to metrics updates
   */
  subscribeToMetricsUpdates(listener: (metrics: MetricsSnapshot) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Notify listeners of metrics updates
   */
  private notifyListeners(jobId: string): void {
    const metrics = this.activeJobMetrics.get(jobId);
    if (!metrics) return;
    
    const snapshot: MetricsSnapshot = {
      jobId: metrics.jobId,
      executionTime: metrics.executionTime,
      startTime: metrics.startTime,
      endTime: metrics.endTime,
      memoryUsage: { ...metrics.memoryUsage },
      cpuUtilization: metrics.cpuUtilization,
      recordsProcessed: metrics.recordsProcessed,
      errorCount: metrics.errorCount,
      taskMetrics: metrics.taskMetrics.map(task => ({ ...task }))
    };
    
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

// Export singleton instance
export const metricsCollector = new MetricsCollector();